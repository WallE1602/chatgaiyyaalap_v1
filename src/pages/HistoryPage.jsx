import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { collection, query, where, getDocs, getDoc, deleteDoc, doc } from 'firebase/firestore'

const toMillis = (ts) => {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (typeof ts === 'number') return ts
  const asDate = new Date(ts)
  return Number.isNaN(asDate.getTime()) ? 0 : asDate.getTime()
}

const hasUserSenderMetadata = (msgs = []) => msgs.some((m) => m?.role === 'user' && !!m?.senderUid)

const hasUserMessageFrom = (msgs = [], uid) => msgs.some((m) => m?.role === 'user' && m?.senderUid === uid)

const hasPatientParticipation = (convo, viewerUid) => {
  const msgs = convo.messages || []
  // Legacy records may not include senderUid metadata.
  if (!hasUserSenderMetadata(msgs)) return true
  return hasUserMessageFrom(msgs, viewerUid)
}

const hasDoctorParticipation = (convo) => {
  const msgs = convo.messages || []
  if (!convo.doctorId) return false
  // For old records without sender metadata, keep them visible if doctorId exists.
  if (!hasUserSenderMetadata(msgs)) return true
  return hasUserMessageFrom(msgs, convo.doctorId)
}

const isVisibleForRole = (convo, viewerUid, viewerRole) => {
  if (viewerRole === 'doctor') {
    if (convo.conversationType === 'patient_self') return false
    return convo.doctorId === viewerUid && !!convo.patientId && hasDoctorParticipation(convo)
  }
  if (viewerRole === 'patient') {
    if (convo.patientId !== viewerUid) return false
    if (convo.conversationType === 'patient_self') return true
    if (!convo.doctorId) {
      return convo.conversationType === 'patient_self' || hasPatientParticipation(convo, viewerUid)
    }
    return hasDoctorParticipation(convo)
  }
  return false
}

const getThreadKey = (convo, viewerRole) => {
  if (convo.threadKey) return convo.threadKey
  if (viewerRole === 'patient' && convo.doctorId) return `doctor:${convo.doctorId}`
  if (viewerRole === 'doctor' && convo.patientId) return `patient:${convo.patientId}`
  if (convo.doctorId && convo.patientId) return `${convo.doctorId}__${convo.patientId}`
  return convo.id
}

const formatProfileName = (profile, fallbackId) => {
  if (!profile) return fallbackId
  return profile.displayName || profile.name || profile.email || fallbackId
}

const hydrateParticipantNames = async (convos) => {
  const missingIds = new Set()

  convos.forEach((convo) => {
    if (!convo.doctorName && convo.doctorId) missingIds.add(convo.doctorId)
    if (!convo.patientName && convo.patientId) missingIds.add(convo.patientId)
  })

  if (missingIds.size === 0) return convos

  const entries = await Promise.all(
    Array.from(missingIds).map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (!snap.exists()) return [uid, uid]
        return [uid, formatProfileName(snap.data(), uid)]
      } catch {
        return [uid, uid]
      }
    }),
  )

  const nameByUid = new Map(entries)

  return convos.map((convo) => ({
    ...convo,
    doctorName: convo.doctorName || (convo.doctorId ? nameByUid.get(convo.doctorId) : convo.doctorName),
    patientName: convo.patientName || (convo.patientId ? nameByUid.get(convo.patientId) : convo.patientName),
  }))
}

const mergeThreadMessages = (left = [], right = []) => {
  const merged = new Map()
  const add = (msg, idx, source) => {
    const key = msg?.id
      ? String(msg.id)
      : `${msg?.role || 'unknown'}:${msg?.senderUid || 'anon'}:${msg?.timestamp || 0}:${idx}`

    if (!merged.has(key) || source === 'right') {
      merged.set(key, { ...msg, id: msg?.id ?? key })
    }
  }

  left.forEach((msg, idx) => add(msg, idx, 'left'))
  right.forEach((msg, idx) => add(msg, idx, 'right'))

  return Array.from(merged.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}

export default function HistoryPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    let cancelled = false

    const loadHistory = async () => {
      try {
        // Firestore doesn't support OR across fields, so we run two queries.
        const q1 = query(
          collection(db, 'conversations'),
          where('doctorId', '==', user.uid),
          where('status', '==', 'ended'),
        )
        const q2 = query(
          collection(db, 'conversations'),
          where('patientId', '==', user.uid),
          where('status', '==', 'ended'),
        )

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
        const docMap = new Map()
        ;[...snap1.docs, ...snap2.docs].forEach((d) => {
          if (!docMap.has(d.id)) docMap.set(d.id, { id: d.id, ...d.data() })
        })

        const docs = Array.from(docMap.values()).filter((convo) => isVisibleForRole(convo, user.uid, user?.role))
        docs.sort((a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt))

        const grouped = new Map()
        docs.forEach((convo) => {
          const groupId = getThreadKey(convo, user?.role)
          const current = grouped.get(groupId)

          if (!current) {
            grouped.set(groupId, {
              ...convo,
              id: groupId,
              sourceIds: [convo.id],
              messages: [...(convo.messages || [])],
            })
            return
          }

          current.sourceIds = Array.from(new Set([...(current.sourceIds || []), convo.id]))
          current.messages = mergeThreadMessages(current.messages || [], convo.messages || [])

          if (toMillis(convo.updatedAt || convo.createdAt) >= toMillis(current.updatedAt || current.createdAt)) {
            current.updatedAt = convo.updatedAt || current.updatedAt
            current.doctorName = convo.doctorName || current.doctorName
            current.patientName = convo.patientName || current.patientName
            current.doctorId = convo.doctorId || current.doctorId
            current.patientId = convo.patientId || current.patientId
            current.fromLang = convo.fromLang || current.fromLang
          }
        })

        const groupedDocs = Array.from(grouped.values())
        groupedDocs.sort((a, b) => toMillis(b.updatedAt || b.createdAt) - toMillis(a.updatedAt || a.createdAt))

        const hydratedDocs = await hydrateParticipantNames(groupedDocs)

        if (!cancelled) {
          setConversations(hydratedDocs)
        }
      } catch (err) {
        console.error('Failed to load conversations:', err)
        if (!cancelled) {
          toast.error('Failed to load history')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [user?.uid, user?.role])

  const handleDelete = async (convo) => {
    const ids = Array.from(new Set(convo.sourceIds?.length ? convo.sourceIds : [convo.id]))
    try {
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'conversations', id))))
      setConversations((prev) => prev.filter((c) => c.id !== convo.id))
      toast.success(t('history.deleteConfirm'))
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success(t('translate.chatCopied')))
  }

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm text-[#64748B]">Loading history…</p>
        </div>
      </main>
    )
  }

  // ── Main view ───────────────────────────────────────────────────
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ClockIcon className="h-7 w-7 text-[#0D9488]" />
          <h1 className="text-2xl font-bold text-[#0F172A]">{t('history.title')}</h1>
        </div>
        <p className="text-sm text-[#64748B]">{t('history.subtitle')}</p>
      </div>

      {conversations.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-4">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-[#0D9488]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">No conversations yet</h2>
          <p className="text-sm text-[#64748B] max-w-md mb-6">{t('history.noHistoryDesc')}</p>
          <button
            onClick={() => navigate('/translate')}
            className="px-5 py-2.5 rounded-xl bg-[#0D9488] text-white font-medium hover:bg-teal-600 transition-colors"
          >
            {t('nav.translate')}
          </button>
        </div>
      ) : (
        /* Conversation list */
        <div className="space-y-3">
          {conversations.map((convo) => {
            const msgs = convo.messages || []
            const msgCount = msgs.length
            const isExpanded = expandedId === convo.id
            const previewUser = msgs.find((m) => m.role === 'user')
            const previewBot = msgs.find((m) => m.role === 'bot')
            const isPatientSelfSession = user?.role === 'patient' && convo.conversationType === 'patient_self'
            const counterpartName = user?.role === 'doctor'
              ? (convo.patientName || 'Patient')
              : (isPatientSelfSession
                ? 'Personal Translation Session'
                : (convo.doctorName || (convo.doctorId ? `Doctor ${convo.doctorId.slice(0, 6)}` : 'Doctor')))

            return (
              <div
                key={convo.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all overflow-hidden"
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    {/* Patient + meta */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center border border-teal-200 flex-shrink-0">
                        <UserIcon className="h-4 w-4 text-[#0D9488]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B] truncate">
                          {counterpartName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                          <span>{msgCount} message{msgCount !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatDate(convo.updatedAt || convo.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleExpand(convo.id)}
                        title={isExpanded ? 'Collapse' : 'Expand'}
                        className="p-1.5 rounded-lg border border-slate-200 text-[#64748B] hover:text-[#0D9488] hover:border-teal-400 transition-colors"
                      >
                        {isExpanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(convo)}
                        title="Delete"
                        className="p-1.5 rounded-lg border border-slate-200 text-[#64748B] hover:text-red-500 hover:border-red-300 transition-colors"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Preview (collapsed) */}
                  {!isExpanded && previewUser && (
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">Chittagonian</p>
                        <p className="text-[#1E293B] font-bengali truncate">{previewUser.text}</p>
                      </div>
                      {previewBot && (
                        <>
                          <ArrowRightIcon className="h-3.5 w-3.5 text-[#94A3B8] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-0.5">Bangla</p>
                            <p className="text-[#1E293B] font-bengali truncate">{previewBot.text}</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded messages */}
                {isExpanded && msgs.length > 0 && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/50 max-h-96 overflow-y-auto">
                    {msgs.map((msg, i) => (
                      <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`relative max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                            msg.role === 'user'
                              ? 'bg-[#0D9488] text-white rounded-br-md'
                              : 'bg-white border border-slate-200 text-[#1E293B] rounded-bl-md'
                          }`}
                        >
                          <p className="font-bengali whitespace-pre-wrap break-words">{msg.text}</p>
                          <div className={`flex items-center gap-2 mt-1 text-[10px] ${msg.role === 'user' ? 'text-teal-200' : 'text-[#94A3B8]'}`}>
                            <span>{formatTime(msg.timestamp)}</span>
                            <button
                              onClick={() => handleCopy(msg.text)}
                              className={`p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'hover:text-white' : 'hover:text-[#0D9488]'}`}
                            >
                              <ClipboardDocumentIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  ArrowRightIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { db } from '../firebase'
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'

export default function HistoryPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [translations, setTranslations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return }
    const q = query(
      collection(db, 'translations'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
    )
    getDocs(q)
      .then((snap) => {
        setTranslations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
      .catch(() => {
        toast.error('Failed to load history')
      })
      .finally(() => setLoading(false))
  }, [user])

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'translations', id))
      setTranslations((prev) => prev.filter((t) => t.id !== id))
      toast.success(t('history.deleteConfirm'))
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => toast.success(t('translate.chatCopied')))
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

      {translations.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-4">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-[#0D9488]" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A] mb-2">No translations yet</h2>
          <p className="text-sm text-[#64748B] max-w-md mb-6">{t('history.noHistoryDesc')}</p>
          <button
            onClick={() => navigate('/translate')}
            className="px-5 py-2.5 rounded-xl bg-[#0D9488] text-white font-medium hover:bg-teal-600 transition-colors"
          >
            {t('nav.translate')}
          </button>
        </div>
      ) : (
        /* Translation records */
        <div className="space-y-3">
          {translations.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4">
                {/* Chittagonian (left) */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">Chittagonian</p>
                  <p className="text-sm font-semibold text-[#1E293B] font-bengali truncate">{rec.chittagonian}</p>
                </div>

                <ArrowRightIcon className="h-4 w-4 text-[#94A3B8] flex-shrink-0" />

                {/* Bangla (right) */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] mb-1">Standard Bangla</p>
                  <p className="text-sm text-[#1E293B] font-bengali truncate">{rec.bangla}</p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {/* Match badge */}
                  {rec.type === 'exact' || rec.type === 'keyword' ? (
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                      {rec.type}
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                      not found
                    </span>
                  )}
                  <button
                    onClick={() => handleCopy(rec.bangla)}
                    title="Copy translation"
                    className="p-1.5 rounded-lg border border-slate-200 text-[#64748B] hover:text-[#0D9488] hover:border-teal-400 transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(rec.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg border border-slate-200 text-[#64748B] hover:text-red-500 hover:border-red-300 transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Timestamp */}
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <ClockIcon className="h-3 w-3" />
                {formatDate(rec.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  PaperAirplaneIcon,
  ArrowsRightLeftIcon,
  MicrophoneIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  LanguageIcon,
  UserIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline'
import { MicrophoneIcon as MicSolid } from '@heroicons/react/24/solid'
import { lookupPhrase } from '../utils/phraseLookup'
import { db } from '../firebase'
import { collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, doc, query, where, serverTimestamp, runTransaction } from 'firebase/firestore'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const toMillis = (ts) => {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (typeof ts === 'number') return ts
  const asDate = new Date(ts)
  return Number.isNaN(asDate.getTime()) ? 0 : asDate.getTime()
}

const makeThreadKey = (doctorId, patientId) => {
  if (!doctorId || !patientId) return null
  return `${doctorId}__${patientId}`
}

const makeMessageId = (seed = 'msg') => `${seed}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const LOCAL_ONGOING_KEY_PREFIX = 'chatgaiyyaalap_ongoing_conversation_'

const getLocalOngoingKey = (uid) => `${LOCAL_ONGOING_KEY_PREFIX}${uid}`

const readLocalOngoingConversation = (uid) => {
  if (!uid || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getLocalOngoingKey(uid))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.messages) || parsed.messages.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

const writeLocalOngoingConversation = (uid, payload) => {
  if (!uid || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getLocalOngoingKey(uid), JSON.stringify(payload))
  } catch {
    // Ignore storage write failures (private mode/quota).
  }
}

const clearLocalOngoingConversation = (uid) => {
  if (!uid || typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(getLocalOngoingKey(uid))
  } catch {
    // Ignore storage cleanup failures.
  }
}

const normalizeFirestoreErrorCode = (err) => {
  const raw = typeof err?.code === 'string' ? err.code : ''
  if (!raw) return ''
  return raw.startsWith('firestore/') ? raw.slice('firestore/'.length) : raw
}

const getSyncFailureMessage = (err) => {
  const code = normalizeFirestoreErrorCode(err)
  if (code === 'permission-denied') {
    return 'Cloud sync blocked by Firebase rules. Conversation kept on this device.'
  }
  if (code === 'failed-precondition') {
    return 'Cloud sync requires a Firestore index. Conversation kept on this device.'
  }
  if (code === 'unavailable') {
    return 'Cloud sync is temporarily unavailable. Conversation kept on this device.'
  }
  return 'Cloud sync failed. Conversation kept on this device.'
}

const mergeConversationMessages = (existing = [], incoming = []) => {
  const merged = new Map()

  const addMessage = (msg, index, source) => {
    const key = msg?.id
      ? String(msg.id)
      : `${msg?.role || 'unknown'}:${msg?.senderUid || 'anon'}:${msg?.timestamp || 0}:${index}`

    // Prefer the latest incoming payload for identical IDs.
    if (!merged.has(key) || source === 'incoming') {
      merged.set(key, { ...msg, id: msg?.id ?? key })
    }
  }

  existing.forEach((msg, idx) => addMessage(msg, idx, 'existing'))
  incoming.forEach((msg, idx) => addMessage(msg, idx, 'incoming'))

  return Array.from(merged.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
}

export default function TranslationPage() {
  const location = useLocation()
  const { t } = useLanguage()
  const { user } = useAuth()

  const isDoctor = user?.role === 'doctor'

  // Patient selection state (doctors only)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientPicker, setShowPatientPicker] = useState(false)

  // Keep showPatientPicker in sync when user/role loads
  useEffect(() => {
    if (isDoctor && !selectedPatient) setShowPatientPicker(true)
  }, [isDoctor])

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [fromLang, setFromLang] = useState('chittagonian')
  const [conversationId, setConversationId] = useState(null)
  const [activeDoctor, setActiveDoctor] = useState(null)
  const [convoLoading, setConvoLoading] = useState(true)

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const draftTimerRef = useRef(null)
  const inputTextRef = useRef(inputText)
  const messagesRef = useRef(messages)
  const conversationIdRef = useRef(conversationId)
  const activeDoctorRef = useRef(null)
  inputTextRef.current = inputText

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  useEffect(() => {
    activeDoctorRef.current = activeDoctor
  }, [activeDoctor])

  const toLang = fromLang === 'chittagonian' ? 'bangla' : 'chittagonian'

  const LANG_LABELS = {
    chittagonian: t('translate.chittagonian'),
    bangla: t('translate.bangla'),
  }

  // ── Fetch patients from Firestore (doctors only) ────────────────
  const [allPatients, setAllPatients] = useState([])

  useEffect(() => {
    if (!isDoctor || !user?.uid) return
    const q = query(collection(db, 'users'), where('role', '==', 'patient'))
    getDocs(q)
      .then((snap) => {
        setAllPatients(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              uid: d.id,
              name: data.displayName || data.name || data.email || 'Unknown Patient',
              email: data.email || '',
              avatar: data.avatar || null,
            }
          }),
        )
      })
      .catch((err) => console.error('Fetch patients failed:', err))
  }, [isDoctor, user?.uid])

  const filteredPatients = patientSearch.trim()
    ? allPatients.filter(
        (p) =>
          p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.id.toLowerCase().includes(patientSearch.toLowerCase()),
      )
    : allPatients

  // Refresh selected patient details when the patient list finishes loading.
  useEffect(() => {
    if (!isDoctor || !selectedPatient?.id || allPatients.length === 0) return
    const match = allPatients.find((p) => p.id === selectedPatient.id)
    if (!match) return

    const nameChanged = (selectedPatient.name || '') !== (match.name || '')
    const emailChanged = (selectedPatient.email || '') !== (match.email || '')
    const avatarChanged = (selectedPatient.avatar || '') !== (match.avatar || '')
    if (nameChanged || emailChanged || avatarChanged) {
      setSelectedPatient(match)
    }
  }, [isDoctor, allPatients, selectedPatient?.id, selectedPatient?.name, selectedPatient?.email, selectedPatient?.avatar])

  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient)
    setShowPatientPicker(false)
    setPatientSearch('')
    setMessages([])
    setConversationId(null)
    setActiveDoctor(null)
    // Load active conversation for this patient
    await loadActiveConversation(patient.id)
  }

  const handleChangePatient = async () => {
    // End current conversation if messages exist before switching
    if (messages.length > 0) {
      await endConversation(true)
    }
    setSelectedPatient(null)
    setShowPatientPicker(true)
    setMessages([])
    setConversationId(null)
    setActiveDoctor(null)
  }

  // ── Load active conversation from Firestore ─────────────────────
  const loadActiveConversation = async (patientId) => {
    if (!user?.uid) return
    setConvoLoading(true)
    try {
      const ownerField = isDoctor ? 'doctorId' : 'patientId'
      const constraints = [
        where(ownerField, '==', user.uid),
        where('status', '==', 'active'),
      ]
      if (isDoctor && patientId) constraints.push(where('patientId', '==', patientId))

      const q = query(collection(db, 'conversations'), ...constraints)
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))

      // Ignore legacy malformed active records for patients.
      const candidates = isDoctor ? docs : docs.filter((item) => !!item.doctorId)
      const best = candidates[0]

      if (best) {
        setConversationId(best.id)
        setMessages(best.messages || [])
        if (best.fromLang) setFromLang(best.fromLang)

        if (!isDoctor) {
          const doctorCtx = best.doctorId
            ? { id: best.doctorId, name: best.doctorName || 'Doctor' }
            : null
          setActiveDoctor(doctorCtx)
        }

        if (isDoctor && best.patientId && !patientId) {
          const patient = allPatients.find((p) => p.id === best.patientId) || {
            id: best.patientId,
            uid: best.patientId,
            name: best.patientName || `Patient ${best.patientId.slice(0, 6)}`,
            email: '',
            avatar: null,
          }
          setSelectedPatient(patient)
          setShowPatientPicker(false)
        }
        return true
      } else {
        setConversationId(null)
        setMessages([])
        if (!isDoctor) setActiveDoctor(null)
        return false
      }
    } catch (err) {
      console.error('loadActiveConversation failed:', err)
      return false
    } finally {
      setConvoLoading(false)
    }
  }

  // ── Persist conversation to Firestore ───────────────────────────
  const persistConversation = async (msgs, convoId) => {
    if (!user?.uid) return convoId

    let resolvedConvoId = convoId
    let existingData = null

    if (resolvedConvoId) {
      try {
        const existingSnap = await getDoc(doc(db, 'conversations', resolvedConvoId))
        if (existingSnap.exists()) {
          existingData = existingSnap.data()

          // Do not reuse ended records; each new active chat should get its own
          // active doc (history keeps ended sessions grouped by thread later).
          if (existingData.status === 'ended') {
            resolvedConvoId = null
            existingData = null
          }

          // Guard against reusing a previous patient's conversation when doctor
          // switches context quickly.
          if (isDoctor && existingData) {
            if (existingData.doctorId && existingData.doctorId !== user.uid) {
              resolvedConvoId = null
              existingData = null
            }
            if (selectedPatient?.id && existingData?.patientId && existingData.patientId !== selectedPatient.id) {
              resolvedConvoId = null
              existingData = null
            }
          }

          // Patient account should not reuse conversation IDs that belong to
          // a different patient record.
          if (!isDoctor && existingData && existingData.patientId && existingData.patientId !== user.uid) {
            resolvedConvoId = null
            existingData = null
          }
        } else {
          // Stale local ID: recreate a fresh conversation document.
          resolvedConvoId = null
        }
      } catch (err) {
        console.error('persistConversation existing doc read failed:', err)
        // If read is blocked or fails for this ID, fallback to a fresh create path.
        resolvedConvoId = null
      }
    }

    if (!resolvedConvoId) {
      const lookupField = isDoctor ? 'doctorId' : 'patientId'
      const constraints = [where(lookupField, '==', user.uid), where('status', '==', 'active')]
      if (isDoctor && selectedPatient?.id) constraints.push(where('patientId', '==', selectedPatient.id))

      try {
        const existingSnap = await getDocs(query(collection(db, 'conversations'), ...constraints))
        if (!existingSnap.empty) {
          const docs = existingSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          docs.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))

          const best = isDoctor ? docs[0] : docs.find((item) => !!item.doctorId) || docs[0]
          resolvedConvoId = best.id
          existingData = best
        }
      } catch (err) {
        console.error('persistConversation active lookup failed:', err)
      }
    }

    let doctorId = isDoctor ? user.uid : (existingData?.doctorId || activeDoctorRef.current?.id || null)
    let doctorName = isDoctor ? user.name : (existingData?.doctorName || activeDoctorRef.current?.name || null)
    const patientId = isDoctor ? (selectedPatient?.id || existingData?.patientId || null) : user.uid
    const patientName = isDoctor
      ? (selectedPatient?.name || existingData?.patientName || 'Unknown')
      : (user.name || existingData?.patientName || 'Patient')

    if (!doctorId && !isDoctor) {
      try {
        const endedSnap = await getDocs(
          query(
            collection(db, 'conversations'),
            where('patientId', '==', user.uid),
            where('status', '==', 'ended'),
          ),
        )
        const endedDocs = endedSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => !!item.doctorId)
        endedDocs.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt))

        if (endedDocs[0]) {
          doctorId = endedDocs[0].doctorId
          doctorName = endedDocs[0].doctorName || doctorName
          setActiveDoctor({ id: doctorId, name: doctorName || 'Doctor' })
        }
      } catch (err) {
        console.error('persistConversation ended lookup failed:', err)
      }
    }

    // Patient-side chats without a doctor thread are kept locally and should
    // not attempt cloud sync, which can trigger rule errors.
    if (!isDoctor && !doctorId) {
      return null
    }

    if (isDoctor && !patientId) {
      return null
    }

    const threadKey = makeThreadKey(doctorId, patientId)

    const basePayload = {
      patientId,
      patientName,
      status: 'active',
      fromLang,
      updatedAt: serverTimestamp(),
    }
    if (doctorId) basePayload.doctorId = doctorId
    if (doctorName) basePayload.doctorName = doctorName
    if (threadKey) basePayload.threadKey = threadKey

    // New conversation create should avoid tx.get(non-existent doc), which can
    // be denied by stricter Firestore read rules.
    if (!resolvedConvoId) {
      const newRef = doc(collection(db, 'conversations'))
      await setDoc(newRef, {
        ...basePayload,
        messages: [...msgs],
        createdAt: serverTimestamp(),
      }, { merge: true })
      return newRef.id
    }

    const convoRef = doc(db, 'conversations', resolvedConvoId)
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(convoRef)
      const base = snap.exists() ? snap.data() : (existingData || {})
      const mergedMessages = mergeConversationMessages(base.messages || [], msgs)

      tx.set(convoRef, {
        ...basePayload,
        messages: mergedMessages,
      }, { merge: true })
    })

    return convoRef.id
  }

  // ── End / save conversation ─────────────────────────────────────
  const endConversation = async (silent = false) => {
    if (messages.length === 0) {
      if (!silent) toast.error(t('translate.noMessagesToSave'))
      return
    }
    try {
      let targetId = conversationIdRef.current
      if (!targetId) {
        targetId = await persistConversation([...messagesRef.current], null)
      }
      if (targetId) {
        await setDoc(doc(db, 'conversations', targetId), { status: 'ended', updatedAt: serverTimestamp() }, { merge: true })
      }

      // Clear draft
      deleteDoc(doc(db, 'drafts', user.uid)).catch(() => {})
      if (!silent) toast.success(t('translate.conversationSaved'))
    } catch {
      if (!silent) toast.error('Failed to save conversation')
    }
    setMessages([])
    setConversationId(null)
  }

  const handleSaveAndEnd = async () => {
    await endConversation()
    if (isDoctor) {
      setSelectedPatient(null)
      setShowPatientPicker(true)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // ── Load active conversation + draft on mount ───────────────────
  useEffect(() => {
    if (!user?.uid) { setConvoLoading(false); return }
    const init = async () => {
      // Patients: load active conversation immediately
      // Doctors: wait for patient selection (handled in handleSelectPatient)
      if (!isDoctor) {
        const loadedRemote = await loadActiveConversation()
        if (!loadedRemote) {
          const localOngoing = readLocalOngoingConversation(user.uid)
          if (localOngoing) {
            setMessages(localOngoing.messages || [])
            setConversationId(localOngoing.conversationId || null)
            if (localOngoing.fromLang) setFromLang(localOngoing.fromLang)
            if (localOngoing.activeDoctor?.id) {
              setActiveDoctor(localOngoing.activeDoctor)
            }
          }
        }
      } else {
        const loadedRemote = await loadActiveConversation()
        if (!loadedRemote) {
          const localOngoing = readLocalOngoingConversation(user.uid)
          if (localOngoing) {
            setMessages(localOngoing.messages || [])
            setConversationId(localOngoing.conversationId || null)
            if (localOngoing.fromLang) setFromLang(localOngoing.fromLang)
            if (localOngoing.selectedPatient?.id) {
              setSelectedPatient(localOngoing.selectedPatient)
              setShowPatientPicker(false)
            }
          }
        }
      }
      // Load draft
      try {
        const draftSnap = await getDoc(doc(db, 'drafts', user.uid))
        if (draftSnap.exists() && draftSnap.data().text) {
          setInputText(draftSnap.data().text)
        }
      } catch (err) {
        console.error('Draft load failed:', err)
      }
    }
    init()
  }, [user?.uid, isDoctor])

  // Keep a local backup of ongoing patient conversations to survive route changes.
  useEffect(() => {
    if (!user?.uid) return
    if (messages.length === 0) {
      clearLocalOngoingConversation(user.uid)
      return
    }

    const backup = {
      conversationId,
      fromLang,
      messages,
      updatedAt: Date.now(),
    }

    if (isDoctor) {
      backup.selectedPatient = selectedPatient
    } else {
      backup.activeDoctor = activeDoctor
    }

    writeLocalOngoingConversation(user.uid, {
      ...backup,
    })
  }, [user?.uid, isDoctor, messages, conversationId, fromLang, activeDoctor, selectedPatient])

  // ── Save draft on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(draftTimerRef.current)
      if (user?.uid && inputTextRef.current.trim()) {
        setDoc(doc(db, 'drafts', user.uid), { text: inputTextRef.current, updatedAt: serverTimestamp() }).catch(() => {})
      } else if (user?.uid) {
        deleteDoc(doc(db, 'drafts', user.uid)).catch(() => {})
      }
    }
  }, [user?.uid])

  // ── Debounced draft save on input change ───────────────────────
  useEffect(() => {
    if (!user?.uid) return
    clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      if (inputText.trim()) {
        setDoc(doc(db, 'drafts', user.uid), { text: inputText, updatedAt: serverTimestamp() }).catch(() => {})
      } else {
        deleteDoc(doc(db, 'drafts', user.uid)).catch(() => {})
      }
    }, 800)
  }, [inputText, user?.uid])

  // Pre-fill from PhraseCard / PhraseLibrary navigation
  useEffect(() => {
    const state = location.state
    if (state?.prefill) {
      setInputText(state.prefill)
      if (state.fromLang) setFromLang(state.fromLang)
      window.history.replaceState({}, '')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [location.state])

  // ── Send message & translate ────────────────────────────────────────────
  const handleSend = useCallback(
    async (text, inputMode = 'text') => {
      const trimmed = (text ?? inputText).trim()
      if (!trimmed || isLoading) return

      const baseMessages = [...messagesRef.current]
      const activeConvoId = conversationIdRef.current

      const userMsg = {
        id: makeMessageId(user?.uid || 'user'),
        role: 'user',
        senderUid: user.uid,
        senderName: user.name || user.email,
        text: trimmed,
        inputMode,
        fromLang,
        toLang,
        timestamp: Date.now(),
      }

      const messagesWithUser = [...baseMessages, userMsg]
      setMessages(messagesWithUser)
      setInputText('')
      setIsLoading(true)

      try {
        // Small delay for smooth UX transition
        await new Promise((r) => setTimeout(r, 300))
        const { result, matched, type } = lookupPhrase(trimmed)
        const botMsg = {
          id: makeMessageId('bot'),
          role: 'bot',
          text: result,
          matchType: type,
          matched,
          fromLang,
          toLang,
          timestamp: Date.now(),
        }

        const updatedMessages = [...messagesWithUser, botMsg]
        setMessages(updatedMessages)

        // Persist conversation to Firestore
        try {
          const newId = await persistConversation(updatedMessages, activeConvoId)
          if (newId && newId !== conversationIdRef.current) {
            setConversationId(newId)
          }
        } catch (err) {
          const code = normalizeFirestoreErrorCode(err)
          console.error('persistConversation failed:', { code, err })
          toast.error(getSyncFailureMessage(err), { id: 'sync-failed' })
        }

        // Clear draft after successful send
        if (user?.uid) {
          deleteDoc(doc(db, 'drafts', user.uid)).catch(() => {})
        }

        // Save individual translation record
        if (user?.uid) {
          addDoc(collection(db, 'translations'), {
            userId: user.uid,
            chittagonian: trimmed,
            bangla: result,
            type,
            timestamp: serverTimestamp(),
          }).catch(() => {})
        }
      } catch {
        toast.error(t('translate.failedTranslation'))
      } finally {
        setIsLoading(false)
        inputRef.current?.focus()
      }
    },
    [inputText, isLoading, fromLang, toLang, t, user],
  )

  // ── Swap languages ──────────────────────────────────────────────
  const handleSwap = () => {
    setFromLang((prev) => (prev === 'chittagonian' ? 'bangla' : 'chittagonian'))
  }

  // ── Copy a message ──────────────────────────────────────────────
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t('translate.chatCopied'))
    })
  }

  // ── Clear chat ──────────────────────────────────────────────────
  const handleClear = async () => {
    // Auto-save before clearing if there are messages
    if (messages.length > 0) {
      await endConversation(true)
    }
    setMessages([])
    setConversationId(null)
    toast.success(t('translate.chatClearConfirm'))
  }

  // Doctor must select a patient before chatting
  const chatDisabled = isDoctor && !selectedPatient

  // ── Voice Input ─────────────────────────────────────────────────
  const handleVoiceToggle = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      clearTimeout(silenceTimerRef.current)
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error(t('translate.voiceNotSupported'))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'bn-BD'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      clearTimeout(silenceTimerRef.current)
      const transcript = e.results[0][0].transcript
      if (transcript.trim()) {
        setInputText(transcript)
      }
    }
    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current)
      setIsListening(false)
    }
    recognition.onerror = () => {
      clearTimeout(silenceTimerRef.current)
      setIsListening(false)
      toast.error(t('translate.voiceError'))
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)

    // Stop recording after 5 seconds of silence
    silenceTimerRef.current = setTimeout(() => {
      recognition.stop()
    }, 5000)
  }

  // ── Key handler ─────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Format time ─────────────────────────────────────────────────
  const formatTime = (ts) => {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <main className="max-w-3xl mx-auto px-4 py-4 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* ── Header bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-[#0D9488]" />
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] leading-tight">{t('translate.title')}</h1>
            <p className="text-xs text-[#64748B]">
              <span className="font-medium text-[#0D9488]">{LANG_LABELS[fromLang]}</span>
              {' → '}
              <span className="font-medium text-[#0D9488]">{LANG_LABELS[toLang]}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language swap */}
          <button
            onClick={handleSwap}
            title={t('translate.swapLanguages')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-[#64748B] hover:text-[#0D9488] hover:border-teal-400 transition-colors"
          >
            <ArrowsRightLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('translate.chatDirection')}</span>
          </button>

          {/* Save & End */}
          {messages.length > 0 && (
            <button
              onClick={handleSaveAndEnd}
              title={t('translate.endConversation')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-teal-300 bg-teal-50 text-[#0D9488] hover:bg-teal-100 transition-colors"
            >
              <BookmarkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('translate.saveConversation')}</span>
            </button>
          )}

          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              title={t('translate.chatClearHistory')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-[#64748B] hover:text-red-500 hover:border-red-300 transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t('translate.chatClearHistory')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Patient selection bar (doctors only) ────────────── */}
      {isDoctor && (
        <div className="py-3 border-b border-slate-200">
          {showPatientPicker ? (
            /* Search & select */
            <div>
              <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5" />
                {t('translate.selectPatient')}
              </label>
              <div className="relative mt-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder={t('translate.searchPatient')}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder:text-slate-300"
                />
              </div>

              {/* Results list */}
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] text-center py-3">{t('translate.noPatientsFound')}</p>
                ) : (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-teal-50 transition-colors group"
                    >
                      {p.avatar ? (
                        <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                          <UserIcon className="h-4 w-4 text-[#94A3B8]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate group-hover:text-[#0D9488]">{p.name}</p>
                        <p className="text-[10px] text-[#94A3B8] truncate">{t('translate.patientId')}: {p.id.slice(0, 8)}</p>
                      </div>
                      <CheckCircleIcon className="h-4 w-4 text-[#0D9488] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : selectedPatient ? (
            /* Selected patient badge */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">{t('translate.chattingWith')}:</span>
                {selectedPatient.avatar ? (
                  <img src={selectedPatient.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-teal-300" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center border border-teal-300">
                    <UserIcon className="h-3 w-3 text-[#0D9488]" />
                  </div>
                )}
                <span className="text-sm font-semibold text-[#0D9488]">{selectedPatient.name}</span>
                <span className="text-[10px] text-[#94A3B8]">({selectedPatient.id.slice(0, 8)})</span>
              </div>
              <button
                onClick={handleChangePatient}
                className="text-xs font-medium text-[#64748B] hover:text-[#0D9488] px-2 py-1 rounded-lg border border-slate-200 hover:border-teal-400 transition-colors"
              >
                {t('translate.changePatient')}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Chat area ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
        {chatDisabled ? (
          /* Prompt doctor to select a patient */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-4">
              <UserIcon className="h-8 w-8 text-[#0D9488]" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">{t('translate.selectPatient')}</h2>
            <p className="text-sm text-[#64748B] max-w-md">{t('translate.noPatientSelected')}</p>
          </div>
        ) : messages.length === 0 && !isLoading ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center mb-4">
              <LanguageIcon className="h-8 w-8 text-[#0D9488]" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">{t('translate.chatEmptyTitle')}</h2>
            <p className="text-sm text-[#64748B] max-w-md mb-6">{t('translate.chatEmptyDesc')}</p>
            <div className="flex flex-col gap-2 text-left">
              {[t('translate.chatEmptyHint1'), t('translate.chatEmptyHint2'), t('translate.chatEmptyHint3')].map(
                (hint, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-[#64748B]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {hint}
                  </div>
                ),
              )}
            </div>
          </div>
        ) : (
          /* Messages */
          messages.map((msg) => {
            // For user-sent messages: show on right if I sent it, left otherwise
            // For bot (translation) messages: always show on left
            const isMine = msg.role === 'user' && msg.senderUid === user?.uid
            const isTranslation = msg.role === 'bot'
            const showRight = isMine
            // Legacy messages without senderUid: use old logic
            const effectiveRight = msg.senderUid ? showRight : msg.role === 'user'

            return (
            <div key={msg.id} className={`flex ${effectiveRight ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`group relative max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl ${
                  effectiveRight
                    ? 'bg-[#0D9488] text-white rounded-br-md'
                    : 'bg-white border border-slate-200 text-[#1E293B] rounded-bl-md shadow-sm'
                }`}
              >
                {/* Sender name + language tag */}
                <div
                  className={`flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider ${
                    effectiveRight ? 'text-teal-100' : 'text-[#64748B]'
                  }`}
                >
                  {msg.role === 'user' && msg.senderName && msg.senderUid !== user?.uid && (
                    <span className="capitalize">{msg.senderName} ·</span>
                  )}
                  {msg.role === 'user' ? LANG_LABELS[msg.fromLang] : LANG_LABELS[msg.toLang]}
                  {msg.inputMode === 'voice' && (
                    <MicrophoneIcon className={`h-3 w-3 ${effectiveRight ? 'text-teal-200' : 'text-[#0D9488]'}`} />
                  )}
                </div>

                {/* Message text */}
                <p className="font-bengali text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>

                {/* Timestamp + copy */}
                <div
                  className={`flex items-center gap-2 mt-1.5 text-[10px] ${
                    effectiveRight ? 'text-teal-200' : 'text-[#94A3B8]'
                  }`}
                >
                  <span>{formatTime(msg.timestamp)}</span>
                  <button
                    onClick={() => handleCopy(msg.text)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ${
                      effectiveRight ? 'hover:text-white' : 'hover:text-[#0D9488]'
                    }`}
                    title={t('translate.chatCopyMessage')}
                  >
                    <ClipboardDocumentIcon className="h-3 w-3" />
                  </button>
                </div>

                {/* Match type badge (bot messages only) */}
                {msg.role === 'bot' && msg.matchType && (
                  <div className="mt-2">
                    {msg.matched ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                        ✓ Medical phrase library
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        ⚠ Phrase not found in database
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            )
          })
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md shadow-sm px-5 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input bar ───────────────────────────────────────── */}
      <div className={`pt-3 border-t border-slate-200 ${chatDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-pulse">
            <MicSolid className="h-4 w-4" />
            {t('translate.chatListening')}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Voice button */}
          <button
            onClick={handleVoiceToggle}
            title={isListening ? t('translate.stopListening') : t('translate.startVoice')}
            className={`flex-shrink-0 p-3 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                : 'bg-slate-100 text-[#64748B] hover:bg-teal-50 hover:text-[#0D9488]'
            }`}
          >
            <MicSolid className="h-5 w-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('translate.chatInputPlaceholder')}
              disabled={isLoading}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-[#1E293B] font-bengali text-[15px] focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none leading-relaxed placeholder:text-slate-300 disabled:opacity-50 max-h-32 overflow-y-auto"
              style={{ minHeight: '48px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="flex-shrink-0 p-3 rounded-xl bg-[#0D9488] text-white hover:bg-teal-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="text-[10px] text-[#94A3B8] text-center mt-2">
          Enter ↵ {t('translate.chatSend')} · Shift+Enter new line · {t('translate.chatVoiceInput')} 🎙️
        </p>
      </div>
    </main>
  )
}

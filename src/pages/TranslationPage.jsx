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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'

const CONVERSATIONS_KEY = 'chatgaiyyaalap_conversations'
const USERS_KEY = 'chatgaiyyaalap_users'

function getStoredConversations() {
  try {
    return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY)) || []
  } catch {
    return []
  }
}

function storeConversations(convos) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convos))
}

function getPatients() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY)) || []
    return users
      .filter((u) => (u.role || '').toLowerCase() === 'patient')
      .map(({ password, ...rest }) => ({
        ...rest,
        id: rest.id || rest.uid || rest.email || crypto.randomUUID(),
        name: rest.name || rest.displayName || rest.email || 'Unknown Patient',
      }))
  } catch {
    return []
  }
}

let msgId = 0

export default function TranslationPage() {
  const location = useLocation()
  const { t } = useLanguage()
  const { user } = useAuth()

  const isDoctor = user?.role === 'doctor'

  // Patient selection state (doctors only)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientPicker, setShowPatientPicker] = useState(isDoctor)

  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [fromLang, setFromLang] = useState('chittagonian')

  const chatEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const silenceTimerRef = useRef(null)

  const toLang = fromLang === 'chittagonian' ? 'bangla' : 'chittagonian'

  const LANG_LABELS = {
    chittagonian: t('translate.chittagonian'),
    bangla: t('translate.bangla'),
  }

  // ── Patient search ──────────────────────────────────────────────
  const allPatients = getPatients()
  const filteredPatients = patientSearch.trim()
    ? allPatients.filter(
        (p) =>
          p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
          p.id.toLowerCase().includes(patientSearch.toLowerCase()),
      )
    : allPatients

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient)
    setShowPatientPicker(false)
    setPatientSearch('')
    setMessages([])
  }

  const handleChangePatient = () => {
    // Save current conversation if messages exist before switching
    if (messages.length > 0 && selectedPatient) {
      saveConversation()
    }
    setSelectedPatient(null)
    setShowPatientPicker(true)
    setMessages([])
  }

  // ── Save conversation ───────────────────────────────────────────
  const saveConversation = (silent = false) => {
    if (messages.length === 0) {
      if (!silent) toast.error(t('translate.noMessagesToSave'))
      return
    }

    const convo = {
      id: crypto.randomUUID(),
      userId: user.id,
      doctorId: isDoctor ? user.id : null,
      doctorName: isDoctor ? user.name : null,
      patientId: isDoctor ? (selectedPatient?.id || null) : user.id,
      patientName: isDoctor ? (selectedPatient?.name || 'Unknown') : user.name,
      messages: [...messages],
      createdAt: messages[0]?.timestamp || Date.now(),
      endedAt: Date.now(),
    }

    const stored = getStoredConversations()
    storeConversations([convo, ...stored])
    if (!silent) toast.success(t('translate.conversationSaved'))
    setMessages([])
  }

  const handleSaveAndEnd = () => {
    saveConversation()
    if (isDoctor) {
      setSelectedPatient(null)
      setShowPatientPicker(true)
    }
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Pre-fill from PhraseCard navigation
  useEffect(() => {
    const state = location.state
    if (state?.prefill) {
      setInputText(state.prefill)
      if (state.fromLang) setFromLang(state.fromLang)
      window.history.replaceState({}, '')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [location.state])

  // Pre-fill from PhraseLibrary localStorage
  useEffect(() => {
    const pending = localStorage.getItem('pendingTranslation')
    if (pending) {
      setInputText(pending)
      localStorage.removeItem('pendingTranslation')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  // ── Send message & translate ────────────────────────────────────────────
  const handleSend = useCallback(
    async (text, inputMode = 'text') => {
      const trimmed = (text ?? inputText).trim()
      if (!trimmed || isLoading) return

      const userMsg = {
        id: ++msgId,
        role: 'user',
        text: trimmed,
        inputMode,
        fromLang,
        toLang,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInputText('')
      setIsLoading(true)

      try {
        // Small delay for smooth UX transition
        await new Promise((r) => setTimeout(r, 300))
        const { result, matched, type } = lookupPhrase(trimmed)
        const botMsg = {
          id: ++msgId,
          role: 'bot',
          text: result,
          matchType: type,
          matched,
          fromLang,
          toLang,
          timestamp: Date.now(),
        }
        setMessages((prev) => [...prev, botMsg])

        // Save to Firestore if logged in
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
    [inputText, isLoading, fromLang, toLang, t],
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
  const handleClear = () => {
    // Auto-save before clearing if there are messages
    if (messages.length > 0) {
      saveConversation(true)
    }
    setMessages([])
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
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`group relative max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#0D9488] text-white rounded-br-md'
                    : 'bg-white border border-slate-200 text-[#1E293B] rounded-bl-md shadow-sm'
                }`}
              >
                {/* Language tag */}
                <div
                  className={`flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider ${
                    msg.role === 'user' ? 'text-teal-100' : 'text-[#64748B]'
                  }`}
                >
                  {msg.role === 'user' ? LANG_LABELS[msg.fromLang] : LANG_LABELS[msg.toLang]}
                  {msg.inputMode === 'voice' && (
                    <MicrophoneIcon className={`h-3 w-3 ${msg.role === 'user' ? 'text-teal-200' : 'text-[#0D9488]'}`} />
                  )}
                </div>

                {/* Message text */}
                <p className="font-bengali text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>

                {/* Timestamp + copy */}
                <div
                  className={`flex items-center gap-2 mt-1.5 text-[10px] ${
                    msg.role === 'user' ? 'text-teal-200' : 'text-[#94A3B8]'
                  }`}
                >
                  <span>{formatTime(msg.timestamp)}</span>
                  <button
                    onClick={() => handleCopy(msg.text)}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ${
                      msg.role === 'user' ? 'hover:text-white' : 'hover:text-[#0D9488]'
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
          ))
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

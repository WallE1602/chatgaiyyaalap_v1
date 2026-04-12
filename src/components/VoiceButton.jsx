import { MicrophoneIcon } from '@heroicons/react/24/solid'
import { useLanguage } from '../context/LanguageContext'

export default function VoiceButton({ isListening, onToggle }) {
  const { t } = useLanguage()

  return (
    <button
      onClick={onToggle}
      title={isListening ? t('translate.stopListening') : t('translate.startVoice')}
      className={`relative p-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
        isListening
          ? 'bg-red-100 text-red-600 focus:ring-red-400'
          : 'bg-slate-100 text-[#64748B] hover:bg-teal-50 hover:text-[#0D9488] focus:ring-teal-400'
      }`}
    >
      {/* Animated pulse rings — only visible while listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
          <span className="absolute inset-[-6px] rounded-full border-2 border-red-400 opacity-40 animate-pulse" />
        </>
      )}

      <MicrophoneIcon className="relative z-10 h-5 w-5" />
    </button>
  )
}

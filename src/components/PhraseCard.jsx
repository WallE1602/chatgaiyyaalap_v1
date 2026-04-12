import { useNavigate } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../context/LanguageContext'

export default function PhraseCard({ phrase }) {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const handleClick = () => {
    navigate('/translate', {
      state: { prefill: phrase.chittagonian, fromLang: 'chittagonian' },
    })
  }

  return (
    <button
      onClick={handleClick}
      className="group w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
    >
      {/* Chittagonian phrase */}
      <p className="text-sm font-semibold text-[#1E293B] mb-2 leading-snug">
        {phrase.chittagonian}
      </p>

      {/* Standard Bangla translation */}
      <p className="text-sm text-[#64748B] font-bengali leading-relaxed">{phrase.bangla}</p>

      {/* Hover CTA */}
      <div className="mt-3 flex items-center gap-1 text-xs text-[#0D9488] opacity-0 group-hover:opacity-100 transition-opacity">
        <span>{t('phrases.useInTranslator')}</span>
        <ArrowRightIcon className="h-3 w-3" />
      </div>
    </button>
  )
}

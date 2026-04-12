import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../context/LanguageContext'

export default function LangToggle({ onSwap }) {
  const { t } = useLanguage()

  return (
    <button
      onClick={onSwap}
      title={t('translate.swapLanguages')}
      className="p-3 rounded-full bg-white border border-slate-200 shadow-sm text-[#64748B] hover:text-[#0D9488] hover:border-teal-400 hover:shadow-md active:scale-90 transition-all"
    >
      <ArrowsRightLeftIcon className="h-5 w-5" />
    </button>
  )
}

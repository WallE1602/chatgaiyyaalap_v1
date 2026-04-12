import { ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../context/LanguageContext'

export default function TranslationCard({ text, isLoading, toLang, onCopy, onReverseCheck }) {
  const { t } = useLanguage()

  const LANG_LABELS = {
    chittagonian: t('translate.chittagoni'),
    bangla: t('translate.stdBangla'),
  }
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-semibold text-[#64748B]">
          {LANG_LABELS[toLang] ?? 'Translation'}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={onReverseCheck}
            disabled={!text || isLoading}
            title={t('translate.reverseCheckTitle')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[#64748B] hover:text-[#0D9488] hover:border-teal-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" />
            {t('translate.reverseCheck')}
          </button>

          <button
            onClick={onCopy}
            disabled={!text || isLoading}
            title={t('translate.copyTitle')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[#64748B] hover:text-[#0D9488] hover:border-teal-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            {t('translate.copy')}
          </button>
        </div>
      </div>

      {/* Output area */}
      <div className="flex-1 min-h-[220px] p-4 rounded-xl border border-slate-200 bg-slate-50 font-bengali text-base text-[#1E293B]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <span className="animate-spin h-8 w-8 border-4 border-[#0D9488] border-t-transparent rounded-full" />
            <span className="text-sm text-[#64748B]">{t('translate.translating')}</span>
          </div>
        ) : text ? (
          <p className="leading-loose">{text}</p>
        ) : (
          <p className="text-[#64748B] italic text-sm">{t('translate.resultPlaceholder')}</p>
        )}
      </div>
    </div>
  )
}

import { ClockIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../context/LanguageContext'

export default function HistorySidebar({ history }) {
  const { t } = useLanguage()

  const LANG_LABELS = {
    chittagonian: t('translate.chittagoni'),
    bangla: t('translate.stdBangla'),
  }

  if (!history.length) return null

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <ClockIcon className="h-4 w-4 text-[#64748B]" />
        <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">
          {t('translate.recentTranslations')}
        </h2>
      </div>

      <div className="space-y-2">
        {history.map((item, i) => (
          <div
            key={item.timestamp ?? i}
            className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 items-start hover:border-slate-300 transition-colors"
          >
            {/* Index badge */}
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>

            {/* Source / Target columns */}
            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <div>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-0.5">
                  {LANG_LABELS[item.fromLang]}
                </p>
                <p className="text-sm text-[#1E293B] font-bengali truncate">{item.input}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-0.5">
                  {LANG_LABELS[item.toLang]}
                </p>
                <p className="text-sm text-[#1E293B] font-bengali truncate">{item.output}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

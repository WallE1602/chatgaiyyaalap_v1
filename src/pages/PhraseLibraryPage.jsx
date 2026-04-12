import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import medicalPhrases from '../data/medicalPhrases.json'
import { useLanguage } from '../context/LanguageContext'

const CATEGORIES = [...new Set(medicalPhrases.map((p) => p.category))]

export default function PhraseLibraryPage() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { t } = useLanguage()

  const phrases = medicalPhrases.filter((p) => p.category === activeCategory)

  const filtered = search.trim()
    ? medicalPhrases.filter(
        (p) =>
          p.chittagonian.includes(search) ||
          p.bangla.includes(search) ||
          p.keywords.some((kw) => kw.includes(search)),
      )
    : phrases

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat)
    setSearch('')
  }

  const handlePhraseClick = (phrase) => {
    navigate('/translate', { state: { prefill: phrase.chittagonian } })
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">{t('phrases.title')}</h1>
        <p className="text-[#64748B] text-sm">
          {t('phrases.desc')}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B] pointer-events-none" />
        <input
          type="text"
          placeholder={t('phrases.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-[#1E293B] text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-bengali"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat && !search.trim()
                ? 'bg-[#0D9488] text-white shadow-sm shadow-teal-200'
                : 'bg-white text-[#64748B] border border-slate-200 hover:border-teal-400 hover:text-[#0D9488]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Count */}
      {!search && (
        <p className="text-xs text-[#64748B] mb-4">
          {filtered.length} {filtered.length !== 1 ? t('phrases.countSuffixPlural') : t('phrases.countSuffix')} {t('phrases.countIn')}{' '}
          <span className="font-medium text-[#0D9488]">{activeCategory}</span>
        </p>
      )}

      {/* Phrase list — rows with chittagonian left, bangla right */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((phrase) => (
            <button
              key={phrase.id}
              onClick={() => handlePhraseClick(phrase)}
              className="group w-full flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-teal-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 text-left"
            >
              <p className="flex-1 text-sm font-semibold text-[#1E293B] font-bengali">
                {phrase.chittagonian}
              </p>
              <ArrowRightIcon className="h-4 w-4 text-[#94A3B8] flex-shrink-0 group-hover:text-[#0D9488] transition-colors" />
              <p className="flex-1 text-sm text-[#64748B] font-bengali text-right">
                {phrase.bangla}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-[#64748B]">
          <MagnifyingGlassIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t('phrases.noResults')} &ldquo;{search}&rdquo;</p>
          <p className="text-sm mt-1">{t('phrases.noResultsTip')}</p>
        </div>
      )}
    </main>
  )
}

import medicalPhrases from '../data/medicalPhrases.json'

/**
 * Bidirectional phrase lookup between Chittagonian and Standard Bangla.
 * Tries exact match first, then keyword match, then returns a fallback.
 */
const FALLBACK_MESSAGE = 'এই বাক্যাংশটি আমাদের ডেটাবেজে নেই। অনুগ্রহ করে ম্যানুয়ালি অনুবাদ করুন।'

const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase()

const getDirectionConfig = (fromLang = 'chittagonian') => {
  const sourceField = fromLang === 'bangla' ? 'bangla' : 'chittagonian'
  const targetField = sourceField === 'bangla' ? 'chittagonian' : 'bangla'
  const keywordField = sourceField === 'bangla' ? 'bangla_keywords' : 'keywords'
  return { sourceField, targetField, keywordField }
}

const keywordScore = (normalizedInput, keywords = []) => {
  return keywords.reduce((score, kw) => {
    const normalizedKeyword = normalize(kw)
    if (!normalizedKeyword) return score
    return normalizedInput.includes(normalizedKeyword) ? score + 1 : score
  }, 0)
}

export function lookupPhrase(input, options = {}) {
  const trimmed = (input || '').trim()
  if (!trimmed) {
    return {
      result: FALLBACK_MESSAGE,
      matched: false,
      type: 'not_found',
    }
  }

  const { fromLang = 'chittagonian' } = options
  const { sourceField, targetField, keywordField } = getDirectionConfig(fromLang)
  const normalizedInput = normalize(trimmed)

  // Exact match on selected source language field
  const exactMatch = medicalPhrases.find(
    (p) => normalize(p[sourceField]) === normalizedInput,
  )
  if (exactMatch) {
    return { result: exactMatch[targetField], matched: true, type: 'exact' }
  }

  // Keyword match with scoring to reduce wrong first-hit results.
  const ranked = medicalPhrases
    .map((phrase) => {
      const keywords = Array.isArray(phrase[keywordField]) && phrase[keywordField].length > 0
        ? phrase[keywordField]
        : (Array.isArray(phrase.keywords) ? phrase.keywords : [])
      return { phrase, score: keywordScore(normalizedInput, keywords) }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  if (ranked.length > 0) {
    return { result: ranked[0].phrase[targetField], matched: true, type: 'keyword' }
  }

  // No match
  return {
    result: FALLBACK_MESSAGE,
    matched: false,
    type: 'not_found',
  }
}

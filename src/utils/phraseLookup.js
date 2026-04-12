import medicalPhrases from '../data/medicalPhrases.json'

/**
 * Look up a Chittagonian phrase and return its Standard Bangla translation.
 * Tries exact match first, then keyword match, then returns a fallback.
 */
export function lookupPhrase(input) {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      result: 'এই বাক্যাংশটি আমাদের ডেটাবেজে নেই। অনুগ্রহ করে ম্যানুয়ালি অনুবাদ করুন।',
      matched: false,
      type: 'not_found',
    }
  }

  // Exact match on chittagonian field
  const exactMatch = medicalPhrases.find(
    (p) => p.chittagonian === trimmed,
  )
  if (exactMatch) {
    return { result: exactMatch.bangla, matched: true, type: 'exact' }
  }

  // Keyword match — check if input includes any keyword from any phrase
  const keywordMatch = medicalPhrases.find(
    (p) => p.keywords.some((kw) => trimmed.includes(kw)),
  )
  if (keywordMatch) {
    return { result: keywordMatch.bangla, matched: true, type: 'keyword' }
  }

  // No match
  return {
    result: 'এই বাক্যাংশটি আমাদের ডেটাবেজে নেই। অনুগ্রহ করে ম্যানুয়ালি অনুবাদ করুন।',
    matched: false,
    type: 'not_found',
  }
}

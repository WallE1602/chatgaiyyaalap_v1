/**
 * Mock translation function for demo/prototype purposes.
 * Simulates a 1-second network delay and returns a placeholder translation.
 *
 * @param {string} text - The source text to translate
 * @param {'chittagonian'|'bangla'} fromLang - Source language
 * @param {'chittagonian'|'bangla'} toLang - Target language
 * @returns {Promise<string>} Resolved mock translation string
 */
export const mockTranslate = (text, fromLang, toLang) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[Mock translation of: "${text}"]`)
    }, 1000)
  })
}

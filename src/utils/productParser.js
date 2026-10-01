/**
 * productParser.js
 * Parses product strings of format "MA MAU SIZE" from Excel cells.
 * Handles: multi-word colors, + separator with code inheritance, Vietnamese Unicode.
 */

// SIZE list — add new sizes here as needed
export const SIZE_LIST = [
  'XXXL', 'XXL', 'XL', 'XS',
  '7XL', '6XL', '5XL', '4XL', '3XL', '2XL',
  'L', 'M', 'S',
]
const SIZE_SET = new Set(SIZE_LIST)

/**
 * Return true if char code is any kind of whitespace or invisible character.
 * Used in normalizeCharByChar() to handle all Unicode whitespace variants
 * without putting literal Unicode chars inside regex (esbuild issue).
 */
function isWhitespaceCodePoint(cp) {
  // ASCII whitespace
  if (cp === 0x09 || cp === 0x0A || cp === 0x0D || cp === 0x20) return true
  // Common Unicode spaces from Excel:
  // U+00A0 NO-BREAK SPACE, U+00AD SOFT HYPHEN
  if (cp === 0x00A0 || cp === 0x00AD) return true
  // U+2000-U+200B (various typographic spaces, zero-width space)
  if (cp >= 0x2000 && cp <= 0x200B) return true
  // U+200C ZWNJ, U+200D ZWJ, U+200E LRM, U+200F RLM
  if (cp >= 0x200C && cp <= 0x200F) return true
  // U+2028 LINE SEP, U+2029 PARA SEP
  if (cp === 0x2028 || cp === 0x2029) return true
  // U+202A-U+202F (bidi controls and narrow no-break space)
  if (cp >= 0x202A && cp <= 0x202F) return true
  // U+205F MEDIUM MATH SPACE, U+2060 WORD JOINER, U+2061-U+2064
  if (cp >= 0x205F && cp <= 0x2064) return true
  // U+3000 IDEOGRAPHIC SPACE
  if (cp === 0x3000) return true
  // U+FEFF BOM / ZERO WIDTH NO-BREAK SPACE
  if (cp === 0xFEFF) return true
  // U+FFA0 HALFWIDTH HANGUL FILLER
  if (cp === 0xFFA0) return true
  return false
}

/**
 * Normalize a string for consistent key generation.
 *
 * ROOT CAUSE OF DUPLICATE KEYS:
 * Excel stores Vietnamese chars in NFD (base + combining diacritics).
 * JS strings / browser input use NFC. Same visual char = different bytes = different Map keys.
 * Example: "G98 ĐỎ L" from Excel (NFD) !== "G98 ĐỎ L" in browser (NFC) → counted as 2 rows.
 *
 * Fix: .normalize('NFC') collapses both representations into one canonical form,
 * then we replace all Unicode whitespace variants char-by-char (avoids esbuild regex issues).
 */
export function normalize(str) {
  if (str == null) return ''

  // Step 1: NFC — unify Vietnamese diacritics from Excel (NFD) with browser strings (NFC)
  let s = String(str).normalize('NFC')

  // Step 2: Strip parenthetical notes anywhere in the string, e.g. "(đúng size)", "( 2 )", "(sz 3)"
  // These are customer notes and must be ignored before parsing.
  s = s.replace(/\([^)]*\)/g, ' ')

  // Step 3: Replace all Unicode whitespace variants with plain ASCII space, char-by-char
  let result = ''
  for (let i = 0; i < s.length; i++) {
    const cp = s.codePointAt(i)
    // Skip surrogate pairs second char
    if (cp > 0xFFFF) i++
    result += isWhitespaceCodePoint(cp) ? ' ' : s[i]
  }

  // Step 4: Trim, collapse spaces, uppercase
  const upper = result.trim().replace(/ +/g, ' ').toUpperCase()

  // Step 5: Fix common Vietnamese tone-mark typos that appear after uppercasing.
  // E.g. "Hòng" uppercases to "HÒNG" (huyền) but should be "HỒNG" (hỏi).
  // Map each word individually so only standalone color words are corrected.
  return upper.split(' ').map(fixToneTypo).join(' ')
}

// Common color words where customers frequently use wrong tone marks.
// Key = wrong uppercase form, Value = correct uppercase form.
const TONE_TYPO_MAP = {
  // HỒNG variants (correct: hỏi ngã on Ô)
  'HONG':  'HỒNG',   // no diacritic at all
  'HÔNG':  'HỒNG',   // missing hook on O
  'HÒNG':  'HỒNG',
  'HÓNG':  'HỒNG',
  'HÕNG':  'HỒNG',
  'HỌNG':  'HỒNG',
  // ĐỎ variants (correct: hỏi on O)
  'ĐÒ':  'ĐỎ',
  'ĐÓ':  'ĐỎ',
  'ĐÕ':  'ĐỎ',
  // VÀNG variants
  'VÁNG': 'VÀNG',
  'VÃNG': 'VÀNG',
  // ĐEN (no diacritics, but common: ĐÊN)
  'ĐÊN':  'ĐEN',
  // TRẮNG variants
  'TRANG': 'TRẮNG',
  'TRĂNG': 'TRẮNG',
  // XANH — rarely misspelled, skip
  // KEM variants
  'KÈM': 'KEM',
  'KÉM': 'KEM',
}

function fixToneTypo(word) {
  return TONE_TYPO_MAP[word] ?? word
}

function isSize(token) {
  return SIZE_SET.has(token)
}

/**
 * A token is a MA (product code) if it contains at least one digit.
 * G98, A25, 1B -> YES | DEN, HONG, XANH -> NO
 */
function isMa(token) {
  return /\d/.test(token)
}

/**
 * Parse a single segment (after splitting by +).
 */
function parseSegment(segment, lastMa) {
  const tokens = segment.split(' ').filter(Boolean)

  if (tokens.length === 0) {
    return { product: null, error: null, newMa: lastMa }
  }

  // SIZE must be the last token
  const lastToken = tokens[tokens.length - 1]
  if (!isSize(lastToken)) {
    return {
      product: null,
      error: 'Không xác định được SIZE',
      newMa: lastMa,
    }
  }

  const size = lastToken
  const remaining = tokens.slice(0, tokens.length - 1)

  if (remaining.length === 0) {
    return {
      product: null,
      error: 'Không xác định được MÃ và MÀU',
      newMa: lastMa,
    }
  }

  // MA is first token if it contains a digit; otherwise inherit from previous
  let ma
  let mauTokens

  if (isMa(remaining[0])) {
    ma = remaining[0]
    mauTokens = remaining.slice(1)
  } else {
    ma = lastMa
    mauTokens = remaining
  }

  if (!ma) {
    return {
      product: null,
      error: 'Không xác định được MÃ',
      newMa: null,
    }
  }

  if (mauTokens.length === 0) {
    return {
      product: null,
      error: 'Không xác định được MÀU',
      newMa: ma,
    }
  }

  return {
    product: { ma, mau: mauTokens.join(' '), size },
    error: null,
    newMa: ma,
  }
}

/**
 * Parse a raw cell value into products and errors.
 * Splits on + with any surrounding whitespace: "A+B", "A + B", "A +B" all work.
 *
 * @param {string} rawValue
 * @param {object} context - { fileName, sheetName, rowIndex }
 * @returns {{ products: Array<{ma,mau,size}>, errors: Array<object> }}
 */
export function parseCell(rawValue, context = {}) {
  const normalized = normalize(rawValue)
  if (!normalized) return { products: [], errors: [] }

  // Split on + with optional surrounding whitespace
  const segments = normalized
    .split(/\s*\+\s*/)
    .map(s => s.trim())
    .filter(Boolean)

  const products = []
  const errors = []
  let lastMa = null

  for (const segment of segments) {
    const { product, error, newMa } = parseSegment(segment, lastMa)

    if (product) {
      products.push(product)
      lastMa = newMa
    } else if (error) {
      errors.push({ ...context, rawValue, segment, reason: error })
    }
  }

  return { products, errors }
}

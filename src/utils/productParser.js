/**
 * productParser.js
 * Parses product strings of format "MÃ MÀU SIZE" from Excel cells.
 * Handles: multi-word colors, + separator with code inheritance, Vietnamese Unicode.
 */

// SIZE list — add new sizes here as needed
export const SIZE_LIST = [
  'XXXL', 'XXL', 'XL', 'XS',
  '7XL', '6XL', '5XL', '4XL', '3XL', '2XL',
  'L', 'M', 'S',
]
// Sorted longest-first so matching greedily picks XXXL before XXL before XL
const SIZE_SET = new Set(SIZE_LIST)

/**
 * Normalize a string: trim, collapse whitespace, uppercase.
 */
export function normalize(str) {
  if (str == null) return ''
  return String(str).trim().replace(/\s+/g, ' ').toUpperCase()
}

/**
 * Check if a token is a SIZE.
 */
function isSize(token) {
  return SIZE_SET.has(token)
}

/**
 * Check if a token qualifies as a MÃ (product code).
 * Rule: must contain at least one digit.
 * Examples: G98, A25, 1B, B2C → YES
 * Examples: ĐEN, HỒNG, XANH → NO
 */
function isMa(token) {
  return /\d/.test(token)
}

/**
 * Parse a single segment (after splitting by " + ").
 * Returns { ma, mau, size } or null if unparseable.
 * `lastMa` is inherited from previous segment if this one has no MÃ.
 *
 * @param {string} segment - normalized segment string
 * @param {string|null} lastMa - MÃ inherited from previous segment
 * @returns {{ product: {ma,mau,size}|null, error: string|null, newMa: string|null }}
 */
function parseSegment(segment, lastMa) {
  const tokens = segment.split(' ').filter(Boolean)

  if (tokens.length === 0) {
    return { product: null, error: null, newMa: lastMa }
  }

  // Find SIZE: last token that is in SIZE_SET
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

  // Determine MÃ: first token if it contains a digit
  let ma
  let mauTokens

  if (isMa(remaining[0])) {
    ma = remaining[0]
    mauTokens = remaining.slice(1)
  } else {
    // No MÃ in this segment — inherit from previous
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

  const mau = mauTokens.join(' ')

  return {
    product: { ma, mau, size },
    error: null,
    newMa: ma,
  }
}

/**
 * Parse a raw cell value into products and errors.
 *
 * @param {string} rawValue - raw string from Excel cell
 * @param {object} context - { fileName, sheetName, rowIndex } for error reporting
 * @returns {{ products: Array<{ma,mau,size}>, errors: Array<object> }}
 */
export function parseCell(rawValue, context = {}) {
  const normalized = normalize(rawValue)

  if (!normalized) {
    return { products: [], errors: [] }
  }

  // Split on " + " (space-plus-space) to handle multiple products per cell
  const segments = normalized.split(' + ').map(s => s.trim()).filter(Boolean)

  const products = []
  const errors = []
  let lastMa = null

  for (const segment of segments) {
    const { product, error, newMa } = parseSegment(segment, lastMa)

    if (product) {
      products.push(product)
      lastMa = newMa
    } else if (error) {
      errors.push({
        ...context,
        rawValue,
        segment,
        reason: error,
      })
      // Keep lastMa unchanged so next segment can still inherit
    }
  }

  return { products, errors }
}

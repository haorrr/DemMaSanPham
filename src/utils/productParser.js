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
const SIZE_SET = new Set(SIZE_LIST)

/**
 * Normalize a string: trim, collapse ALL whitespace variants, uppercase.
 * Handles non-breaking space ( ), thin space ( ), zero-width (​),
 * and other Unicode space characters Excel commonly produces.
 */
export function normalize(str) {
  if (str == null) return ''
  return String(str)
    // Replace ALL Unicode whitespace + zero-width chars with regular ASCII space
    .replace(/[ ­͏؜ᅟᅠ឴឵᠎ -‏‪-  -⁠⠀　﻿ﾠ]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

function isSize(token) {
  return SIZE_SET.has(token)
}

/**
 * A token is a MÃ (product code) if it contains at least one digit.
 * G98, A25, 1B → YES | ĐEN, HỒNG, XANH → NO
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

  // MÃ is first token if it contains a digit; otherwise inherit
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
    return { product: null, error: 'Không xác định được MÃ', newMa: null }
  }

  if (mauTokens.length === 0) {
    return { product: null, error: 'Không xác định được MÀU', newMa: ma }
  }

  return {
    product: { ma, mau: mauTokens.join(' '), size },
    error: null,
    newMa: ma,
  }
}

/**
 * Parse a raw cell value into products and errors.
 * Splits on any whitespace-padded + sign: "A+B", "A + B", "A +B", "A+ B" all work.
 */
export function parseCell(rawValue, context = {}) {
  const normalized = normalize(rawValue)
  if (!normalized) return { products: [], errors: [] }

  // Split on + with optional surrounding whitespace (handles "A+B", "A + B", etc.)
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

/**
 * Extract a clean, user-friendly error message from an axios error.
 * Always returns a string suitable for display.
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback

  // Network error (no response)
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Unable to reach the server. Check your connection and try again.'
  }
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'The request took too long. Please try again.'
  }

  // Server returned a response
  const res = err.response
  if (res?.data) {
    // FastAPI standard: { detail: "..." }
    if (typeof res.data.detail === 'string') return res.data.detail
    // FastAPI validation: { detail: [{ msg: "..." }] }
    if (Array.isArray(res.data.detail) && res.data.detail[0]?.msg) {
      return res.data.detail[0].msg
    }
    // Plain object with message
    if (typeof res.data.message === 'string') return res.data.message
    // Plain string body
    if (typeof res.data === 'string') return res.data
  }

  // HTTP status fallback
  if (res?.status) {
    const map = {
      400: 'Invalid request. Please check your input.',
      401: 'You are not signed in. Please log in again.',
      403: 'You do not have permission to do that.',
      404: 'Not found.',
      409: 'A conflict occurred — this record may already exist.',
      422: 'Validation failed. Please check your input.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Server error. Please try again or contact support.',
      503: 'Service temporarily unavailable. Please try again shortly.',
    }
    return map[res.status] || `Request failed (${res.status}).`
  }

  // Anything else
  return err.message || fallback
}

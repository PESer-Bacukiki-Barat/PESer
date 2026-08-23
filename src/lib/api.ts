import axios from "axios"

export const api = axios.create({ baseURL: "/api" })

type ApiErrorShape = {
  code?: string
  message?: string
  field?: string
  issues?: { field: string; message: string }[]
}

function errorPayload(err: unknown): ApiErrorShape | null {
  if (!axios.isAxiosError(err)) return null
  const data = err.response?.data as { error?: ApiErrorShape } | undefined
  return data?.error && typeof data.error === "object" ? data.error : null
}

// Unwraps the `{ success, data }` envelope mandated by PRD §2.5 so callers keep
// receiving the payload directly. Doing it here — rather than at every call
// site — means route handlers and components stay decoupled from the envelope.
// Exported so the unwrapping is covered by tests rather than only exercised
// in the browser. A 204 has no body, and non-enveloped bodies pass through.
export function unwrapEnvelope(body: unknown): unknown {
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return (body as { data: unknown }).data
  }
  return body
}

api.interceptors.response.use(
  (res) => {
    res.data = unwrapEnvelope(res.data)
    return res
  },
  (err) => {
    // ponytail: interceptor isn't a React handler, so useRouter().push() isn't available here — full reload to /login on auth failure.
    if (err.response?.status === 401 && typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login")
    }
    return Promise.reject(err)
  },
)

export function apiError(err: unknown): string {
  return errorPayload(err)?.message ?? "Terjadi kesalahan"
}

/** Machine-readable error code from PRD §2.5, for branching on failure kind. */
export function apiErrorCode(err: unknown): string | undefined {
  return errorPayload(err)?.code
}

// Maps an API error into per-field messages. Returns null when nothing usable.
// Use the `_form` key for errors that don't belong to a single field.
export function apiFieldErrors(err: unknown): Record<string, string> | null {
  const error = errorPayload(err)
  if (!error) return null

  if (error.issues?.length) {
    const out: Record<string, string> = {}
    for (const issue of error.issues) {
      const key = issue.field.split(".")[0]
      if (key) out[key] = issue.message
    }
    if (Object.keys(out).length) return out
  }

  if (!error.message) return null
  return error.field ? { [error.field]: error.message } : { _form: error.message }
}

export function apiStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined
}

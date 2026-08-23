import axios from "axios"

export const api = axios.create({ baseURL: "/api" })

api.interceptors.response.use(
  (res) => res,
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
  if (!axios.isAxiosError(err)) return "Terjadi kesalahan"
  const data = err.response?.data as { error?: unknown } | undefined
  return typeof data?.error === "string" ? data.error : "Terjadi kesalahan"
}

type FieldIssues = { path: (string | number)[]; message: string }[]

// Maps an API error into per-field messages. Returns null when nothing usable.
// Use the `_form` key for errors that don't belong to a single field.
export function apiFieldErrors(err: unknown): Record<string, string> | null {
  if (!axios.isAxiosError(err)) return null
  const data = err.response?.data as
    | { error?: unknown }
    | { error?: FieldIssues }
    | undefined

  if (Array.isArray(data?.error)) {
    const out: Record<string, string> = {}
    for (const issue of data.error) {
      const key = String(issue.path[0] ?? "")
      if (key) out[key] = issue.message
    }
    return Object.keys(out).length ? out : null
  }

  if (typeof data?.error === "string") {
    // ponytail: backend masks unique-email failures as this message
    if (/email/.test(data.error)) return { email: data.error }
    return { _form: data.error }
  }
  return null
}

export function apiStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined
}

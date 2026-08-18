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

export function apiStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined
}

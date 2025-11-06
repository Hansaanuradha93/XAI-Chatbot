export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL

export async function apiFetch(endpoint: string, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const res = await fetch(url, options)

    if (!res.ok) {
        console.error(`❌ API Error: ${res.status} at ${url}`)
        throw new Error(`API Error ${res.status}`)
    }

    try {
        return await res.json()
    } catch {
        throw new Error("Invalid JSON response from API")
    }
}

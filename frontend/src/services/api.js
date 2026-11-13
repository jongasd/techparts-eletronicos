const API_URL = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
        ? "http://localhost:3000"
        : "https://techparts-eletronicos.onrender.com")
).replace(/\/+$/, "");

export function getAuthToken() {
    return localStorage.getItem("techparts_token") ||
        sessionStorage.getItem("techparts_token");
}

export function hasAdminSession() {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const partes = token.split(".");
        if (partes.length !== 3) throw new Error("Token inválido");
        const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
        if (payload.nome_role === "admin") return true;
    } catch {
        clearAuthToken();
        return false;
    }

    clearAuthToken();
    return false;
}

export function saveAuthToken(token, remember) {
    const storage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    otherStorage.removeItem("techparts_token");
    storage.setItem("techparts_token", token);
}

export function clearAuthToken() {
    localStorage.removeItem("techparts_token");
    sessionStorage.removeItem("techparts_token");
}

export function resolveApiUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export async function apiRequest(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getAuthToken();

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (options.body && !(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(resolveApiUrl(path), {
        ...options,
        headers,
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) clearAuthToken();
        throw new Error(
            payload.mensagem || payload.message || `Erro HTTP ${response.status}`
        );
    }

    return payload;
}
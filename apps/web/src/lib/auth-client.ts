const TOKEN_KEY = 'pl_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function setTokenCookie(token: string) {
    const maxAge = 8 * 60 * 60; // 8 hours
    document.cookie = `pl_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearTokenCookie() {
    document.cookie = 'pl_token=; path=/; max-age=0; SameSite=Lax';
}

export const authClient = {
    login(token: string) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(TOKEN_KEY, token);
        setTokenCookie(token);
    },

    logout() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(TOKEN_KEY);
        clearTokenCookie();
        window.location.href = '/login';
    },

    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(TOKEN_KEY);
    },

    getAuthHeaders(): Record<string, string> {
        const token = this.getToken();
        if (!token) return {};
        return { Authorization: `Bearer ${token}` };
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    apiUrl: API_URL,
};

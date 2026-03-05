const TOKEN_KEY = 'pl_token';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const authClient = {
    /**
     * After successful login the server sets an httpOnly cookie.
     * Kept as a no-op for call-site compatibility.
     */
    login(_token: string) {
        // Server sets httpOnly cookie — nothing to do client-side.
    },

    logout() {
        if (typeof window === 'undefined') return;
        // Clear the cookie (server may also clear on /api/auth/logout)
        document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
        window.location.href = '/login';
    },

    /**
     * httpOnly cookies are invisible to JS.
     * Returns a sentinel value when the cookie name is present (non-httpOnly
     * fallback) so callers can do a cheap isAuthenticated() check.
     */
    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return document.cookie.includes(TOKEN_KEY) ? 'cookie-auth' : null;
    },

    /**
     * Returns headers that should accompany every API request.
     * - X-Requested-With: required by the CSRF middleware for mutating requests
     *   when cookie-based auth is in use.
     * - Authorization header is no longer sent; the httpOnly cookie is attached
     *   automatically when `credentials: 'include'` is set on the fetch call.
     */
    getAuthHeaders(): Record<string, string> {
        return { 'X-Requested-With': 'XMLHttpRequest' };
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    },

    apiUrl: API_URL,
};

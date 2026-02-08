// API Utility for Vercel Serverless Functions
const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = {
    auth: {
        async register(userData: any) {
            const res = await fetch(`${API_URL}/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'register', ...userData })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        },
        async login(credentials: any) {
            const res = await fetch(`${API_URL}/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', ...credentials })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            return data;
        }
    }
}

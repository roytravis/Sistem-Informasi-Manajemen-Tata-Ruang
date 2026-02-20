import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            api.get('/user')
                .then(response => setUser(response.data))
                .catch(() => localStorage.removeItem('authToken'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let inactivityTimer;

        const handleLogout = async () => {
            try {
                await api.post('/logout');
            } finally {
                localStorage.removeItem('authToken');
                setUser(null);
                window.location.href = '/login'; 
            }
        };

        const resetTimer = () => {
            if (user) {
                clearTimeout(inactivityTimer);
                // Set timeout to 1 hour (3600000 ms)
                inactivityTimer = setTimeout(handleLogout, 3600000);
            }
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll'];

        if (user) {
            resetTimer(); 
            events.forEach(event => window.addEventListener(event, resetTimer));
        }

        return () => {
            clearTimeout(inactivityTimer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [user]);

    const login = async (nip, password) => {
        const response = await api.post('/login', { nip, password });
        localStorage.setItem('authToken', response.data.access_token);
        setUser(response.data.user);
        return response.data.user;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } finally {
            localStorage.removeItem('authToken');
            setUser(null);
        }
    };

    const value = { user, login, logout, loading };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}

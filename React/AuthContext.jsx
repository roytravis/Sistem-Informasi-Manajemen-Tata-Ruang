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

    const login = async (email, password) => {
        const response = await api.post('/login', { email, password });
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

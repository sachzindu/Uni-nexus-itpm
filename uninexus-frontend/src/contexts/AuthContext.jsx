import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchMe();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchMe = async () => {
        try {
            setLoading(true);
            const response = await authAPI.getMe();
            setUser(response.data.user);
        } catch (err) {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            const { user: userData, token } = response.data;
            localStorage.setItem('token', token);
            setUser(userData);
            return userData;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signup = async (userData) => {
        try {
            setError(null);
            const response = await authAPI.signup(userData);
            const { user: newUser, token } = response.data;
            localStorage.setItem('token', token);
            setUser(newUser);
            return newUser;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (err) {
            // Proceed with local logout even if API call fails
        } finally {
            localStorage.removeItem('token');
            setUser(null);
        }
    };

    const updateProfile = async (data) => {
        try {
            setError(null);
            const response = await userAPI.updateProfile(data);
            setUser(response.data.user);
            return response.data.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const clearError = useCallback(() => setError(null), []);

    const value = {
        user,
        loading,
        error,
        login,
        signup,
        logout,
        updateProfile,
        fetchMe,
        clearError,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

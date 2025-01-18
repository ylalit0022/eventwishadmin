import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { api } from '../services/api';

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

    // Check if user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            checkAuthStatus();
        } else {
            setLoading(false);
        }
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await api.get('/auth/verify');
            if (response.success) {
                setUser(response.data.user);
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Auth check error:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.success) {
                const { token, user } = response.data;
                localStorage.setItem('token', token);
                setUser(user);
                message.success('Successfully logged in');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            message.error(error.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            message.success('Successfully logged out');
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout
    };

    if (loading) {
        return <div>Loading...</div>; // You can replace this with a proper loading component
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

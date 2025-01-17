import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const res = await axios.get('/api/auth/me', config);
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const res = await axios.put('/api/auth/profile', profileData, config);
      setUser(res.data);
      toast.success('Profile updated successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed');
      return false;
    }
  };

  const updateSettings = async (settings) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const res = await axios.put('/api/auth/settings', { settings }, config);
      setUser(prev => ({ ...prev, settings: res.data.settings }));
      toast.success('Settings updated successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Settings update failed');
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    updateSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

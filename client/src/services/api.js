import axios from 'axios';
import API_CONFIG from '../config/api.config';
import { message } from 'antd';

// Base URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
axios.defaults.baseURL = API_BASE_URL;

const API_URL = API_CONFIG.BASE_URL;

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        message.error(errorMessage);
        return Promise.reject(error);
    }
);

// Templates API
export const templatesApi = {
    // Get all templates with pagination and filters
    getAll: (params) => api.get('/templates', { params }),

    // Get template by ID
    getById: (id) => api.get(`/templates/${id}`),

    // Create new template
    create: (data) => api.post('/templates', data),

    // Update template
    update: (id, data) => api.put(`/templates/${id}`, data),

    // Delete template
    delete: (id) => api.delete(`/templates/${id}`),

    // Get template categories
    getCategories: () => api.get(API_CONFIG.ENDPOINTS.TEMPLATES.CATEGORIES),

    // Bulk import templates
    bulkImport: (templates) => api.post(API_CONFIG.ENDPOINTS.TEMPLATES.BULK_IMPORT, { templates }),

    // Get template stats
    getStats: () => api.get(API_CONFIG.ENDPOINTS.TEMPLATES.STATS)
};

// Dashboard API
export const dashboardApi = {
    // Get recent activity
    getActivity: () => api.get(API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVITY),

    // Get dashboard stats
    getStats: () => api.get(API_CONFIG.ENDPOINTS.DASHBOARD.STATS),

    // Get dashboard summary
    getSummary: () => api.get('/dashboard/summary'),

    // Get dashboard stats
    getDashboardStats: () => api.get('/dashboard/stats')
};

// Files API
export const filesApi = {
    // Upload file
    upload: (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.post(API_CONFIG.ENDPOINTS.FILES.UPLOAD, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    onProgress(progressEvent);
                }
            }
        });
    },

    // Get file list
    getAll: (params) => api.get('/files', { params }),

    // Delete file
    delete: (id) => api.delete(`/files/${id}`),

    // Download file
    download: (id) => api.get(`${API_CONFIG.ENDPOINTS.FILES.DOWNLOAD}/${id}`, { responseType: 'blob' }),

    // Get file URL
    getFileUrl: (id) => `${API_URL}${API_CONFIG.ENDPOINTS.FILES.DOWNLOAD}/${id}`
};

// AdMob API
export const adMobApi = {
    getAll: (params) => api.get('/admob', { params }),
    create: (data) => api.post('/admob', data),
    update: (id, data) => api.put(`/admob/${id}`, data),
    delete: (id) => api.delete(`/admob/${id}`),
    toggle: (id) => api.patch(`/admob/${id}/toggle`),
    getTypes: () => api.get('/admob/types')
};

// Shared Wishes API
export const sharedWishesApi = {
    getAll: (params) => api.get('/shared-wishes', { params }),
    getAnalytics: () => api.get('/shared-wishes/analytics')
};

// Auth API
export const authApi = {
    async login(credentials) {
        return await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials);
    },
    
    async logout() {
        return await api.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    },
    
    async refreshToken() {
        return await api.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH);
    }
};

export default api;

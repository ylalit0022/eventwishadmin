import axios from 'axios';
import API_CONFIG from '../config/api.config';
import { message } from 'antd';

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
    getAll: (params) => api.get(API_CONFIG.ENDPOINTS.TEMPLATES.BASE, { params }),

    // Get template by ID
    getById: (id) => api.get(`${API_CONFIG.ENDPOINTS.TEMPLATES.BASE}/${id}`),

    // Create new template
    create: (data) => api.post(API_CONFIG.ENDPOINTS.TEMPLATES.BASE, data),

    // Update template
    update: (id, data) => api.put(`${API_CONFIG.ENDPOINTS.TEMPLATES.BASE}/${id}`, data),

    // Delete template
    delete: (id) => api.delete(`${API_CONFIG.ENDPOINTS.TEMPLATES.BASE}/${id}`),

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
    getSummary: () => api.get(API_CONFIG.ENDPOINTS.DASHBOARD.SUMMARY)
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
    getAll: () => api.get(API_CONFIG.ENDPOINTS.FILES.LIST),

    // Delete file
    delete: (id) => api.delete(`${API_CONFIG.ENDPOINTS.FILES.BASE}/${id}`),

    // Download file
    download: (id) => api.get(`${API_CONFIG.ENDPOINTS.FILES.DOWNLOAD}/${id}`, { responseType: 'blob' }),

    // Get file URL
    getFileUrl: (id) => `${API_URL}${API_CONFIG.ENDPOINTS.FILES.DOWNLOAD}/${id}`
};

// AdMob API
export const adMobApi = {
    async getAll(params = {}) {
        return await api.get(API_CONFIG.ENDPOINTS.ADMOB.BASE, { params });
    },
    
    async getById(id) {
        return await api.get(`${API_CONFIG.ENDPOINTS.ADMOB.BASE}/${id}`);
    },
    
    async create(data) {
        return await api.post(API_CONFIG.ENDPOINTS.ADMOB.BASE, data);
    },
    
    async update(id, data) {
        return await api.put(`${API_CONFIG.ENDPOINTS.ADMOB.BASE}/${id}`, data);
    },
    
    async delete(id) {
        return await api.delete(`${API_CONFIG.ENDPOINTS.ADMOB.BASE}/${id}`);
    },
    
    async getTypes() {
        return await api.get(API_CONFIG.ENDPOINTS.ADMOB.TYPES);
    },

    async getStatus() {
        return await api.get(API_CONFIG.ENDPOINTS.ADMOB.STATUS);
    }
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

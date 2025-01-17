import axios from 'axios';
import API_CONFIG from '../config/api.config';

// Create axios instance
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    response => {
        // For blob responses (file downloads), return as is
        if (response.config.responseType === 'blob') {
            return response;
        }
        // For regular responses, return data
        return response.data;
    },
    error => {
        // Handle error response
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorMessage = error.response.data?.message || 'An error occurred';
            return Promise.reject({
                ...error,
                message: errorMessage
            });
        } else if (error.request) {
            // The request was made but no response was received
            return Promise.reject({
                ...error,
                message: 'No response from server'
            });
        } else {
            // Something happened in setting up the request that triggered an Error
            return Promise.reject({
                ...error,
                message: error.message || 'Request failed'
            });
        }
    }
);

// AdMob API
export const adMobApi = {
    async getAll(params) {
        try {
            const response = await api.get('/admob-ads', { params });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async create(data) {
        try {
            const response = await api.post('/admob-ads', data);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async update(id, data) {
        try {
            const response = await api.put(`/admob-ads/${id}`, data);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await api.delete(`/admob-ads/${id}`);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async toggleStatus(id) {
        try {
            const response = await api.patch(`/admob-ads/${id}/status`);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Files API
export const filesApi = {
    getAll() {
        return api.get('/files');
    },
    upload(formData, onProgress) {
        return api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress ? (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            } : undefined
        });
    },
    delete(id) {
        return api.delete(`/files/${id}`);
    },
    getFileUrl(id) {
        return `${API_CONFIG.BASE_URL}/files/download/${id}`;
    }
};

// Shared Files API
export const sharedFilesApi = {
    getAll() {
        return api.get('/shared-files');
    },
    share(fileId, data) {
        return api.post(`/shared-files/share/${fileId}`, data);
    },
    unshare(fileId) {
        return api.delete(`/shared-files/unshare/${fileId}`);
    }
};

// Shared Wishes API
export const sharedWishesApi = {
    async getAll(params) {
        try {
            const response = await api.get('/shared-wishes', { params });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    async getAnalytics() {
        try {
            const response = await api.get('/shared-wishes/analytics');
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    async export(filter) {
        try {
            const response = await api.get('/shared-wishes/export', {
                params: { filter },
                responseType: 'blob'
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    async exportEnhanced(filter) {
        try {
            const response = await api.get('/shared-wishes/export/enhanced', {
                params: { filter },
                responseType: 'blob'
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Dashboard API
export const dashboardApi = {
    getActivity() {
        return api.get('/dashboard/activity');
    },
    getSummary() {
        return api.get('/dashboard/summary');
    },
    getStats() {
        return api.get('/dashboard/stats');
    }
};

// Auth API
export const authApi = {
    async login(credentials) {
        return await api.post(`${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, credentials);
    },
    
    async logout() {
        return await api.post(`${API_CONFIG.ENDPOINTS.AUTH.LOGOUT}`);
    },
    
    async refreshToken() {
        return await api.post(`${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`);
    }
};

// Templates API
export const templatesApi = {
    async getAll(params) {
        try {
            const response = await api.get('/templates', { params });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async create(data) {
        try {
            const response = await api.post('/templates', data);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async update(id, data) {
        try {
            const response = await api.put(`/templates/${id}`, data);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await api.delete(`/templates/${id}`);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async toggleStatus(id) {
        try {
            const response = await api.patch(`/templates/${id}/status`);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async preview(data) {
        try {
            const response = await api.post('/templates/preview', data);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async import(formData) {
        try {
            const response = await api.post('/templates/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async export(params) {
        try {
            const response = await api.get('/templates/export', {
                params,
                responseType: 'blob'
            });
            
            // Create and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `templates-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

export default api;

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
        // For blob responses (file downloads), return the raw response
        if (response.config.responseType === 'blob') {
            // Check if the response is an error response
            if (response.data instanceof Blob && response.data.type === 'application/json') {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const errorData = JSON.parse(reader.result);
                        reject(errorData);
                    };
                    reader.onerror = () => {
                        reject({
                            success: false,
                            message: 'Error reading error response'
                        });
                    };
                    reader.readAsText(response.data);
                });
            }
            return response.data;
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
                message: 'No response received from server'
            });
        }
        // Something happened in setting up the request that triggered an Error
        return Promise.reject({
            ...error,
            message: error.message || 'An error occurred'
        });
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
            // Validate required fields
            if (!data.adName?.trim()) {
                throw new Error('Ad name is required');
            }
            if (!data.adType) {
                throw new Error('Ad type is required');
            }
            if (!data.adUnitId?.trim()) {
                throw new Error('Ad unit ID is required');
            }

            const response = await api.post('/admob-ads/create', {
                adName: data.adName.trim(),
                adType: data.adType,
                adUnitId: data.adUnitId.trim(),
                status: data.status !== undefined ? data.status : true
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async update(id, data) {
        try {
            // If only status is being updated
            if (Object.keys(data).length === 1 && data.status !== undefined) {
                const response = await api.patch(`/admob-ads/${id}/status`, { status: data.status });
                return response;
            }

            // Validate required fields for full update
            if (!data.adName?.trim()) {
                throw new Error('Ad name is required');
            }
            if (!data.adType) {
                throw new Error('Ad type is required');
            }
            if (!data.adUnitId?.trim()) {
                throw new Error('Ad unit ID is required');
            }

            // Full update
            const response = await api.put(`/admob-ads/${id}`, {
                adName: data.adName.trim(),
                adType: data.adType,
                adUnitId: data.adUnitId.trim(),
                status: data.status !== undefined ? data.status : true
            });
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
    getAll(params) {
        return api.get('/shared-files', { params });
    },
    
    upload(formData, onProgress) {
        return api.post('/shared-files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
        });
    },
    
    download(id) {
        if (!id) {
            return Promise.reject({
                success: false,
                message: 'File ID is required'
            });
        }
        return api.get(`/shared-files/download/${id}`, {
            responseType: 'blob'
        });
    },
    
    delete(id) {
        if (!id) {
            return Promise.reject({
                success: false,
                message: 'File ID is required'
            });
        }
        return api.delete(`/shared-files/${id}`);
    },

    export(filter) {
        return api.get(`/shared-files/export?filter=${filter}`, {
            responseType: 'blob',
            headers: {
                'Accept': 'text/csv'
            }
        }).then(response => response.data);
    }
};

// Shared Wishes API
export const sharedWishesApi = {
    async getAll(params) {
        try {
            const response = await api.get('/shared-wishes', { params });
            return response;
        } catch (error) {
            console.error('Error fetching shared wishes:', error);
            throw error;
        }
    },

    getAnalytics() {
        return api.get('/shared-wishes/analytics');
    },

    export(filter) {
        return api.get(`/shared-wishes/export?filter=${filter}`, {
            responseType: 'blob'
        });
    },

    exportEnhanced(filter) {
        return api.get(`/shared-wishes/export/enhanced?filter=${filter}`, {
            responseType: 'blob',
            headers: {
                'Accept': 'text/csv'
            }
        });
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

    async create(formData) {
        try {
            const response = await api.post('/templates/create', formData, {
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

    async update(id, formData) {
        try {
            const response = await api.put(`/templates/${id}`, formData, {
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

    async bulkDelete(ids) {
        try {
            const response = await api.post('/templates/bulk-delete', { ids });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async bulkUpdateStatus(ids, status) {
        try {
            const response = await api.post('/templates/bulk-status', { ids, status });
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
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'templates.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

export default api;

import axios from 'axios';
import API_CONFIG from '../config/api.config';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS
});

// Add request interceptor for auth token
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

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response?.data instanceof Blob) {
            return Promise.reject(error);
        }
        return Promise.reject({
            message: error.response?.data?.message || 'An error occurred',
            status: error.response?.status,
            error: error
        });
    }
);

// AdMob API
export const adMobApi = {
    async getAll(params) {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.ADMOB.LIST, { params });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw {
                message: error.response?.data?.message || 'Failed to fetch ads',
                status: error.response?.status,
                error
            };
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
            if (!data.adUnitCode?.trim()) {
                throw new Error('Ad unit code is required');
            }

            const response = await api.post(API_CONFIG.ENDPOINTS.ADMOB.CREATE, {
                adName: data.adName.trim(),
                adType: data.adType,
                adUnitCode: data.adUnitCode.trim(),
                status: data.status !== undefined ? data.status : true
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw {
                message: error.response?.data?.message || 'Failed to create ad',
                status: error.response?.status,
                error
            };
        }
    },

    async update(id, data) {
        try {
            // If only status is being updated
            if (Object.keys(data).length === 1 && 'status' in data) {
                const response = await api.patch(`${API_CONFIG.ENDPOINTS.ADMOB.BASE}/${id}/status`, {
                    status: data.status
                });
                return response;
            }

            // Validate required fields for full update
            if (!data.adName?.trim()) {
                throw new Error('Ad name is required');
            }
            if (!data.adType) {
                throw new Error('Ad type is required');
            }
            if (!data.adUnitCode?.trim()) {
                throw new Error('Ad unit code is required');
            }

            const response = await api.put(`${API_CONFIG.ENDPOINTS.ADMOB.BASE}/${id}`, {
                adName: data.adName.trim(),
                adType: data.adType,
                adUnitCode: data.adUnitCode.trim(),
                status: data.status !== undefined ? data.status : true
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw {
                message: error.response?.data?.message || 'Failed to update ad',
                status: error.response?.status,
                error
            };
        }
    },

    async delete(id) {
        try {
            const response = await api.delete(API_CONFIG.ENDPOINTS.ADMOB.DELETE(id));
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw {
                message: error.response?.data?.message || 'Failed to delete ad',
                status: error.response?.status,
                error
            };
        }
    },

    async getTypes() {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.ADMOB.TYPES);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw {
                message: error.response?.data?.message || 'Failed to fetch ad types',
                status: error.response?.status,
                error
            };
        }
    }
};

// Files API
export const filesApi = {
    getAll() {
        return api.get(API_CONFIG.ENDPOINTS.FILES.BASE);
    },
    upload(formData, onProgress) {
        return api.post(API_CONFIG.ENDPOINTS.FILES.UPLOAD, formData, {
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
        return api.delete(`${API_CONFIG.ENDPOINTS.FILES.BASE}/${id}`);
    },
    getFileUrl(id) {
        return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FILES.DOWNLOAD}/${id}`;
    }
};

// Shared Files API
export const sharedFilesApi = {
    getAll(params) {
        return api.get(API_CONFIG.ENDPOINTS.SHARED_FILES.BASE, { params });
    },
    
    upload(formData, onProgress) {
        return api.post(API_CONFIG.ENDPOINTS.SHARED_FILES.UPLOAD, formData, {
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
        return api.get(`${API_CONFIG.ENDPOINTS.SHARED_FILES.DOWNLOAD}/${id}`, {
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
        return api.delete(`${API_CONFIG.ENDPOINTS.SHARED_FILES.BASE}/${id}`);
    },

    export(filter) {
        return api.get(`${API_CONFIG.ENDPOINTS.SHARED_FILES.EXPORT}?filter=${filter}`, {
            responseType: 'blob',
            headers: {
                'Accept': 'text/csv'
            }
        }).then(response => response.data);
    }
};

// Shared Wishes API
export const sharedWishesApi = {
    // Helper function to validate date format
    _validateDateFormat(date) {
        if (!date) return false;
        const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(20)\d\d$/;
        return regex.test(date);
    },

    // Helper function to format filter
    _formatFilter(filter) {
        if (this._validateDateFormat(filter)) {
            return filter;
        }

        const today = new Date();
        switch (filter) {
            case 'today':
                return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
            case 'week':
            case 'month':
            case 'all':
                return filter;
            default:
                // Default to today if invalid filter
                return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        }
    },

    async getAll(params) {
        try {
            const formattedParams = {
                ...params,
                filter: this._formatFilter(params.filter)
            };
            
            const response = await api.get(API_CONFIG.ENDPOINTS.SHARED_WISHES.BASE, { 
                params: formattedParams
            });

            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getTrendingTemplates(days = 7) {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.SHARED_WISHES.TRENDING, {
                params: { days }
            });

            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async getAnalytics(filter = 'today') {
        try {
            const formattedFilter = this._formatFilter(filter);
            const response = await api.get(API_CONFIG.ENDPOINTS.SHARED_WISHES.ANALYTICS, {
                params: { filter: formattedFilter }
            });

            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async exportEnhanced(filter) {
        try {
            const response = await axios({
                method: 'get',
                url: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SHARED_WISHES.EXPORT}`,
                params: { filter },
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Create file name
            const fileName = `wishes-${filter}-${new Date().toISOString().split('T')[0]}.csv`;

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Export error:', error);

            // Handle error response
            if (error.response?.data instanceof Blob) {
                const text = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsText(error.response.data);
                });

                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.message || 'Export failed');
                } catch (e) {
                    throw new Error('Export failed: Invalid response format');
                }
            }

            throw new Error(error.message || 'Export failed');
        }
    },

    async delete(id) {
        try {
            const response = await api.delete(`${API_CONFIG.ENDPOINTS.SHARED_WISHES.BASE}/${id}`);
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
        return api.get(API_CONFIG.ENDPOINTS.DASHBOARD.ACTIVITY);
    },
    getSummary() {
        return api.get(API_CONFIG.ENDPOINTS.DASHBOARD.SUMMARY);
    },
    getStats() {
        return api.get(API_CONFIG.ENDPOINTS.DASHBOARD.STATS);
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

// Templates API
export const templatesApi = {
    async getAll(params) {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.TEMPLATES.BASE, { params });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async create(data) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.TEMPLATES.BASE, data);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async update(id, data) {
        try {
            const response = await api.put(`${API_CONFIG.ENDPOINTS.TEMPLATES.BASE}/${id}`, data);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async delete(id) {
        try {
            const response = await api.delete(`${API_CONFIG.ENDPOINTS.TEMPLATES.BASE}/${id}`);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async toggleStatus(id) {
        try {
            const response = await api.patch(`${API_CONFIG.ENDPOINTS.TEMPLATES.BASE}/${id}/status`);
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async bulkDelete(ids) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.TEMPLATES.BULK_DELETE, { ids });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async bulkUpdateStatus(ids, status) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.TEMPLATES.BULK_STATUS, { ids, status });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async import(formData) {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.TEMPLATES.IMPORT, formData, {
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
            const response = await api.get(API_CONFIG.ENDPOINTS.TEMPLATES.EXPORT, {
                params,
                responseType: 'blob',
                headers: {
                    ...API_CONFIG.HEADERS,
                    'Accept': 'text/csv'
                }
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

export default api;

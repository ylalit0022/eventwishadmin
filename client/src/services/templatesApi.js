import axios from 'axios';

const BASE_URL = '/api/templates';

export const templatesApi = {
    getAll: async (params) => {
        try {
            const response = await axios.get(BASE_URL, { params });
            if (response.data.success) {
                return {
                    success: true,
                    data: {
                        templates: response.data.data.templates || [],
                        total: response.data.data.total || 0,
                        filters: {
                            categories: response.data.data.filters?.categories || []
                        }
                    }
                };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Error fetching templates:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Failed to fetch templates',
                data: {
                    templates: [],
                    total: 0,
                    filters: {
                        categories: []
                    }
                }
            };
        }
    },

    create: async (data) => {
        try {
            const response = await axios.post(BASE_URL, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error creating template:', error);
            return { success: false, message: error.response?.data?.error || 'Failed to create template' };
        }
    },

    update: async (id, data) => {
        try {
            const response = await axios.put(`${BASE_URL}/${id}`, data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error updating template:', error);
            return { success: false, message: error.response?.data?.error || 'Failed to update template' };
        }
    },

    delete: async (id) => {
        try {
            const response = await axios.delete(`${BASE_URL}/${id}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error deleting template:', error);
            return { success: false, message: error.response?.data?.error || 'Failed to delete template' };
        }
    },

    import: async (formData) => {
        try {
            const response = await axios.post(`${BASE_URL}/import`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return {
                success: true,
                message: response.data.message,
                data: response.data.data
            };
        } catch (error) {
            console.error('Error importing templates:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to import templates',
                data: {
                    inserted: 0,
                    updated: 0,
                    failed: 0,
                    errors: [error.response?.data?.message || 'Unknown error occurred']
                }
            };
        }
    },

    export: async (params) => {
        try {
            const response = await axios.get(`${BASE_URL}/export`, {
                params,
                responseType: 'blob',
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error exporting templates:', error);
            return { success: false, message: error.response?.data?.error || 'Failed to export templates' };
        }
    },

    toggleStatus: async (id) => {
        try {
            const response = await axios.put(`${BASE_URL}/${id}/toggle-status`);
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error('Error toggling template status:', error);
            return { success: false, message: error.response?.data?.error || 'Failed to toggle template status' };
        }
    },

    bulkDelete: async (ids) => {
        try {
            const response = await axios.post(`${BASE_URL}/bulk-delete`, { ids });
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error('Error bulk deleting templates:', error);
            return { success: false, message: error.response?.data?.message || 'Failed to delete templates' };
        }
    },

    bulkUpdateStatus: async (ids, status) => {
        try {
            const response = await axios.post(`${BASE_URL}/bulk-status`, { ids, status });
            return { success: true, data: response.data.data };
        } catch (error) {
            console.error('Error updating template statuses:', error);
            return { success: false, message: error.response?.data?.message || 'Failed to update template statuses' };
        }
    }
};

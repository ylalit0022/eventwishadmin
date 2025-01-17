const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    ENDPOINTS: {
        TEMPLATES: {
            BASE: '/templates',
            CATEGORIES: '/templates/categories',
            STATS: '/templates/stats',
            BULK_IMPORT: '/templates/bulk-import'
        },
        FILES: {
            BASE: '/files',
            UPLOAD: '/files/upload',
            LIST: '/files',
            DELETE: '/files',
            DOWNLOAD: '/files/download'
        },
        DASHBOARD: {
            BASE: '/dashboard',
            ACTIVITY: '/dashboard/recent-activity',
            STATS: '/dashboard/stats',
            SUMMARY: '/dashboard/summary'
        },
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            PROFILE: '/auth/profile'
        }
    }
};

export default API_CONFIG;

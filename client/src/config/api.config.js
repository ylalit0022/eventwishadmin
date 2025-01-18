const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            VERIFY: '/auth/verify',
            REFRESH: '/auth/refresh',
            LOGOUT: '/auth/logout'
        },
        DASHBOARD: {
            BASE: '/dashboard',
            SUMMARY: '/dashboard/summary',
            STATS: '/dashboard/stats',
            ACTIVITY: '/dashboard/activity'
        },
        FILES: {
            BASE: '/files',
            UPLOAD: '/files/upload',
            DOWNLOAD: '/files/download'
        },
        SHARED_FILES: {
            BASE: '/shared-files',
            UPLOAD: '/shared-files/upload',
            DOWNLOAD: '/shared-files/download',
            SHARE: '/shared-files/share',
            UNSHARE: '/shared-files/unshare'
        },
        SHARED_WISHES: {
            BASE: '/shared-wishes',
            SHARE: '/shared-wishes/share',
            UNSHARE: '/shared-wishes/unshare',
            ANALYTICS: '/shared-wishes/analytics',
            EXPORT: '/shared-wishes/export',
            TRENDING: '/shared-wishes/trending-templates'
        },
        TEMPLATES: {
            BASE: '/templates',
            CREATE: '/templates/create',
            IMPORT: '/templates/import',
            EXPORT: '/templates/export',
            BULK_DELETE: '/templates/bulk-delete',
            BULK_STATUS: '/templates/bulk-status'
        },
        ADMOB: {
            BASE: '/admob-ads',
            CREATE: '/admob-ads',
            LIST: '/admob-ads',
            UPDATE: (id) => `/admob-ads/${id}`,
            DELETE: (id) => `/admob-ads/${id}`,
            TOGGLE: (id) => `/admob-ads/${id}/status`,
            TYPES: '/admob-ads/types'
        }
    },
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

export default API_CONFIG;

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
            SHARE: '/shared-files/share',
            UNSHARE: '/shared-files/unshare'
        },
        SHARED_WISHES: {
            BASE: '/shared-wishes',
            SHARE: '/shared-wishes/share',
            UNSHARE: '/shared-wishes/unshare',
            ANALYTICS: '/shared-wishes/analytics'
        },
        ADMOB: {
            BASE: '/admob-ads',
            LIST: '/admob-ads',
            TOGGLE: (id) => `/admob-ads/${id}/status`,
            TYPES: '/admob-ads/types'
        }
    }
};

export default API_CONFIG;

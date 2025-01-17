import { theme } from 'antd';

export const themeConfig = {
    token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
        colorBgContainer: '#ffffff',
        colorBgLayout: '#f0f2f5',
        colorTextBase: '#000000e0',
        colorTextSecondary: '#00000073',
        boxShadowCard: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
    },
    components: {
        Layout: {
            bodyBg: '#f0f2f5',
            headerBg: '#ffffff',
            siderBg: '#ffffff'
        },
        Menu: {
            itemBg: 'transparent',
            itemSelectedBg: '#e6f4ff',
            itemHoverBg: '#f5f5f5'
        }
    }
};

export const getPageContainerStyle = (token) => ({
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    minHeight: '100%',
    background: token.colorBgContainer,
    borderRadius: token.borderRadius,
    boxShadow: token.boxShadowCard
});

export const getCardStyle = (token) => ({
    background: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,
    borderRadius: token.borderRadius,
    height: '100%'
});

export const getHeaderStyle = (token) => ({
    position: 'sticky',
    top: 0,
    zIndex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    background: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary
});

export const getSiderStyle = (token, collapsed) => ({
    overflow: 'auto',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    background: token.colorBgContainer,
    boxShadow: token.boxShadowTertiary,
    transition: 'all 0.2s'
});

export const getContentStyle = (token, collapsed) => ({
    marginLeft: collapsed ? '80px' : '200px',
    transition: 'all 0.2s',
    minHeight: '100vh',
    background: token.colorBgLayout,
    padding: '24px',
    '@media screen and (max-width: 768px)': {
        marginLeft: 0,
        padding: '12px'
    }
});

import React from 'react';
import { Layout, Menu, theme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    GiftOutlined,
    FileOutlined,
    SettingOutlined,
    FileTextOutlined,
    HomeOutlined,
    FileImageOutlined,
    DollarOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { useToken } = theme;

function getItem(label, key, icon, children) {
    return {
        key,
        icon,
        children,
        label,
    };
}

const menuItems = [
    getItem('Dashboard', '/dashboard', <HomeOutlined />),
    getItem('Templates', '/templates', <FileImageOutlined />),
    getItem('Shared Wishes', '/shared-wishes', <GiftOutlined />),
    getItem('Shared Files', '/shared-files', <FileOutlined />),
    getItem('AdMob', '/admob', <DollarOutlined />),
    getItem('Settings', '/settings', <SettingOutlined />),
];

const Sidebar = ({ collapsed, isMobile }) => {
    const { token } = useToken();
    const navigate = useNavigate();
    const location = useLocation();

    const handleMenuClick = (item) => {
        navigate(item.key);
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 3,
                background: token.colorBgContainer,
                boxShadow: '2px 0 8px rgba(0,0,0,0.06)'
            }}
        >
            <div style={{ 
                height: 64, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '16px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`
            }}>
                <img 
                    src="/logo.png" 
                    alt="Logo" 
                    style={{ 
                        height: collapsed ? '32px' : '40px',
                        transition: 'all 0.2s'
                    }} 
                />
            </div>
            <Menu
                theme="light"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
                style={{
                    borderRight: 'none'
                }}
            />
        </Sider>
    );
};

export default Sidebar;

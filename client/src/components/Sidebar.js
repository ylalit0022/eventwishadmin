import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    DashboardOutlined,
    FileOutlined,
    FolderOutlined,
    MobileOutlined,
    GiftOutlined,
    FormOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const menuItems = [
    {
        key: '/',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        path: '/'
    },
    {
        key: '/templates',
        icon: <FileOutlined />,
        label: 'Templates',
        path: '/templates'
    },
    {
        key: '/files',
        icon: <FolderOutlined />,
        label: 'Files',
        path: '/files'
    },
    {
        key: '/admob',
        icon: <MobileOutlined />,
        label: 'AdMob',
        path: '/admob'
    },
    {
        key: '/shared-wishes',
        icon: <GiftOutlined />,
        label: 'Shared Wishes',
        path: '/shared-wishes'
    },
];

const Sidebar = ({ darkMode }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleMenuClick = (item) => {
        navigate(item.key);
    };

    return (
        <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={setCollapsed}
            theme={darkMode ? 'dark' : 'light'}
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'sticky',
                top: 0,
                left: 0,
            }}
        >
            <div style={{ 
                height: 32, 
                margin: 16, 
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <span style={{ 
                    color: darkMode ? '#fff' : '#000',
                    fontWeight: 'bold',
                    fontSize: collapsed ? '14px' : '18px'
                }}>
                    {collapsed ? 'EW' : 'EventWishes'}
                </span>
            </div>
            
            <Menu
                theme={darkMode ? 'dark' : 'light'}
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
            />
        </Sider>
    );
};

export default Sidebar;

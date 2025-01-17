import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    FileOutlined,
    FolderOutlined,
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
    }
];

const Sidebar = ({ collapsed, isMobile }) => {
    const location = useLocation();

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            breakpoint="lg"
            collapsedWidth={isMobile ? 0 : 80}
            width={220}
            theme="light"
            style={{
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 999,
                boxShadow: collapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s'
            }}
        >
            <div className="logo" style={{
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: '0 24px',
                color: '#1890ff',
                fontSize: collapsed ? '20px' : '18px',
                fontWeight: 'bold',
                borderBottom: '1px solid #f0f0f0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
            }}>
                {!collapsed && 'Event Wishes'}
                {collapsed && !isMobile && 'EW'}
            </div>

            <Menu
                theme="light"
                mode="inline"
                selectedKeys={[location.pathname]}
                style={{
                    borderRight: 0,
                    marginTop: '8px'
                }}
                items={menuItems.map(item => ({
                    key: item.key,
                    icon: item.icon,
                    label: <Link to={item.path}>{item.label}</Link>
                }))}
            />
        </Sider>
    );
};

export default Sidebar;

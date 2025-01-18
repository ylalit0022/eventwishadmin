import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    MenuOutlined,
    DashboardOutlined,
    FileOutlined,
    ShareAltOutlined,
    AppstoreOutlined,
    SettingOutlined,
    GiftOutlined
} from '@ant-design/icons';
import Sidebar from './Sidebar';
import { useResponsive } from '../hooks/useResponsive';
import './Layout.css';

const { Header, Content } = AntLayout;

const Layout = ({ children }) => {
    const { isMobile } = useResponsive();
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Dashboard'
        },
        {
            key: '/templates',
            icon: <FileOutlined />,
            label: 'Templates'
        },
        {
            key: '/shared-files',
            icon: <ShareAltOutlined />,
            label: 'Shared Files'
        },
        {
            key: '/admob-ads',
            icon: <AppstoreOutlined />,
            label: 'AdMob'
        },
        {
            key: '/shared-wishes',
            icon: <GiftOutlined />,
            label: 'Shared Wishes'
        },
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: 'Settings'
        }
    ];

    const handleMenuClick = (e) => {
        navigate(e.key);
        if (isMobile) {
            setCollapsed(true);
        }
    };

    return (
        <AntLayout className="app-layout">
            {/* Show sidebar only on mobile */}
            {isMobile && (
                <Sidebar 
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    menuItems={menuItems}
                    selectedKey={location.pathname}
                    onMenuClick={handleMenuClick}
                />
            )}
            
            <AntLayout className={isMobile ? 'site-layout-mobile' : 'site-layout-desktop'}>
                <Header className="site-header">
                    <div className="header-content">
                        {isMobile ? (
                            <Button
                                type="text"
                                icon={<MenuOutlined />}
                                onClick={() => setCollapsed(!collapsed)}
                                className="menu-trigger"
                            />
                        ) : null}
                        
                        <div 
                            className="logo" 
                            onClick={() => navigate('/')}
                            style={{ cursor: 'pointer' }}
                        >
                            EventWishes Admin
                        </div>

                        {/* Show menu in header only on desktop */}
                        {!isMobile && (
                            <div className="header-nav">
                                <Menu
                                    theme="dark"
                                    mode="horizontal"
                                    selectedKeys={[location.pathname]}
                                    items={menuItems}
                                    onClick={handleMenuClick}
                                />
                            </div>
                        )}
                    </div>
                </Header>
                
                <Content className="site-content">
                    <div className="content-container">
                        {children}
                    </div>
                </Content>
            </AntLayout>

            {/* Mobile overlay */}
            {isMobile && !collapsed && (
                <div 
                    className="sidebar-overlay" 
                    onClick={() => setCollapsed(true)}
                />
            )}
        </AntLayout>
    );
};

export default Layout;

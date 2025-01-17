import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout as AntLayout, Button, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';

const { Content } = AntLayout;
const { useToken } = theme;

const Layout = () => {
    const { token } = useToken();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) setCollapsed(true);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };

    return (
        <AntLayout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} isMobile={isMobile} />
            <AntLayout 
                style={{
                    marginLeft: isMobile ? 0 : (collapsed ? 80 : 220),
                    transition: 'all 0.2s'
                }}
            >
                <div style={{
                    padding: '0 24px',
                    background: token.colorBgContainer,
                    display: 'flex',
                    alignItems: 'center',
                    height: 64,
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={toggleSidebar}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                </div>
                <Content style={{ 
                    margin: '24px 16px', 
                    padding: 24, 
                    background: token.colorBgContainer,
                    borderRadius: token.borderRadius,
                    minHeight: 280 
                }}>
                    <Outlet />
                </Content>
            </AntLayout>
        </AntLayout>
    );
};

export default Layout;

import React from 'react';
import { Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    FileOutlined,
    GiftOutlined,
    DollarOutlined,
    SettingOutlined,
    UserOutlined,
    ShareAltOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';
import './Sidebar.styles.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, onCollapse, menuItems, selectedKey, onMenuClick }) => {
    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}
            width={250}
            collapsedWidth={80}
            onCollapse={onCollapse}
        >
            <div className="sidebar-logo">
                <Link to="/" onClick={onMenuClick}>
                    {!collapsed && <h1>EventWishes Admin</h1>}
                </Link>
            </div>
            
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedKey]}
                items={menuItems}
                onClick={onMenuClick}
                className="sidebar-menu"
            />
        </Sider>
    );
};

export default Sidebar;

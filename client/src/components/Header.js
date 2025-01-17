import React from 'react';
import { Layout, Switch, Space, Typography } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header = ({ darkMode, setDarkMode }) => {
    return (
        <AntHeader style={{ 
            padding: '0 16px',
            background: darkMode ? '#141414' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <div>
                <Text strong style={{ color: darkMode ? '#fff' : '#000', fontSize: '18px' }}>
                    Event Wishes Admin Panel
                </Text>
            </div>
            
            <Space>
                <Switch
                    checkedChildren={<BulbFilled />}
                    unCheckedChildren={<BulbOutlined />}
                    checked={darkMode}
                    onChange={(checked) => {
                        setDarkMode(checked);
                        localStorage.setItem('darkMode', checked);
                    }}
                />
            </Space>
        </AntHeader>
    );
};

export default Header;

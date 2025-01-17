import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider, theme } from 'antd';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Templates from './components/Templates';
import SharedFiles from './components/SharedFiles';
import AdMob from './components/AdMob';
import SharedWishes from './components/SharedWishes';
import SharedWishesForm from './components/SharedWishesForm';

const { Content } = Layout;

const App = () => {
    const [darkMode, setDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode ? JSON.parse(savedMode) : false;
    });

    return (
        <ConfigProvider
            theme={{
                algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
            }}
        >
            <Layout style={{ minHeight: '100vh' }}>
                <Sidebar darkMode={darkMode} />
                <Layout>
                    <Header darkMode={darkMode} setDarkMode={setDarkMode} />
                    <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/templates" element={<Templates />} />
                            <Route path="/files" element={<SharedFiles />} />
                            <Route path="/admob" element={<AdMob />} />
                            <Route path="/shared-wishes" element={<SharedWishes />} />
        
                        </Routes>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

export default App;

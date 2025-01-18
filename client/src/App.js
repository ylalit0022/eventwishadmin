import React from 'react';
import { ConfigProvider } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Templates from './components/Templates';
import SharedFiles from './components/SharedFiles';
import AdMob from './components/AdMob';
import SharedWishes from './components/SharedWishes';
import { themeConfig } from './styles/theme';
import './App.css';

const App = () => {
    return (
        <ConfigProvider theme={themeConfig}>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/shared-files" element={<SharedFiles />} />
                    <Route path="/admob-ads" element={<AdMob />} />
                    <Route path="/shared-wishes" element={<SharedWishes />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </ConfigProvider>
    );
};

export default App;

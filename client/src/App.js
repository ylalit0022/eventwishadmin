import React from 'react';
import { ConfigProvider, App as AntApp } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import { themeConfig } from './styles/theme';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SharedWishes from './components/SharedWishes';
import SharedFiles from './components/SharedFiles';
import Templates from './components/Templates';
import AdMob from './components/AdMob';

const App = () => {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Main routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="shared-wishes" element={<SharedWishes />} />
            <Route path="shared-files" element={<SharedFiles />} />
            <Route path="templates" element={<Templates />} />
            <Route path="admob" element={<AdMob />} />
            
            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;

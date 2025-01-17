import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { notification } from 'antd';

// Layout Components
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Templates from './components/Templates';
import TemplateForm from './components/TemplateForm';
import AdMob from './components/AdMob';
import SharedFiles from './components/SharedFiles';
import Settings from './components/Settings';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="templates" element={<Templates />} />
                <Route path="templates/edit/:id" element={<TemplateForm />} />
                <Route path="admob" element={<AdMob />} />
                <Route path="files" element={<SharedFiles />} />
                <Route path="settings" element={<Settings />} />
            </Route>
        </Routes>
    );
}

export default App;

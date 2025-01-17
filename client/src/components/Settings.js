import React, { useState } from 'react';
import { 
    Card, 
    Form, 
    Input, 
    Button, 
    Switch, 
    Space, 
    Typography, 
    message, 
    Grid 
} from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Settings = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [apiEndpoint, setApiEndpoint] = useState(process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

    const onFinish = async (values) => {
        setLoading(true);
        try {
            // Add your settings update logic here
            console.log('Settings values:', values);
            message.success('Settings updated successfully');
        } catch (error) {
            message.error('Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    const handleApiEndpointChange = (event) => {
        setApiEndpoint(event.target.value);
    };

    const handleSaveApiEndpoint = () => {
        // Save to localStorage or environment
        localStorage.setItem('API_ENDPOINT', apiEndpoint);
        message.success('API endpoint updated');
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Settings</Title>
            <Grid container spacing={3}>
                {/* General Settings */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                darkMode: false,
                                autoSave: true
                            }}
                        >
                            <Form.Item
                                name="darkMode"
                                valuePropName="checked"
                                label="Dark Mode"
                            >
                                <Switch />
                            </Form.Item>

                            <Form.Item
                                name="autoSave"
                                valuePropName="checked"
                                label="Auto Save"
                            >
                                <Switch />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                >
                                    Save Settings
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Grid>

                {/* Notification Settings */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            initialValues={{
                                notifications: true,
                                emailNotifications: true
                            }}
                        >
                            <Form.Item
                                name="notifications"
                                valuePropName="checked"
                                label="Push Notifications"
                            >
                                <Switch />
                            </Form.Item>

                            <Form.Item
                                name="emailNotifications"
                                valuePropName="checked"
                                label="Email Notifications"
                            >
                                <Switch />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    icon={<SaveOutlined />}
                                >
                                    Save Settings
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Grid>

                {/* API Configuration */}
                <Grid item xs={12}>
                    <Card>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                        >
                            <Form.Item
                                name="apiEndpoint"
                                label="API Endpoint"
                            >
                                <Input value={apiEndpoint} onChange={handleApiEndpointChange} />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    onClick={handleSaveApiEndpoint}
                                >
                                    Save API Configuration
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

export default Settings;

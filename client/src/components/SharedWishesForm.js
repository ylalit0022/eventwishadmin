import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Select,
    Space,
    Typography,
    message
} from 'antd';
import { sharedWishesApi } from '../services/api';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SharedWishesForm = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [templateLoading, setTemplateLoading] = useState(false);

    const fetchTemplates = async () => {
        try {
            setTemplateLoading(true);
            const response = await sharedWishesApi.getTemplates();
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            message.error('Failed to load templates');
        } finally {
            setTemplateLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            await sharedWishesApi.create(values);
            message.success('Wish created successfully');
            form.resetFields();
        } catch (error) {
            console.error('Error creating wish:', error);
            message.error(error.response?.data?.message || 'Failed to create wish');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={4}>Create Shared Wish</Title>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    validateTrigger={['onChange', 'onBlur']}
                >
                    <Form.Item
                        name="recipientName"
                        label="Recipient Name"
                        rules={[
                            { required: true, message: 'Please enter recipient name' },
                            { min: 2, message: 'Name must be at least 2 characters' },
                            { max: 50, message: 'Name cannot exceed 50 characters' }
                        ]}
                    >
                        <Input placeholder="Enter recipient name" />
                    </Form.Item>

                    <Form.Item
                        name="recipientEmail"
                        label="Recipient Email"
                        rules={[
                            { required: true, message: 'Please enter recipient email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input placeholder="Enter recipient email" />
                    </Form.Item>

                    <Form.Item
                        name="senderName"
                        label="Sender Name"
                        rules={[
                            { required: true, message: 'Please enter sender name' },
                            { min: 2, message: 'Name must be at least 2 characters' },
                            { max: 50, message: 'Name cannot exceed 50 characters' }
                        ]}
                    >
                        <Input placeholder="Enter sender name" />
                    </Form.Item>

                    <Form.Item
                        name="senderEmail"
                        label="Sender Email"
                        rules={[
                            { required: true, message: 'Please enter sender email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input placeholder="Enter sender email" />
                    </Form.Item>

                    <Form.Item
                        name="templateId"
                        label="Template"
                        rules={[{ required: true, message: 'Please select a template' }]}
                    >
                        <Select
                            placeholder="Select a template"
                            loading={templateLoading}
                            disabled={templateLoading}
                        >
                            {templates.map(template => (
                                <Option key={template.id} value={template.id}>
                                    {template.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="message"
                        label="Custom Message"
                        rules={[
                            { max: 500, message: 'Message cannot exceed 500 characters' }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="Enter custom message (optional)"
                            showCount
                            maxLength={500}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            disabled={loading || templateLoading}
                        >
                            Create Wish
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Space>
    );
};

export default SharedWishesForm;

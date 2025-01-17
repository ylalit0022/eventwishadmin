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

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            // Add form submission logic here when needed
            message.success('Form submitted successfully');
            form.resetFields();
        } catch (error) {
            console.error('Error submitting form:', error);
            message.error('Failed to submit form');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={4}>Create Shared Wish</Title>

            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="recipientName"
                        label="Recipient Name"
                        rules={[{ required: true, message: 'Please enter recipient name' }]}
                    >
                        <Input placeholder="Enter recipient name" />
                    </Form.Item>

                    <Form.Item
                        name="senderName"
                        label="Sender Name"
                        rules={[{ required: true, message: 'Please enter sender name' }]}
                    >
                        <Input placeholder="Enter sender name" />
                    </Form.Item>

                    <Form.Item
                        name="templateId"
                        label="Template"
                        rules={[{ required: true, message: 'Please select a template' }]}
                    >
                        <Select placeholder="Select a template">
                            {/* Add template options here */}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="customMessage"
                        label="Custom Message"
                    >
                        <TextArea rows={4} placeholder="Enter custom message (optional)" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Create Wish
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </Space>
    );
};

export default SharedWishesForm;

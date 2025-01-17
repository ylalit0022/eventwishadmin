import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Switch, Input, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { templatesApi } from '../services/api';
import { toast } from '../utils/notification';

const { TextArea } = Input;

const TemplateForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [previewVisible, setPreviewVisible] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        htmlContent: '',
        cssContent: '',
        jsContent: '',
        previewUrl: '',
        isActive: true
    });

    useEffect(() => {
        fetchTemplate();
    }, [id]);

    const fetchTemplate = async () => {
        try {
            setLoading(true);
            const response = await templatesApi.getTemplate(id);
            const templateData = response.template;
            setFormData(templateData);
            form.setFieldsValue(templateData);
        } catch (error) {
            toast.error('Failed to fetch template');
            navigate('/templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            await templatesApi.updateTemplate(id, values);
            toast.success('Template updated successfully');
            navigate('/templates');
        } catch (error) {
            toast.error('Failed to update template');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = () => {
        setPreviewVisible(!previewVisible);
    };

    const renderPreview = () => {
        const combinedCode = `
            <style>${formData.cssContent}</style>
            ${formData.htmlContent}
            <script>${formData.jsContent}</script>
        `;
        return (
            <iframe
                srcDoc={combinedCode}
                style={{ width: '100%', height: '500px', border: '1px solid #ddd' }}
                title="Template Preview"
                sandbox="allow-scripts"
            />
        );
    };

    if (loading) {
        return (
            <Card>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                </div>
            </Card>
        );
    }

    return (
        <Card title="Edit Template">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={formData}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[{ required: true, message: 'Please enter title' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="category"
                            label="Category"
                            rules={[{ required: true, message: 'Please enter category' }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="htmlContent"
                    label="HTML Content"
                    rules={[{ required: true, message: 'Please enter HTML content' }]}
                >
                    <TextArea
                        rows={10}
                        placeholder="Enter HTML content"
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <Form.Item
                    name="cssContent"
                    label="CSS Content"
                    rules={[{ required: true, message: 'Please enter CSS content' }]}
                >
                    <TextArea
                        rows={10}
                        placeholder="Enter CSS content"
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <Form.Item
                    name="jsContent"
                    label="JavaScript Content"
                    rules={[{ required: true, message: 'Please enter JavaScript content' }]}
                >
                    <TextArea
                        rows={10}
                        placeholder="Enter JavaScript content"
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <Form.Item name="isActive" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Save Changes
                    </Button>
                    <Button 
                        style={{ marginLeft: 8 }} 
                        onClick={handlePreview}
                    >
                        {previewVisible ? 'Hide Preview' : 'Show Preview'}
                    </Button>
                    <Button 
                        style={{ marginLeft: 8 }} 
                        onClick={() => navigate('/templates')}
                    >
                        Cancel
                    </Button>
                </Form.Item>
            </Form>

            {previewVisible && (
                <Card title="Preview" style={{ marginTop: 16 }}>
                    {renderPreview()}
                </Card>
            )}
        </Card>
    );
};

export default TemplateForm;

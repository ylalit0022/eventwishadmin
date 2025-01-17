import React, { useState, useEffect } from 'react';
import {
    Table,
    Card,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    message,
    Upload,
    Tooltip,
    DatePicker
} from 'antd';
import {
    PlusOutlined,
    UploadOutlined,
    DownloadOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { templatesApi } from '../services/api';
import CodeEditor from '@uiw/react-textarea-code-editor';
import debounce from 'lodash.debounce';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Templates = () => {
    const [data, setData] = useState({
        templates: [],
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0
        },
        filters: {
            categories: []
        }
    });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(undefined);
    const [selectedCategory, setSelectedCategory] = useState(undefined);
    const [dateRange, setDateRange] = useState(null);

    // Fetch data with filters
    const fetchData = async (page = 1) => {
        try {
            setLoading(true);
            const response = await templatesApi.getAll({
                page,
                limit: data.pagination.pageSize,
                search: searchText,
                status: selectedStatus,
                category: selectedCategory,
                dateRange: dateRange?.join(',')
            });

            if (response?.success && response?.data) {
                setData({
                    templates: response.data.templates,
                    pagination: {
                        ...data.pagination,
                        current: page,
                        total: response.data.pagination.total
                    },
                    filters: response.data.filters
                });
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            message.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    // Initialize data
    useEffect(() => {
        fetchData();
    }, [searchText, selectedStatus, selectedCategory, dateRange]);

    // Handle template creation/update
    const handleSubmit = async (values) => {
        try {
            // Ensure all required fields are present
            const templateData = {
                ...values,
                cssContent: values.cssContent || '',
                jsContent: values.jsContent || '',
                previewUrl: values.previewUrl || '',
                status: values.status || true
            };

            if (editingTemplate) {
                await templatesApi.update(editingTemplate.id, templateData);
                message.success('Template updated successfully');
            } else {
                await templatesApi.create(templateData);
                message.success('Template created successfully');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingTemplate(null);
            fetchData();
        } catch (error) {
            console.error('Error saving template:', error);
            if (error.response?.data?.details) {
                // Show specific validation errors
                const details = error.response.data.details;
                const errorMessages = Object.entries(details)
                    .filter(([_, msg]) => msg)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join('\n');
                message.error(errorMessages || 'Failed to save template');
            } else {
                message.error('Failed to save template');
            }
        }
    };

    // Handle template deletion
    const handleDelete = async (id) => {
        try {
            await templatesApi.delete(id);
            message.success('Template deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting template:', error);
            message.error('Failed to delete template');
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (id, checked) => {
        try {
            await templatesApi.toggleStatus(id);
            message.success('Status updated successfully');
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Failed to update status');
        }
    };

    // Handle template preview
    const handlePreview = async (template) => {
        try {
            const response = await templatesApi.preview({
                htmlContent: template.htmlContent,
                cssContent: template.cssContent,
                jsContent: template.jsContent
            });
            setPreviewContent(response);
            setPreviewVisible(true);
        } catch (error) {
            console.error('Error generating preview:', error);
            message.error('Failed to generate preview');
        }
    };

    // Handle CSV import
    const handleImport = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            await templatesApi.import(formData);
            message.success('Templates imported successfully');
            fetchData();
            return false; // Prevent default upload behavior
        } catch (error) {
            console.error('Error importing templates:', error);
            message.error('Failed to import templates');
            return false;
        }
    };

    // Handle CSV export
    const handleExport = async () => {
        try {
            await templatesApi.export({
                status: selectedStatus,
                category: selectedCategory,
                dateRange: dateRange?.join(',')
            });
            message.success('Export started');
        } catch (error) {
            console.error('Error exporting templates:', error);
            message.error('Failed to export templates');
        }
    };

    // Table columns
    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            sorter: (a, b) => a.title.localeCompare(b.title)
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            filters: data.filters.categories.map(cat => ({
                text: cat,
                value: cat
            })),
            onFilter: (value, record) => record.category === value
        },
        {
            title: 'Preview',
            key: 'preview',
            render: (_, record) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(record)}
                />
            )
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => (
                <Switch
                    checked={record.status}
                    onChange={(checked) => handleStatusToggle(record.id, checked)}
                />
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingTemplate(record);
                            form.setFieldsValue(record);
                            setModalVisible(true);
                        }}
                    />
                    <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    />
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card
                title="Templates"
                extra={
                    <Space>
                        <Input
                            placeholder="Search templates..."
                            prefix={<SearchOutlined />}
                            onChange={debounce(
                                (e) => setSearchText(e.target.value),
                                300
                            )}
                        />
                        <Select
                            placeholder="Filter by status"
                            allowClear
                            onChange={setSelectedStatus}
                            style={{ width: 150 }}
                        >
                            <Option value="true">Active</Option>
                            <Option value="false">Inactive</Option>
                        </Select>
                        <Select
                            placeholder="Filter by category"
                            allowClear
                            onChange={setSelectedCategory}
                            style={{ width: 150 }}
                        >
                            {data.filters.categories.map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                        <RangePicker
                            onChange={(dates) => {
                                setDateRange(dates ? dates.map(d => d.toISOString()) : null);
                            }}
                        />
                        <Upload
                            accept=".csv"
                            showUploadList={false}
                            beforeUpload={handleImport}
                        >
                            <Button icon={<UploadOutlined />}>Import</Button>
                        </Upload>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingTemplate(null);
                                form.resetFields();
                                setModalVisible(true);
                            }}
                        >
                            Add Template
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data.templates}
                    rowKey="id"
                    loading={loading}
                    pagination={data.pagination}
                    onChange={(pagination) => fetchData(pagination.current)}
                />
            </Card>

            {/* Template Form Modal */}
            <Modal
                title={editingTemplate ? 'Edit Template' : 'Add Template'}
                visible={modalVisible}
                onOk={form.submit}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingTemplate(null);
                }}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please enter title' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select category' }]}
                    >
                        <Select
                            showSearch
                            allowClear
                        >
                            {data.filters.categories.map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="htmlContent"
                        label="HTML Content"
                        rules={[{ required: true, message: 'Please enter HTML content' }]}
                    >
                        <CodeEditor
                            language="html"
                            placeholder="Enter HTML content"
                            padding={15}
                            style={{
                                fontSize: 12,
                                backgroundColor: "#f5f5f5",
                                fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="cssContent"
                        label="CSS Content"
                    >
                        <CodeEditor
                            language="css"
                            placeholder="Enter CSS content"
                            padding={15}
                            style={{
                                fontSize: 12,
                                backgroundColor: "#f5f5f5",
                                fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="jsContent"
                        label="JavaScript Content"
                    >
                        <CodeEditor
                            language="javascript"
                            placeholder="Enter JavaScript content"
                            padding={15}
                            style={{
                                fontSize: 12,
                                backgroundColor: "#f5f5f5",
                                fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="previewUrl"
                        label="Preview URL"
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        valuePropName="checked"
                        initialValue={true}
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Preview Modal */}
            <Modal
                title="Template Preview"
                visible={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={null}
                width={800}
            >
                <iframe
                    srcDoc={previewContent}
                    style={{
                        width: '100%',
                        height: '500px',
                        border: 'none'
                    }}
                    title="Template Preview"
                />
            </Modal>
        </div>
    );
};

export default Templates;

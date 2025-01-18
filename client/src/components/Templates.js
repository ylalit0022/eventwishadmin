import React, { useState, useEffect } from 'react';
import {
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
    Tag,
    Dropdown,
    Menu
} from 'antd';
import {
    PlusOutlined,
    UploadOutlined,
    DownloadOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    MenuOutlined
} from '@ant-design/icons';
import { templatesApi } from '../services/api';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ResponsiveTable from './common/ResponsiveTable';
import ResponsiveFilters from './common/ResponsiveFilters';
import { useResponsive } from '../hooks/useResponsive';
import './Templates.css';

const { Option } = Select;

const Templates = () => {
    const { isMobile } = useResponsive();
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
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
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
                    filters: {
                        categories: response.data.filters?.categories || []
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            message.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    // Handle bulk actions
    const handleBulkAction = async (action) => {
        if (!selectedRowKeys.length) {
            message.warning('Please select templates first');
            return;
        }

        try {
            switch (action) {
                case 'delete':
                    await templatesApi.bulkDelete(selectedRowKeys);
                    message.success('Templates deleted successfully');
                    break;
                case 'activate':
                    await templatesApi.bulkUpdateStatus(selectedRowKeys, true);
                    message.success('Templates activated successfully');
                    break;
                case 'deactivate':
                    await templatesApi.bulkUpdateStatus(selectedRowKeys, false);
                    message.success('Templates deactivated successfully');
                    break;
                default:
                    return;
            }
            setSelectedRowKeys([]);
            fetchData();
        } catch (error) {
            console.error('Error performing bulk action:', error);
            message.error('Failed to perform bulk action');
        }
    };

    // Handle import
    const handleImport = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            await templatesApi.import(formData);
            message.success('Templates imported successfully');
            setImportModalVisible(false);
            fetchData();
            return false; // Prevent automatic Upload component upload
        } catch (error) {
            console.error('Error importing templates:', error);
            message.error('Failed to import templates');
            return false;
        }
    };

    // Handle export
    const handleExport = async () => {
        try {
            await templatesApi.export({
                search: searchText,
                status: selectedStatus,
                category: selectedCategory,
                dateRange: dateRange?.join(',')
            });
            message.success('Templates exported successfully');
        } catch (error) {
            console.error('Error exporting templates:', error);
            message.error('Failed to export templates');
        }
    };

    // Table row selection
    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys)
    };

    // Bulk action menu
    const bulkActionMenu = (
        <Menu onClick={({ key }) => handleBulkAction(key)}>
            <Menu.Item key="delete" danger>Delete Selected</Menu.Item>
            <Menu.Item key="activate">Activate Selected</Menu.Item>
            <Menu.Item key="deactivate">Deactivate Selected</Menu.Item>
        </Menu>
    );

    // Handle status toggle
    const handleStatusToggle = async (id, checked) => {
        try {
            await templatesApi.toggleStatus(id);
            message.success(`Template ${checked ? 'activated' : 'deactivated'} successfully`);
            fetchData();
        } catch (error) {
            console.error('Error toggling template status:', error);
            message.error('Failed to update template status');
        }
    };

    // Table columns
    const columns = [
        {
            title: '#',
            key: 'serialNumber',
            width: 70,
            render: (_, __, index) => {
                const { current, pageSize } = data.pagination;
                return ((current - 1) * pageSize) + index + 1;
            }
        },
        {
            title: 'Name',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: isMobile ? 100 : 120,
            render: category => (
                <Tag color="blue">{category}</Tag>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: isMobile ? 90 : 100,
            render: (status, record) => (
                <Switch
                    checked={status}
                    onChange={(checked) => handleStatusToggle(record.id, checked)}
                />
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: isMobile ? 120 : 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Preview">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    // Effect to fetch data when filters change
    useEffect(() => {
        fetchData(1); // Reset to first page when filters change
    }, [searchText, selectedStatus, selectedCategory, dateRange]);

    // Initialize data
    useEffect(() => {
        fetchData();
    }, []);

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            setLoading(true);

            // Prepare template data
            const templateData = {
                title: values.title.trim(),
                category: values.category.trim(),
                htmlContent: values.htmlContent.trim(),
                cssContent: values.cssContent?.trim() || '',
                jsContent: values.jsContent?.trim() || '',
                previewUrl: values.previewUrl?.trim() || '',
                status: values.status !== undefined ? values.status : true
            };

            let response;
            if (editingTemplate) {
                response = await templatesApi.update(editingTemplate.id, templateData);
            } else {
                response = await templatesApi.create(templateData);
            }

            if (response?.success) {
                message.success(editingTemplate ? 'Template updated successfully' : 'Template created successfully');
                setModalVisible(false);
                form.resetFields();
                setEditingTemplate(null);
                fetchData();
            } else {
                throw new Error(response?.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            const errorMessage = error.message || 'Failed to save template';
            const fieldErrors = error.errors;
            
            if (fieldErrors) {
                Object.entries(fieldErrors).forEach(([field, error]) => {
                    if (error) {
                        form.setFields([{
                            name: field,
                            errors: [error]
                        }]);
                    }
                });
            } else {
                message.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditingTemplate(record);
        form.setFieldsValue({
            title: record.title,
            category: record.category,
            htmlContent: record.htmlContent,
            cssContent: record.cssContent,
            jsContent: record.jsContent,
            previewUrl: record.previewUrl,
            status: record.status
        });
        setModalVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            await templatesApi.delete(record.id);
            message.success('Template deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting template:', error);
            message.error('Failed to delete template');
        }
    };

    const handlePreview = (record) => {
        // Combine HTML, CSS and JS into a single HTML document
        const combinedContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${record.title}</title>
                <style>
                    ${record.cssContent || ''}
                </style>
            </head>
            <body>
                ${record.htmlContent || ''}
                <script>
                    ${record.jsContent || ''}
                </script>
            </body>
            </html>
        `;

        setPreviewContent(combinedContent);
        setPreviewVisible(true);
    };

    const handleTableChange = (pagination) => {
        fetchData(pagination.current);
    };

    return (
        <div className="templates-container">
            <Card
                title="Template Management"
                extra={
                    <Space>
                        {selectedRowKeys.length > 0 && (
                            <Dropdown overlay={bulkActionMenu}>
                                <Button icon={<MenuOutlined />}>
                                    Bulk Actions ({selectedRowKeys.length})
                                </Button>
                            </Dropdown>
                        )}
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingTemplate(null);
                                form.resetFields();
                                setModalVisible(true);
                            }}
                        >
                            Add New
                        </Button>
                    </Space>
                }
            >
                <ResponsiveFilters
                    onSearch={setSearchText}
                    onStatusChange={setSelectedStatus}
                    onCategoryChange={setSelectedCategory}
                    onDateRangeChange={setDateRange}
                    showCategoryFilter={true}
                    categories={data.filters.categories}
                    showDateFilter={true}
                    placeholder="Search templates..."
                />

                <ResponsiveTable
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={data.templates}
                    loading={loading}
                    pagination={data.pagination}
                    onChange={handleTableChange}
                    rowKey="id"
                />
            </Card>

            <Modal
                title={editingTemplate ? 'Edit Template' : 'Create New Template'}
                open={modalVisible}
                onOk={form.submit}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingTemplate(null);
                }}
                width={800}
                confirmLoading={loading}
                destroyOnClose
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        status: true,
                        cssContent: '',
                        jsContent: ''
                    }}
                >
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[
                            { required: true, message: 'Please enter template title' },
                            { max: 100, message: 'Title cannot exceed 100 characters' }
                        ]}
                    >
                        <Input placeholder="Enter template title" />
                    </Form.Item>

                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true, message: 'Please select category' }]}
                    >
                        <Select
                            placeholder="Select category"
                            showSearch
                            allowClear
                            options={data.filters.categories.map(cat => ({ label: cat, value: cat }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Preview URL"
                        name="previewUrl"
                        rules={[
                            {
                                type: 'url',
                                message: 'Please enter a valid URL'
                            }
                        ]}
                    >
                        <Input placeholder="Enter preview image URL" />
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
                            placeholder="Enter CSS content (optional)"
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
                            placeholder="Enter JavaScript content (optional)"
                            padding={15}
                            style={{
                                fontSize: 12,
                                backgroundColor: "#f5f5f5",
                                fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="status"
                        label="Status"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Preview Template"
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                width="80%"
                style={{ top: 20 }}
                footer={null}
            >
                <iframe
                    srcDoc={previewContent}
                    style={{
                        width: '100%',
                        height: '600px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px'
                    }}
                    sandbox="allow-scripts"
                    title="Template Preview"
                />
            </Modal>
        </div>
    );
};

export default Templates;

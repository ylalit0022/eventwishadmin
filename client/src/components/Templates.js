import React, { useState, useRef, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, Space, Upload, Menu, Dropdown, Tag, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, UploadOutlined, DownloadOutlined, MenuOutlined } from '@ant-design/icons';
import { templatesApi } from '../services/templatesApi';
import CodeEditor from '@uiw/react-textarea-code-editor';
import ResponsiveFilters from './common/ResponsiveFilters';
import { useResponsive } from '../hooks/useResponsive';
import './Templates.css';

function Templates() {
    const { isMobile } = useResponsive();
    const [data, setData] = useState({
        templates: [],
        total: 0,
        filters: { 
            categories: [] 
        }
    });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [currentPreview, setCurrentPreview] = useState(null);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [importLoading, setImportLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(undefined);
    const [selectedCategory, setSelectedCategory] = useState(undefined);
    const [dateRange, setDateRange] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10
    });
    const [form] = Form.useForm();

    // Reset form when modal is closed
    useEffect(() => {
        if (!modalVisible) {
            form.resetFields();
            setEditingTemplate(null);
        }
    }, [modalVisible, form]);

    const fetchData = async (page = pagination.current, pageSize = pagination.pageSize) => {
        try {
            setLoading(true);
            const response = await templatesApi.getAll({
                page,
                limit: pageSize,
                search: searchText,
                status: selectedStatus,
                category: selectedCategory,
                startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
                endDate: dateRange?.[1]?.format('YYYY-MM-DD')
            });

            if (response.success) {
                setData(response.data);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    total: response.data.total
                }));
            } else {
                message.error(response.message);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [searchText, selectedStatus, selectedCategory, dateRange]);

    const handleDelete = async (id) => {
        if (!id) {
            message.error('Invalid template ID');
            return;
        }

        Modal.confirm({
            title: 'Delete Template',
            content: 'Are you sure you want to delete this template?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            maskClosable: true,
            onOk: async () => {
                try {
                    setLoading(true);
                    const response = await templatesApi.delete(id);
                    if (response.success) {
                        message.success('Template deleted successfully');
                        fetchData(pagination.current);
                    } else {
                        message.error(response.message || 'Failed to delete template');
                    }
                } catch (error) {
                    console.error('Error deleting template:', error);
                    message.error(error.response?.data?.message || 'Failed to delete template');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            let response;

            const formData = {
                ...values,
                status: values.status === undefined ? true : values.status,
                cssContent: values.cssContent || '',
                jsContent: values.jsContent || '',
                previewUrl: values.previewUrl || ''
            };

            if (editingTemplate?.id) {
                response = await templatesApi.update(editingTemplate.id, formData);
            } else {
                response = await templatesApi.create(formData);
            }

            if (response.success) {
                message.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully`);
                setModalVisible(false);
                form.resetFields();
                fetchData(pagination.current);
            } else {
                message.error(response.message || 'Failed to save template');
            }
        } catch (error) {
            console.error('Error submitting template:', error);
            message.error(error.response?.data?.message || 'Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            setLoading(true);
            const response = await templatesApi.toggleStatus(id);
            if (response.success) {
                message.success('Template status updated successfully');
                fetchData(pagination.current);
            } else {
                message.error(response.message || 'Failed to update template status');
            }
        } catch (error) {
            console.error('Error toggling template status:', error);
            message.error(error.response?.data?.message || 'Failed to update template status');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditingTemplate(record);
        form.setFieldsValue({
            ...record,
            status: record.status === undefined ? true : record.status
        });
        setModalVisible(true);
    };

    const handleImport = async (file) => {
        try {
            setImportLoading(true);
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await templatesApi.import(formData);
            
            if (response.success) {
                message.success(response.message);
                
                // Show detailed results in a modal
                Modal.info({
                    title: 'Import Results',
                    content: (
                        <div>
                            <p>Successfully imported templates:</p>
                            <ul>
                                <li>{response.data.inserted} new templates inserted</li>
                                <li>{response.data.updated} existing templates updated</li>
                                <li>{response.data.failed} templates failed to import</li>
                            </ul>
                            {response.data.errors.length > 0 && (
                                <>
                                    <p>Errors:</p>
                                    <ul>
                                        {response.data.errors.map((error, index) => (
                                            <li key={index} style={{ color: 'red' }}>{error}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    ),
                    width: 600,
                });
                
                fetchData(pagination.current);
            } else {
                message.error(response.message || 'Failed to import templates');
            }
        } catch (error) {
            console.error('Error importing templates:', error);
            message.error(error.response?.data?.message || 'Failed to import templates');
        } finally {
            setImportLoading(false);
        }
    };

    const beforeUpload = (file) => {
        const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
        if (!isCSV) {
            message.error('You can only upload CSV files!');
            return false;
        }
        return true;
    };

    const handleExport = async () => {
        try {
            const response = await templatesApi.export();
            
            if (response.success) {
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'templates.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                message.success('Templates exported successfully');
            } else {
                message.error(response.message);
            }
        } catch (error) {
            console.error('Error exporting templates:', error);
            message.error('Failed to export templates');
        }
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setPagination(prev => ({
            ...prev,
            current: pagination.current,
            pageSize: pagination.pageSize
        }));
        fetchData(pagination.current, pagination.pageSize);
    };

    const handleBulkAction = async (action) => {
        if (!selectedRowKeys.length) {
            message.warning('Please select templates first');
            return;
        }

        try {
            setLoading(true);
            let response;

            switch (action) {
                case 'delete':
                    Modal.confirm({
                        title: 'Delete Templates',
                        content: `Are you sure you want to delete ${selectedRowKeys.length} templates?`,
                        okText: 'Yes',
                        okType: 'danger',
                        cancelText: 'No',
                        onOk: async () => {
                            try {
                                response = await templatesApi.bulkDelete(selectedRowKeys);
                                if (response.success) {
                                    message.success(response.message || 'Templates deleted successfully');
                                    setSelectedRowKeys([]);
                                    fetchData(pagination.current);
                                } else {
                                    message.error(response.message || 'Failed to delete templates');
                                }
                            } catch (error) {
                                console.error('Error in bulk delete:', error);
                                message.error('Failed to delete templates');
                            }
                        }
                    });
                    break;

                case 'activate':
                    response = await templatesApi.bulkUpdateStatus(selectedRowKeys, true);
                    if (response.success) {
                        message.success(response.message || 'Templates activated successfully');
                        setSelectedRowKeys([]);
                        fetchData(pagination.current);
                    } else {
                        message.error(response.message || 'Failed to activate templates');
                    }
                    break;

                case 'deactivate':
                    response = await templatesApi.bulkUpdateStatus(selectedRowKeys, false);
                    if (response.success) {
                        message.success(response.message || 'Templates deactivated successfully');
                        setSelectedRowKeys([]);
                        fetchData(pagination.current);
                    } else {
                        message.error(response.message || 'Failed to deactivate templates');
                    }
                    break;

                default:
                    message.error('Invalid action');
                    return;
            }
        } catch (error) {
            console.error('Error performing bulk action:', error);
            message.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (record) => {
        try {
            setCurrentPreview(record);
            // Create a complete HTML document with the template content
            const previewContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${record.title || 'Template Preview'}</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        }
                        ${record.cssContent || ''}
                    </style>
                </head>
                <body>
                    ${record.htmlContent || ''}
                    <script>
                        try {
                            ${record.jsContent || ''}
                        } catch (error) {
                            console.error('Error in template JavaScript:', error);
                        }
                    </script>
                </body>
                </html>
            `;
            setPreviewContent(previewContent);
            setPreviewVisible(true);
        } catch (error) {
            console.error('Error previewing template:', error);
            message.error('Failed to generate preview');
        }
    };

    const handleAfterModalOpen = () => {
        const previewFrame = document.getElementById('preview-frame');
        if (previewFrame) {
            const frameDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
            frameDoc.open();
            frameDoc.write(previewContent);
            frameDoc.close();
        }
    };

    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            width: 60,
            render: (_, __, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            ellipsis: true,
            width: isMobile ? 120 : 200
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: isMobile ? 100 : 150,
            render: category => <Tag color="blue">{category}</Tag>
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: isMobile ? 100 : 150,
            render: date => new Date(date).toLocaleDateString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: isMobile ? 80 : 100,
            render: (status, record) => (
                <Switch
                    checked={status}
                    onChange={(checked) => handleToggleStatus(record.id)}
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
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys)
    };

    const bulkActionMenu = (
        <Menu onClick={({ key }) => handleBulkAction(key)}>
            <Menu.Item key="delete" danger>Delete Selected</Menu.Item>
            <Menu.Item key="activate">Activate Selected</Menu.Item>
            <Menu.Item key="deactivate">Deactivate Selected</Menu.Item>
        </Menu>
    );

    return (
        <div className="templates-container">
            <Card title="Templates" 
                extra={
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingTemplate(null);
                                setModalVisible(true);
                            }}
                        >
                            Add Template
                        </Button>
                        <Upload
                            accept=".csv"
                            showUploadList={false}
                            beforeUpload={beforeUpload}
                            customRequest={({ file, onSuccess, onError }) => {
                                handleImport(file)
                                    .then(() => onSuccess())
                                    .catch(err => onError(err));
                                return false;
                            }}
                            disabled={importLoading}
                        >
                            <Button
                                icon={<UploadOutlined />}
                                loading={importLoading}
                            >
                                Import
                            </Button>
                        </Upload>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                        {selectedRowKeys.length > 0 && (
                            <Dropdown overlay={bulkActionMenu}>
                                <Button>
                                    Bulk Actions <MenuOutlined />
                                </Button>
                            </Dropdown>
                        )}
                    </Space>
                }
            >
                <ResponsiveFilters
                    searchText={searchText}
                    onSearchChange={setSearchText}
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    categories={data.filters.categories}
                />

                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={data.templates}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                        ...pagination,
                        total: data.total,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} items`
                    }}
                    onChange={handleTableChange}
                />

                <Modal
                    title={editingTemplate ? 'Edit Template' : 'Add Template'}
                    open={modalVisible}
                    onCancel={() => setModalVisible(false)}
                    footer={null}
                    width={800}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            status: true,
                            category: '',
                            htmlContent: '',
                            cssContent: '',
                            jsContent: '',
                            previewUrl: ''
                        }}
                    >
                        <Form.Item
                            name="title"
                            label="Title"
                            rules={[
                                { required: true, message: 'Please enter title' },
                                { max: 100, message: 'Title cannot exceed 100 characters' }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="category"
                            label="Category"
                            rules={[{ required: true, message: 'Please select category' }]}
                        >
                            <Select>
                                {data.filters.categories.map(cat => (
                                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="previewUrl"
                            label="Preview URL"
                            rules={[
                                { type: 'url', message: 'Please enter a valid URL' }
                            ]}
                        >
                            <Input placeholder="Enter preview image URL (optional)" />
                        </Form.Item>

                        <Form.Item
                            name="htmlContent"
                            label="HTML Content"
                            rules={[{ required: true, message: 'Please enter HTML content' }]}
                        >
                            <CodeEditor
                                language="html"
                                style={{
                                    fontSize: 12,
                                    backgroundColor: "#f5f5f5",
                                    fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                                }}
                                padding={15}
                                minHeight={200}
                            />
                        </Form.Item>

                        <Form.Item
                            name="cssContent"
                            label="CSS Content"
                        >
                            <CodeEditor
                                language="css"
                                style={{
                                    fontSize: 12,
                                    backgroundColor: "#f5f5f5",
                                    fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                                }}
                                padding={15}
                                minHeight={150}
                            />
                        </Form.Item>

                        <Form.Item
                            name="jsContent"
                            label="JavaScript Content"
                        >
                            <CodeEditor
                                language="javascript"
                                style={{
                                    fontSize: 12,
                                    backgroundColor: "#f5f5f5",
                                    fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                                }}
                                padding={15}
                                minHeight={150}
                            />
                        </Form.Item>

                        <Form.Item
                            name="status"
                            valuePropName="checked"
                            label="Status"
                        >
                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    {editingTemplate ? 'Update' : 'Create'}
                                </Button>
                                <Button onClick={() => setModalVisible(false)}>
                                    Cancel
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title={`Preview: ${currentPreview?.title || 'Template'}`}
                    open={previewVisible}
                    onCancel={() => {
                        setPreviewVisible(false);
                        setPreviewContent('');
                        setCurrentPreview(null);
                    }}
                    width={800}
                    footer={null}
                    destroyOnClose
                    afterOpenChange={(visible) => {
                        if (visible) {
                            handleAfterModalOpen();
                        }
                    }}
                >
                    <div style={{ 
                        width: '100%', 
                        height: '70vh',
                        border: '1px solid #f0f0f0',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        <iframe
                            id="preview-frame"
                            title="Template Preview"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                backgroundColor: 'white'
                            }}
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                        />
                    </div>
                </Modal>
            </Card>
        </div>
    );
}

export default Templates;

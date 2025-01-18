import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    message,
    Upload,
    Tag,
    Image,
    Tooltip,
    App
} from 'antd';
import {
    PlusOutlined,
    UploadOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    DownloadOutlined
} from '@ant-design/icons';
import { sharedFilesApi } from '../services/api';
import ResponsiveTable from './common/ResponsiveTable';
import ResponsiveFilters from './common/ResponsiveFilters';
import { useResponsive } from '../hooks/useResponsive';
import './SharedFiles.css';

const { Option } = Select;

const SharedFiles = () => {
    const { isMobile } = useResponsive();
    const [data, setData] = useState({
        files: [],
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0
        }
    });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [editingFile, setEditingFile] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [selectedType, setSelectedType] = useState(undefined);
    const [selectedStatus, setSelectedStatus] = useState(undefined);
    const [messageApi, contextHolder] = message.useMessage();
    const [exportLoading, setExportLoading] = useState(false);
    const [filter, setFilter] = useState('today');

    const fetchData = async (page = data.pagination.current) => {
        try {
            setLoading(true);
            const response = await sharedFilesApi.getAll({
                page,
                limit: data.pagination.pageSize,
                search: searchText,
                type: selectedType,
                status: selectedStatus
            });

            if (response?.success && response?.data) {
                setData({
                    files: response.data.files || [],
                    pagination: {
                        ...data.pagination,
                        current: page,
                        total: response.data.total || 0
                    }
                });
            } else {
                messageApi.error('Failed to fetch files');
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            messageApi.error('Failed to fetch files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
    }, [searchText, selectedType, selectedStatus]);

    const handleUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await sharedFilesApi.upload(formData, (event) => {
                const percent = Math.floor((event.loaded / event.total) * 100);
                file.percent = percent;
            });

            if (response.success) {
                messageApi.success('File uploaded successfully');
                fetchData();
            } else {
                messageApi.error('Failed to upload file');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            messageApi.error('Error uploading file: ' + (error.message || 'Unknown error'));
        }
        return false;
    };

    const handleDelete = async (id) => {
        try {
            const response = await sharedFilesApi.delete(id);
            if (response.success) {
                messageApi.success('File deleted successfully');
                fetchData();
            } else {
                messageApi.error('Failed to delete file');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            messageApi.error('Failed to delete file');
        }
    };

    const handleDownload = async (record) => {
        if (!record || !record._id) {
            messageApi.error('Invalid file information');
            return;
        }

        try {
            const blob = await sharedFilesApi.download(record._id);
            
            // Create blob URL
            const url = window.URL.createObjectURL(new Blob([blob], { 
                type: record.mimeType || 'application/octet-stream'
            }));
            
            // Create temporary link and trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', record.fileName || 'download');
            document.body.appendChild(link);
            link.click();
            
            // Clean up
            link.remove();
            window.URL.revokeObjectURL(url);
            
            messageApi.success('File download started');
        } catch (error) {
            console.error('Error downloading file:', error);
            messageApi.error(error.message || 'Failed to download file');
        }
    };

    const handleExport = async () => {
        try {
            setExportLoading(true);
            const response = await sharedFilesApi.export(filter);
            
            // Create and trigger download
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            
            // Get current date for filename
            const date = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
            link.setAttribute('download', `shared-files-${filter}-${date}.csv`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            messageApi.success('Files exported successfully');
        } catch (error) {
            console.error('Error exporting files:', error);
            messageApi.error('Failed to export files');
        } finally {
            setExportLoading(false);
        }
    };

    const columns = [
        {
            title: 'File Name',
            dataIndex: 'fileName',
            key: 'fileName',
            render: (text, record) => (
                <Space>
                    {text}
                    <Tag color="blue">{record.mimeType}</Tag>
                </Space>
            )
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            render: (size) => {
                const kb = size / 1024;
                if (kb < 1024) {
                    return `${kb.toFixed(2)} KB`;
                }
                return `${(kb / 1024).toFixed(2)} MB`;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Download">
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownload(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record._id)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    // Add filter options for export
    const filterOptions = [
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'All Time', value: 'all' }
    ];

    // Add extra actions to the card
    const extraActions = (
        <Space wrap>
            <Select
                value={filter}
                onChange={setFilter}
                style={{ width: 120 }}
                options={filterOptions}
            />
            <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exportLoading}
            >
                Export
            </Button>
            <Upload
                showUploadList={false}
                beforeUpload={handleUpload}
                accept="*/*"
            >
                <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
        </Space>
    );

    return (
        <App>
            {contextHolder}
            <Card title="Shared Files" extra={extraActions}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                        <Input.Search
                            placeholder="Search files..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                        />
                    </Space>

                    <ResponsiveTable
                        columns={columns}
                        dataSource={data.files}
                        rowKey="_id"
                        loading={loading}
                        pagination={{
                            ...data.pagination,
                            onChange: fetchData
                        }}
                    />
                </Space>
            </Card>
        </App>
    );
};

export default SharedFiles;

import React, { useState, useCallback, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Space, 
    Typography, 
    Modal,
    Progress,
    message,
    Tooltip,
    Input
} from 'antd';
import {
    UploadOutlined,
    DeleteOutlined,
    DownloadOutlined,
    InboxOutlined,
    CopyOutlined,
    EyeOutlined,
    FileOutlined,
    FileImageOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    FilePdfOutlined
} from '@ant-design/icons';
import { useDropzone } from 'react-dropzone';
import { toast } from '../utils/notification';
import { filesApi } from '../services/api';
import API_CONFIG from '../config/api.config';

const { Title, Text } = Typography;

const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return <FileImageOutlined />;
    if (mimetype.startsWith('video/')) return <VideoCameraOutlined />;
    if (mimetype === 'application/pdf') return <FilePdfOutlined />;
    if (mimetype.includes('word') || mimetype === 'text/plain' || 
        mimetype === 'text/csv' || mimetype.includes('excel') || 
        mimetype.includes('sheet')) return <FileTextOutlined />;
    return <FileOutlined />;
};

const formatFileSize = (size) => {
    const kb = size / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(2)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
};

const SharedFiles = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            const response = await filesApi.getAll();
            
            if (response?.success && response.data?.files) {
                setFiles(response.data.files);
            } else {
                console.error('Unexpected response format:', response);
                toast.error('Failed to load files');
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            toast.error('Failed to fetch files: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (uploading) return; // Prevent multiple uploads
        setUploadModalVisible(false);
        setUploading(true);
        setUploadError(null);
        
        try {
            for (const file of acceptedFiles) {
                try {
                    setUploadProgress(0);
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await filesApi.upload(formData, (progressEvent) => {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setUploadProgress(progress);
                    });

                    if (response?.success) {
                        toast.success(`${file.name} uploaded successfully`);
                    } else {
                        throw new Error('Upload failed');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    setUploadError(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
                }
            }
            await fetchFiles(); // Refresh file list after all uploads
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [fetchFiles, uploading]);

    const handleDelete = async (id) => {
        try {
            const response = await filesApi.delete(id);
            if (response?.success) {
                toast.success('File deleted successfully');
                await fetchFiles();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete file: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDownload = (file) => {
        const link = document.createElement('a');
        link.href = `${API_CONFIG.BASE_URL}${filesApi.getFileUrl(file._id)}`;
        link.download = file.originalname;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyUrl = (file) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}${API_CONFIG.BASE_URL}${filesApi.getFileUrl(file._id)}`;
        navigator.clipboard.writeText(url)
            .then(() => message.success('URL copied to clipboard'))
            .catch(() => message.error('Failed to copy URL'));
    };

    const handlePreview = (file) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            setPreviewFile(file);
            setPreviewVisible(true);
        } else {
            window.open(`${API_CONFIG.BASE_URL}${filesApi.getFileUrl(file._id)}`, '_blank');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        disabled: uploading,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
            'text/plain': ['.txt'],
            'video/mp4': ['.mp4'],
            'video/webm': ['.webm'],
            'video/quicktime': ['.mov']
        }
    });

    const filteredFiles = files.filter(file => 
        file.originalname.toLowerCase().includes(searchText.toLowerCase()) ||
        file.mimetype.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'File',
            dataIndex: 'originalname',
            key: 'originalname',
            render: (text, record) => (
                <Space>
                    {getFileIcon(record.mimetype)}
                    <Text>{text}</Text>
                </Space>
            ),
            sorter: (a, b) => a.originalname.localeCompare(b.originalname)
        },
        {
            title: 'Type',
            dataIndex: 'mimetype',
            key: 'mimetype',
            render: (mimetype) => <Text>{mimetype}</Text>,
            sorter: (a, b) => a.mimetype.localeCompare(b.mimetype)
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            render: (size) => <Text>{formatFileSize(size)}</Text>,
            sorter: (a, b) => a.size - b.size
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Preview">
                        <Button 
                            icon={<EyeOutlined />} 
                            onClick={() => handlePreview(record)}
                            disabled={!record.mimetype.startsWith('image/')}
                        />
                    </Tooltip>
                    <Tooltip title="Copy URL">
                        <Button 
                            icon={<CopyOutlined />} 
                            onClick={() => handleCopyUrl(record)}
                        />
                    </Tooltip>
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

    return (
        <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
                    <Title level={4}>Shared Files</Title>
                    <Space>
                        <Input.Search
                            placeholder="Search files..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 200 }}
                        />
                        <Button 
                            type="primary" 
                            icon={<UploadOutlined />}
                            onClick={() => setUploadModalVisible(true)}
                            disabled={uploading}
                        >
                            Upload
                        </Button>
                    </Space>
                </Space>

                <Table
                    dataSource={filteredFiles}
                    columns={columns}
                    loading={loading}
                    rowKey="_id"
                    pagination={{
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} files`
                    }}
                />
            </Space>

            <Modal
                title="Upload Files"
                open={uploadModalVisible}
                onCancel={() => !uploading && setUploadModalVisible(false)}
                footer={null}
                closable={!uploading}
                maskClosable={!uploading}
                destroyOnClose
            >
                <div
                    {...getRootProps()} 
                    style={{
                        padding: '20px',
                        background: isDragActive ? '#f0f8ff' : '#fff',
                        border: '2px dashed #d9d9d9',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        textAlign: 'center'
                    }}
                >
                    <input {...getInputProps()} />
                    <p style={{ marginBottom: '8px' }}>
                        <InboxOutlined style={{ 
                            color: uploading ? '#ccc' : '#40a9ff',
                            fontSize: '48px'
                        }} />
                    </p>
                    <p style={{ 
                        marginBottom: '8px',
                        color: uploading ? '#ccc' : '#000'
                    }}>
                        {uploading ? 'Uploading...' : 'Click or drag files to this area to upload'}
                    </p>
                    <p style={{ 
                        color: '#888',
                        fontSize: '12px'
                    }}>
                        Supported files: Images, Videos, PDFs, Office documents, CSV, Text files (Max: 5MB)
                    </p>
                    {uploadError && (
                        <p style={{ color: 'red' }}>{uploadError}</p>
                    )}
                </div>
                {uploadProgress > 0 && (
                    <Progress 
                        percent={uploadProgress} 
                        status={uploading ? 'active' : 'normal'}
                        style={{ marginTop: 16 }} 
                    />
                )}
            </Modal>

            <Modal
                title="File Preview"
                open={previewVisible}
                onCancel={() => {
                    setPreviewVisible(false);
                    setPreviewFile(null);
                }}
                footer={null}
                width={800}
                destroyOnClose
            >
                {previewFile && (
                    previewFile.mimetype.startsWith('image/') ? (
                        <img
                            alt={previewFile.originalname}
                            src={`${API_CONFIG.BASE_URL}${filesApi.getFileUrl(previewFile._id)}`}
                            style={{ width: '100%' }}
                        />
                    ) : previewFile.mimetype.startsWith('video/') ? (
                        <video
                            controls
                            style={{ width: '100%' }}
                            src={`${API_CONFIG.BASE_URL}${filesApi.getFileUrl(previewFile._id)}`}
                        />
                    ) : null
                )}
            </Modal>
        </Card>
    );
};

export default SharedFiles;

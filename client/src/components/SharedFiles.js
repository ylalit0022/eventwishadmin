import React, { useState, useCallback, useEffect } from 'react';
import { 
    Card, 
    Table, 
    Button, 
    Space, 
    Typography, 
    Upload, 
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
const { Dragger } = Upload;

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

    const fetchFiles = useCallback(async () => {
        try {
            setLoading(true);
            const response = await filesApi.getAll();
            console.log('Files response:', response); // Debug log
            
            if (response?.data?.data?.files) {
                setFiles(response.data.data.files);
            } else {
                console.error('Unexpected response format:', response);
                toast.error('Failed to load files: Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching files:', error);
            toast.error('Failed to fetch files: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const onDrop = useCallback(async (acceptedFiles) => {
        setUploadModalVisible(false);
        
        for (const file of acceptedFiles) {
            try {
                const response = await filesApi.upload(file, (progressEvent) => {
                    const progress = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(progress);
                });

                if (response?.data) {
                    toast.success(`${file.name} uploaded successfully`);
                    await fetchFiles();
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error(`Failed to upload ${file.name}: ${error.response?.data?.message || error.message}`);
            }
        }
        setUploadProgress(0);
    }, [fetchFiles]);

    const handleDelete = async (id) => {
        try {
            await filesApi.delete(id);
            toast.success('File deleted successfully');
            await fetchFiles(); // Refetch files after deletion
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete file');
        }
    };

    const handleDownload = (file) => {
        const link = document.createElement('a');
        link.href = `/api${filesApi.getFileUrl(file._id)}`;
        link.download = file.originalname;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyUrl = (file) => {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/api${filesApi.getFileUrl(file._id)}`;
        navigator.clipboard.writeText(url)
            .then(() => message.success('URL copied to clipboard'))
            .catch(() => message.error('Failed to copy URL'));
    };

    const handlePreview = (file) => {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            setPreviewFile(file);
            setPreviewVisible(true);
        } else {
            window.open(`/api${filesApi.getFileUrl(file._id)}`, '_blank');
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        multiple: true
    });

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
        },
        {
            title: 'Type',
            dataIndex: 'mimetype',
            key: 'mimetype',
            render: (mimetype) => <Text>{mimetype}</Text>,
        },
        {
            title: 'Size',
            dataIndex: 'size',
            key: 'size',
            render: (size) => <Text>{formatFileSize(size)}</Text>,
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
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4}>Shared Files</Title>
                <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    onClick={() => setUploadModalVisible(true)}
                >
                    Upload Files
                </Button>
            </div>

            <Modal
                title="Upload Files"
                open={uploadModalVisible}
                onCancel={() => setUploadModalVisible(false)}
                footer={null}
                width={600}
            >
                <div 
                    {...getRootProps()} 
                    style={{
                        border: '2px dashed #d9d9d9',
                        borderRadius: '4px',
                        padding: '20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginBottom: '16px'
                    }}
                >
                    <input {...getInputProps()} />
                    <p>
                        <InboxOutlined style={{ fontSize: '48px', color: '#40a9ff' }} />
                    </p>
                    <p>Drag and drop files here, or click to select files</p>
                    <p style={{ color: '#888' }}>
                        Supported files: Images, Videos, PDFs, Office documents, CSV, Text files (Max: 5MB)
                    </p>
                </div>
            </Modal>

            <Modal
                title="File Preview"
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={null}
                width={800}
            >
                {previewFile && (
                    previewFile.mimetype.startsWith('image/') ? (
                        <img 
                            src={`/api${filesApi.getFileUrl(previewFile._id)}`}
                            alt={previewFile.originalname}
                            style={{ width: '100%' }}
                        />
                    ) : (
                        <video 
                            src={`/api${filesApi.getFileUrl(previewFile._id)}`}
                            controls
                            style={{ width: '100%' }}
                        />
                    )
                )}
            </Modal>

            {uploadProgress > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <Progress percent={uploadProgress} />
                </div>
            )}

            <Table
                columns={columns}
                dataSource={files}
                rowKey="_id"
                loading={loading}
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} files`
                }}
            />
        </Card>
    );
};

export default SharedFiles;

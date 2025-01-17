import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Table, Space, Button, Modal, Card, Switch,
    Input, DatePicker, Select, Upload, message, Tooltip 
} from 'antd';
import { 
    EyeOutlined, EditOutlined, DeleteOutlined, 
    DownloadOutlined, UploadOutlined, SearchOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import moment from 'moment';
import { toast } from '../utils/notification';
import { templatesApi } from '../services/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Templates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [filters, setFilters] = useState({
        title: '',
        category: '',
        status: null,
        dateRange: null
    });
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchTemplates();
        fetchCategories();
    }, [pagination.current, pagination.pageSize, filters]);

    const fetchCategories = async () => {
        try {
            const response = await templatesApi.getCategories();
            setCategories(response.categories || []);
        } catch (error) {
            message.error('Failed to fetch categories');
        }
    };

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const params = {
                page: pagination.current,
                limit: pagination.pageSize,
                ...filters,
                dateRange: filters.dateRange ? {
                    start: filters.dateRange[0].format('YYYY-MM-DD'),
                    end: filters.dateRange[1].format('YYYY-MM-DD')
                } : null
            };
            
            const response = await templatesApi.getAll(params);
            setTemplates(response.templates || []);
            setPagination({
                ...pagination,
                total: response.total || 0
            });
        } catch (error) {
            message.error('Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (pagination, filters, sorter) => {
        setPagination(pagination);
    };

    const handleStatusToggle = async (id, checked) => {
        try {
            await templatesApi.update(id, { isActive: checked });
            message.success('Template status updated');
            fetchTemplates();
        } catch (error) {
            message.error('Failed to update template status');
        }
    };

    const handlePreview = (template) => {
        setPreviewTemplate(template);
        setPreviewVisible(true);
    };

    const handleExport = () => {
        const exportData = templates.map(template => ({
            Title: template.title,
            Category: template.category,
            'HTML Content': template.htmlContent,
            'CSS Content': template.cssContent,
            'JS Content': template.jsContent,
            'Preview URL': template.previewUrl,
            Status: template.isActive ? 'Active' : 'Inactive',
            'Created At': moment(template.createdAt).format('YYYY-MM-DD HH:mm:ss')
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Templates');
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, 'templates.xlsx');
    };

    const handleImport = async (file) => {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Validate and transform data
                const validatedData = jsonData.map(row => ({
                    title: row.Title,
                    category: row.Category,
                    htmlContent: row['HTML Content'],
                    cssContent: row['CSS Content'],
                    jsContent: row['JS Content'],
                    previewUrl: row['Preview URL'],
                    isActive: row.Status === 'Active'
                }));

                // Import data
                await templatesApi.bulkImport({ templates: validatedData });
                message.success('Templates imported successfully');
                setImportModalVisible(false);
                fetchTemplates();
            };
            reader.readAsArrayBuffer(file);
            return false;
        } catch (error) {
            message.error('Failed to import templates');
            return false;
        }
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: 'Are you sure you want to delete this template?',
            content: 'This action cannot be undone.',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await templatesApi.delete(id);
                    message.success('Template deleted successfully');
                    fetchTemplates();
                } catch (error) {
                    message.error('Failed to delete template');
                }
            }
        });
    };

    const renderPreview = () => {
        if (!previewTemplate) return null;
        
        const combinedCode = `
            <style>${previewTemplate.cssContent}</style>
            ${previewTemplate.htmlContent}
            <script>${previewTemplate.jsContent}</script>
        `;
        return (
            <iframe
                srcDoc={combinedCode}
                style={{ width: '100%', height: '500px', border: '1px solid #ddd' }}
                title="Template Preview"
            />
        );
    };

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            sorter: true,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                <div style={{ padding: 8 }}>
                    <Input
                        placeholder="Search title"
                        value={selectedKeys[0]}
                        onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                        onPressEnter={() => confirm()}
                        style={{ width: 188, marginBottom: 8, display: 'block' }}
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            size="small"
                            style={{ width: 90 }}
                        >
                            Search
                        </Button>
                        <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                            Reset
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            sorter: true,
            filters: categories.map(cat => ({ text: cat, value: cat }))
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            filters: [
                { text: 'Active', value: true },
                { text: 'Inactive', value: false }
            ],
            render: (isActive, record) => (
                <Switch
                    checked={isActive}
                    onChange={(checked) => handleStatusToggle(record._id, checked)}
                />
            )
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            render: date => moment(date).format('YYYY-MM-DD HH:mm:ss')
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="Preview">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handlePreview(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => navigate(`/templates/edit/${record._id}`)}
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => handleDelete(record._id)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div>
            <Card 
                title="Templates"
                extra={
                    <Space>
                        <RangePicker
                            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                        />
                        <Select
                            placeholder="Filter by category"
                            allowClear
                            style={{ width: 200 }}
                            onChange={(value) => setFilters({ ...filters, category: value })}
                        >
                            {categories.map(cat => (
                                <Option key={cat} value={cat}>{cat}</Option>
                            ))}
                        </Select>
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={handleExport}
                        >
                            Export
                        </Button>
                        <Upload
                            accept=".xlsx,.xls,.csv"
                            showUploadList={false}
                            beforeUpload={handleImport}
                        >
                            <Button icon={<UploadOutlined />}>Import</Button>
                        </Upload>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={templates}
                    loading={loading}
                    rowKey="_id"
                    pagination={pagination}
                    onChange={handleTableChange}
                />
            </Card>

            <Modal
                title="Template Preview"
                visible={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                width={800}
                footer={null}
            >
                {renderPreview()}
            </Modal>
        </div>
    );
};

export default Templates;

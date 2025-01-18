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
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { adMobApi } from '../services/api';
import ResponsiveTable from './common/ResponsiveTable';
import ResponsiveFilters from './common/ResponsiveFilters';
import { useResponsive } from '../hooks/useResponsive';
import './AdMob.css';

const { Option } = Select;

const AD_TYPES = [
    { value: 'Banner', label: 'Banner' },
    { value: 'Interstitial', label: 'Interstitial' },
    { value: 'Rewarded', label: 'Rewarded' },
    { value: 'Native', label: 'Native' },
    { value: 'App Open', label: 'App Open' },
    { value: 'Video', label: 'Video' }
];

const AdMob = () => {
    const { isMobile } = useResponsive();
    const [data, setData] = useState({
        ads: [],
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0
        }
    });
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [form] = Form.useForm();
    const [searchText, setSearchText] = useState('');
    const [selectedType, setSelectedType] = useState(undefined);
    const [selectedStatus, setSelectedStatus] = useState(undefined);

    const fetchAds = async (params = {}) => {
        try {
            setLoading(true);
            const response = await adMobApi.getAll({
                page: params.page || data.pagination.current,
                limit: params.pageSize || data.pagination.pageSize,
                search: searchText,
                adType: selectedType,
                status: selectedStatus
            });
            
            setData({
                ads: response.data.ads,
                pagination: {
                    current: params.page || data.pagination.current,
                    pageSize: params.pageSize || data.pagination.pageSize,
                    total: response.data.pagination.total
                }
            });
        } catch (error) {
            console.error('Error fetching ads:', error);
            message.error(error.message || 'Failed to fetch ads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, [searchText, selectedType, selectedStatus]);

    const handleTableChange = (pagination) => {
        fetchAds({
            page: pagination.current,
            pageSize: pagination.pageSize
        });
    };

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleTypeChange = (value) => {
        setSelectedType(value);
    };

    const handleStatusChange = (value) => {
        setSelectedStatus(value);
    };

    const showModal = (record = null) => {
        setEditingAd(record);
        form.resetFields();
        if (record) {
            form.setFieldsValue({
                adName: record.adName,
                adType: record.adType,
                adUnitCode: record.adUnitCode,
                status: record.status
            });
        }
        setModalVisible(true);
    };

    const handleCancel = () => {
        setModalVisible(false);
        setEditingAd(null);
        form.resetFields();
    };

    const handleSubmit = async (values) => {
        try {
            if (editingAd) {
                await adMobApi.update(editingAd.id, values);
                message.success('Ad updated successfully');
            } else {
                await adMobApi.create(values);
                message.success('Ad created successfully');
            }
            setModalVisible(false);
            fetchAds();
        } catch (error) {
            console.error('Error saving ad:', error);
            if (error.response && error.response.data && error.response.data.errors && typeof error.response.data.errors === 'object') {
                Object.entries(error.response.data.errors || {}).forEach(([field, msg]) => {
                    form.setFields([{
                        name: field,
                        errors: [msg]
                    }]);
                });
            } else {
                message.error(error.message || 'Failed to save ad');
            }
        }
    };

    const handleToggleStatus = async (record) => {
        try {
            await adMobApi.update(record.id, { status: !record.status });
            message.success('Ad status updated successfully');
            fetchAds();
        } catch (error) {
            console.error('Error updating status:', error);
            message.error(error.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        try {
            await adMobApi.delete(id);
            message.success('Ad deleted successfully');
            fetchAds();
        } catch (error) {
            console.error('Error deleting ad:', error);
            message.error(error.message || 'Failed to delete ad');
        }
    };

    const columns = [
        {
            title: 'Ad Name',
            dataIndex: 'adName',
            key: 'adName',
            sorter: (a, b) => a.adName.localeCompare(b.adName),
            width: isMobile ? 120 : 200,
            ellipsis: true
        },
        {
            title: 'Ad Type',
            dataIndex: 'adType',
            key: 'adType',
            width: isMobile ? 100 : 120,
            filters: AD_TYPES.map(type => ({
                text: type.label,
                value: type.value
            })),
            onFilter: (value, record) => record.adType === value
        },
        {
            title: 'Ad Unit Code',
            dataIndex: 'adUnitCode',
            key: 'adUnitCode',
            width: isMobile ? 150 : 300,
            ellipsis: true
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status, record) => (
                <Switch
                    checked={status}
                    onChange={() => handleToggleStatus(record)}
                />
            ),
            filters: [
                { text: 'Active', value: true },
                { text: 'Inactive', value: false }
            ],
            onFilter: (value, record) => record.status === value
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => showModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id)}
                    >
                        Delete
                    </Button>
                </Space>
            )
        }
    ];

    const filterConfig = {
        search: {
            placeholder: 'Search by name or unit code',
            value: searchText,
            onChange: handleSearch
        },
        filters: [
            {
                label: 'Type',
                value: selectedType,
                onChange: handleTypeChange,
                options: [
                    { value: undefined, label: 'All Types' },
                    ...AD_TYPES
                ]
            },
            {
                label: 'Status',
                value: selectedStatus,
                onChange: handleStatusChange,
                options: [
                    { value: undefined, label: 'All Status' },
                    { value: true, label: 'Active' },
                    { value: false, label: 'Inactive' }
                ]
            }
        ]
    };

    return (
        <div className="admob-container">
            <Card
                title="AdMob Ads"
                extra={
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => showModal()}
                    >
                        Add New Ad
                    </Button>
                }
            >
                <ResponsiveFilters config={filterConfig} />
                
                <ResponsiveTable
                    columns={columns}
                    dataSource={data.ads}
                    rowKey="id"
                    loading={loading}
                    pagination={data.pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 800 }}
                />

                <Modal
                    title={editingAd ? 'Edit Ad' : 'Add New Ad'}
                    open={modalVisible}
                    onCancel={handleCancel}
                    footer={null}
                    destroyOnClose
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{ status: true }}
                    >
                        <Form.Item
                            name="adName"
                            label="Ad Name"
                            rules={[
                                { required: true, message: 'Please enter ad name' },
                                { max: 100, message: 'Ad name cannot exceed 100 characters' }
                            ]}
                        >
                            <Input placeholder="Enter ad name" />
                        </Form.Item>

                        <Form.Item
                            name="adType"
                            label="Ad Type"
                            rules={[{ required: true, message: 'Please select ad type' }]}
                        >
                            <Select placeholder="Select ad type">
                                {AD_TYPES.map(type => (
                                    <Option key={type.value} value={type.value}>
                                        {type.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="adUnitCode"
                            label="Ad Unit Code"
                            rules={[
                                { required: true, message: 'Please enter ad unit code' },
                                {
                                    pattern: /^ca-app-pub-\d{16}\/\d{10}$/,
                                    message: 'Invalid format. Should be like: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
                                }
                            ]}
                        >
                            <Input placeholder="Enter ad unit code (e.g., ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY)" />
                        </Form.Item>

                        <Form.Item
                            name="status"
                            label="Status"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" htmlType="submit">
                                    {editingAd ? 'Update' : 'Create'}
                                </Button>
                                <Button onClick={handleCancel}>Cancel</Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
            </Card>
        </div>
    );
};

export default AdMob;
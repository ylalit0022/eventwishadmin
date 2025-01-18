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
    App
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined
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
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        fetchData();
    }, [searchText, selectedType, selectedStatus]);

    // Fetch data with filters
    const fetchData = async (page = 1) => {
        try {
            setLoading(true);
            const response = await adMobApi.getAll({
                page,
                limit: data.pagination.pageSize,
                search: searchText,
                adType: selectedType,
                status: selectedStatus
            });

            if (response?.data?.ads) {
                setData({
                    ads: response.data.ads,
                    pagination: {
                        ...data.pagination,
                        current: page,
                        total: response.data.pagination.total
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
            messageApi.error('Failed to fetch ads');
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = {
                adName: values.adName,
                adType: values.adType,
                adUnitId: values.adUnitId,
                status: values.status !== undefined ? values.status : true
            };

            let response;
            if (editingAd) {
                response = await adMobApi.update(editingAd._id, formData);
            } else {
                response = await adMobApi.create(formData);
            }

            if (response?.success) {
                messageApi.success(editingAd ? 'Ad updated successfully' : 'Ad created successfully');
                setModalVisible(false);
                form.resetFields();
                setEditingAd(null);
                fetchData();
            } else {
                throw new Error(response?.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving ad:', error);
            const errorMessage = error.message || 'Failed to save ad';
            const fieldErrors = error.errors;
            
            if (fieldErrors) {
                // Set field-specific errors
                Object.entries(fieldErrors).forEach(([field, error]) => {
                    if (error) {
                        form.setFields([{
                            name: field,
                            errors: [error]
                        }]);
                    }
                });
            } else {
                // Show general error message
                messageApi.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (record) => {
        setEditingAd(record);
        form.setFieldsValue({
            adName: record.adName,
            adType: record.adType,
            adUnitId: record.adUnitId,
            status: record.status
        });
        setModalVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            setLoading(true);
            const response = await adMobApi.delete(record._id);
            if (response?.success) {
                messageApi.success('Ad deleted successfully');
                fetchData();
            } else {
                throw new Error(response?.message || 'Failed to delete ad');
            }
        } catch (error) {
            console.error('Error deleting ad:', error);
            messageApi.error(error.message || 'Failed to delete ad');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (id, checked) => {
        try {
            setLoading(true);
            const response = await adMobApi.update(id, { status: checked });
            if (response?.success) {
                messageApi.success('Status updated successfully');
                fetchData();
            } else {
                throw new Error(response?.message || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            messageApi.error(error.message || 'Failed to update status');
            // Revert the switch state on error
            fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (pagination) => {
        fetchData(pagination.current);
    };

    // Table columns
    const columns = [
        {
            title: 'Name',
            dataIndex: 'adName',
            key: 'adName',
            ellipsis: true,
        },
        {
            title: 'Type',
            dataIndex: 'adType',
            key: 'adType',
            width: isMobile ? 100 : 120,
        },
        {
            title: 'Unit ID',
            dataIndex: 'adUnitId',
            key: 'adUnitId',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status, record) => (
                <Switch
                    checked={status}
                    onChange={(checked) => handleStatusToggle(record._id, checked)}
                />
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <App>
            {contextHolder}
            <div className="admob-container">
                <Card
                    title="AdMob Management"
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingAd(null);
                                form.resetFields();
                                setModalVisible(true);
                            }}
                        >
                            Add New
                        </Button>
                    }
                >
                    <ResponsiveFilters
                        onSearch={setSearchText}
                        onStatusChange={setSelectedStatus}
                        onTypeChange={setSelectedType}
                        showTypeFilter
                        types={AD_TYPES}
                    />

                    <ResponsiveTable
                        columns={columns}
                        dataSource={data.ads}
                        loading={loading}
                        pagination={data.pagination}
                        onChange={handleTableChange}
                        rowKey="_id"
                    />
                </Card>

                <Modal
                    title={editingAd ? 'Edit Ad' : 'Create New Ad'}
                    open={modalVisible}
                    onOk={form.submit}
                    onCancel={() => {
                        setModalVisible(false);
                        form.resetFields();
                        setEditingAd(null);
                    }}
                    confirmLoading={loading}
                    destroyOnClose
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        initialValues={{
                            status: true
                        }}
                    >
                        <Form.Item
                            name="adName"
                            label="Name"
                            rules={[
                                { required: true, message: 'Please enter ad name' },
                                { max: 100, message: 'Ad name cannot exceed 100 characters' }
                            ]}
                        >
                            <Input placeholder="Enter ad name" />
                        </Form.Item>

                        <Form.Item
                            name="adType"
                            label="Type"
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
                            name="adUnitId"
                            label="Unit ID"
                            rules={[
                                { required: true, message: 'Please enter ad unit ID' },
                                {
                                    pattern: /^ca-app-pub-\d{16}\/\d{10}$/,
                                    message: 'Invalid AdMob unit ID format. Should be like: ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY'
                                }
                            ]}
                        >
                            <Input placeholder="ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY" />
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
            </div>
        </App>
    );
};

export default AdMob;
import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    message,
    Card,
    Typography
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';
import { adMobApi } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

// Define ad types locally
const AD_TYPES = [
    { value: 'banner', label: 'Banner Ad' },
    { value: 'interstitial', label: 'Interstitial Ad' },
    { value: 'rewarded', label: 'Rewarded Ad' },
    { value: 'native', label: 'Native Ad' },
    { value: 'app_open', label: 'App Open Ad' }
];

const AdMob = () => {
    const [form] = Form.useForm();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAd, setEditingAd] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    // Fetch ads
    const fetchAds = async (page = 1, pageSize = 10) => {
        try {
            setLoading(true);
            const response = await adMobApi.getAll({
                page,
                limit: pageSize
            });

            if (response?.data?.success) {
                const { ads, pagination: paginationData } = response.data.data;
                setAds(ads);
                setPagination({
                    current: paginationData.page,
                    pageSize,
                    total: paginationData.total
                });
            }
        } catch (error) {
            console.error('Error fetching ads:', error);
            message.error('Failed to fetch ads');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    // Handle form submit
    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            if (editingAd) {
                await adMobApi.update(editingAd._id, values);
                message.success('Ad updated successfully');
            } else {
                await adMobApi.create(values);
                message.success('Ad created successfully');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingAd(null);
            fetchAds(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('Error saving ad:', error);
            message.error('Failed to save ad');
        } finally {
            setLoading(false);
        }
    };

    // Handle ad status toggle
    const handleToggle = async (record) => {
        try {
            setLoading(true);
            await adMobApi.toggle(record._id);
            message.success(`Ad ${record.status ? 'disabled' : 'enabled'} successfully`);
            fetchAds(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('Error toggling ad status:', error);
            message.error('Failed to toggle ad status');
        } finally {
            setLoading(false);
        }
    };

    // Handle ad deletion
    const handleDelete = async (record) => {
        try {
            setLoading(true);
            await adMobApi.delete(record._id);
            message.success('Ad deleted successfully');
            fetchAds(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('Error deleting ad:', error);
            message.error('Failed to delete ad');
        } finally {
            setLoading(false);
        }
    };

    // Table columns
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'Ad Type',
            dataIndex: 'adType',
            key: 'adType',
            render: (text) => {
                const adType = AD_TYPES.find(type => type.value === text);
                return adType ? adType.label : text;
            }
        },
        {
            title: 'Ad Unit ID',
            dataIndex: 'adUnitId',
            key: 'adUnitId'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <span style={{ color: status ? '#52c41a' : '#ff4d4f' }}>
                    {status ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    {' '}
                    {status ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingAd(record);
                            form.setFieldsValue(record);
                            setModalVisible(true);
                        }}
                    >
                        Edit
                    </Button>
                    <Switch
                        checked={record.status}
                        onChange={() => handleToggle(record)}
                    />
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        Delete
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
                        <Title level={4}>AdMob Management</Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingAd(null);
                                form.resetFields();
                                setModalVisible(true);
                            }}
                        >
                            Add New Ad
                        </Button>
                    </Space>

                    <Table
                        columns={columns}
                        dataSource={ads}
                        rowKey="_id"
                        pagination={pagination}
                        loading={loading}
                        onChange={({ current, pageSize }) => fetchAds(current, pageSize)}
                    />
                </Space>
            </Card>

            <Modal
                title={editingAd ? 'Edit Ad' : 'Add New Ad'}
                open={modalVisible}
                onOk={() => form.submit()}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingAd(null);
                }}
                destroyOnClose
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter ad name' }]}
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
                        name="adUnitId"
                        label="Ad Unit ID"
                        rules={[{ required: true, message: 'Please enter Ad Unit ID' }]}
                    >
                        <Input placeholder="Enter Ad Unit ID" />
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
        </Space>
    );
};

export default AdMob;

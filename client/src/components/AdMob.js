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
    message
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { adMobApi } from '../services/api';
import debounce from 'lodash.debounce';

const { Option } = Select;

const AdMob = () => {
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

            if (response?.success && response?.data) {
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
            message.error('Failed to fetch ads');
        } finally {
            setLoading(false);
        }
    };

    // Initialize data
    useEffect(() => {
        fetchData();
    }, [searchText, selectedType, selectedStatus]);

    // Handle form submission
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
            form.resetFields();
            setEditingAd(null);
            fetchData();
        } catch (error) {
            console.error('Error saving ad:', error);
            if (error.response?.data?.details) {
                const details = error.response.data.details;
                const errorMessages = Object.entries(details)
                    .filter(([_, msg]) => msg)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join('\n');
                message.error(errorMessages || 'Failed to save ad');
            } else {
                message.error('Failed to save ad');
            }
        }
    };

    // Handle ad deletion
    const handleDelete = async (id) => {
        try {
            await adMobApi.delete(id);
            message.success('Ad deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Error deleting ad:', error);
            message.error('Failed to delete ad');
        }
    };

    // Handle status toggle
    const handleStatusToggle = async (id, checked) => {
        try {
            await adMobApi.toggleStatus(id);
            message.success('Status updated successfully');
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            message.error('Failed to update status');
        }
    };

    // Table columns
    const columns = [
        {
            title: 'Ad Name',
            dataIndex: 'adName',
            key: 'adName',
            sorter: (a, b) => a.adName.localeCompare(b.adName)
        },
        {
            title: 'Ad Unit ID',
            dataIndex: 'adUnitId',
            key: 'adUnitId'
        },
        {
            title: 'Ad Type',
            dataIndex: 'adType',
            key: 'adType',
            filters: [
                { text: 'Banner', value: 'Banner' },
                { text: 'Interstitial', value: 'Interstitial' },
                { text: 'Rewarded', value: 'Rewarded' }
            ],
            onFilter: (value, record) => record.adType === value
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
                            setEditingAd(record);
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
                title="AdMob Ads"
                extra={
                    <Space>
                        <Input
                            placeholder="Search ads..."
                            prefix={<SearchOutlined />}
                            onChange={debounce(
                                (e) => setSearchText(e.target.value),
                                300
                            )}
                        />
                        <Select
                            placeholder="Filter by type"
                            allowClear
                            onChange={setSelectedType}
                            style={{ width: 150 }}
                        >
                            <Option value="Banner">Banner</Option>
                            <Option value="Interstitial">Interstitial</Option>
                            <Option value="Rewarded">Rewarded</Option>
                        </Select>
                        <Select
                            placeholder="Filter by status"
                            allowClear
                            onChange={setSelectedStatus}
                            style={{ width: 150 }}
                        >
                            <Option value="true">Active</Option>
                            <Option value="false">Inactive</Option>
                        </Select>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingAd(null);
                                form.resetFields();
                                setModalVisible(true);
                            }}
                        >
                            Add Ad
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data.ads}
                    rowKey="id"
                    loading={loading}
                    pagination={data.pagination}
                    onChange={(pagination) => fetchData(pagination.current)}
                />
            </Card>

            {/* Ad Form Modal */}
            <Modal
                title={editingAd ? 'Edit Ad' : 'Add Ad'}
                visible={modalVisible}
                onOk={form.submit}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                    setEditingAd(null);
                }}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="adName"
                        label="Ad Name"
                        rules={[{ required: true, message: 'Please enter ad name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="adUnitId"
                        label="Ad Unit ID"
                        rules={[{ required: true, message: 'Please enter ad unit ID' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="adType"
                        label="Ad Type"
                        rules={[{ required: true, message: 'Please select ad type' }]}
                    >
                        <Select>
                            <Option value="Banner">Banner</Option>
                            <Option value="Interstitial">Interstitial</Option>
                            <Option value="Rewarded">Rewarded</Option>
                        </Select>
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
        </div>
    );
};

export default AdMob;

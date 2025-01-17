import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Space,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    Switch,
    Spin,
    Alert,
    Row,
    Col,
    Table
} from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    PlusOutlined
} from '@ant-design/icons';
import { adMobApi } from '../services/api';
import { toast } from '../utils/notification';

const { Title } = Typography;
const { Option } = Select;

const adTypes = [
    { value: 'banner', label: 'Banner' },
    { value: 'interstitial', label: 'Interstitial' },
    { value: 'rewarded', label: 'Rewarded' },
    { value: 'native', label: 'Native' }
];

const AdMob = () => {
    const [adUnits, setAdUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingAdUnit, setEditingAdUnit] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchAdUnits();
    }, []);

    const fetchAdUnits = async () => {
        setLoading(true);
        try {
            const response = await adMobApi.getAll();
            setAdUnits(response.adMobs || []);
        } catch (error) {
            toast.error('Failed to fetch ad units');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        try {
            if (editingAdUnit) {
                await adMobApi.update(editingAdUnit._id, values);
                toast.success('Ad unit updated successfully');
            } else {
                await adMobApi.create(values);
                toast.success('Ad unit created successfully');
            }
            setModalVisible(false);
            form.resetFields();
            fetchAdUnits();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save ad unit');
        }
    };

    const handleDelete = async (id) => {
        try {
            await adMobApi.delete(id);
            toast.success('Ad unit deleted successfully');
            fetchAdUnits();
        } catch (error) {
            toast.error('Failed to delete ad unit');
        }
    };

    const showEditModal = (adUnit) => {
        setEditingAdUnit(adUnit);
        form.setFieldsValue(adUnit);
        setModalVisible(true);
    };

    const showCreateModal = () => {
        setEditingAdUnit(null);
        form.resetFields();
        setModalVisible(true);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name'
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => type.charAt(0).toUpperCase() + type.slice(1)
        },
        {
            title: 'Unit ID',
            dataIndex: 'unitId',
            key: 'unitId'
        },
        {
            title: 'Active',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Switch checked={isActive} disabled />
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
                        onClick={() => showEditModal(record)}
                    >
                        Edit
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record._id)}
                    >
                        Delete
                    </Button>
                </Space>
            )
        }
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                <Col>
                    <Title level={2}>AdMob Units</Title>
                </Col>
                <Col>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={showCreateModal}
                    >
                        Add New Ad Unit
                    </Button>
                </Col>
            </Row>

            <Table
                dataSource={adUnits}
                columns={columns}
                rowKey="_id"
                pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`
                }}
            />

            <Modal
                title={editingAdUnit ? 'Edit Ad Unit' : 'Create New Ad Unit'}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Name"
                        rules={[{ required: true, message: 'Please enter name' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Type"
                        rules={[{ required: true, message: 'Please select type' }]}
                    >
                        <Select>
                            {adTypes.map(type => (
                                <Option key={type.value} value={type.value}>
                                    {type.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="unitId"
                        label="Unit ID"
                        rules={[{ required: true, message: 'Please enter unit ID' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="isActive"
                        label="Active"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                {editingAdUnit ? 'Update' : 'Create'}
                            </Button>
                            <Button onClick={() => setModalVisible(false)}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AdMob;

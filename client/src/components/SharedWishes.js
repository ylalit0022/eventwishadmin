import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Table,
    Statistic,
    Input,
    Space,
    Tag,
    Typography,
    Tooltip
} from 'antd';
import {
    EyeOutlined,
    LinkOutlined,
    UserOutlined,
    ClockCircleOutlined,
    SearchOutlined,
    RiseOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { sharedWishesApi } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const { Title, Text } = Typography;

const SharedWishes = () => {
    const [loading, setLoading] = useState(false);
    const [wishes, setWishes] = useState([]);
    const [analytics, setAnalytics] = useState({
        totalWishes: 0,
        totalViews: 0,
        averageViews: 0,
        mostViewed: 0,
        recentViews: 0
    });
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [search, setSearch] = useState('');

    // Fetch shared wishes and analytics
    const fetchData = async (page = 1, pageSize = 10, searchQuery = '') => {
        try {
            setLoading(true);
            const response = await sharedWishesApi.getAll({
                page,
                limit: pageSize,
                search: searchQuery
            });

            if (response?.data?.success) {
                const { wishes, analytics, pagination } = response.data.data;
                setWishes(wishes);
                setAnalytics(analytics);
                setPagination({
                    current: pagination.page,
                    pageSize,
                    total: pagination.total
                });
            }
        } catch (error) {
            console.error('Error fetching shared wishes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Table columns
    const columns = [
        {
            title: 'Short Code',
            dataIndex: 'shortCode',
            key: 'shortCode',
            render: (text) => (
                <Space>
                    <LinkOutlined />
                    <Text copyable>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipientName',
            render: (text) => (
                <Space>
                    <UserOutlined />
                    <span>{text}</span>
                </Space>
            )
        },
        {
            title: 'Sender',
            dataIndex: 'senderName',
            key: 'senderName'
        },
        {
            title: 'Template',
            dataIndex: ['templateId', 'name'],
            key: 'template'
        },
        {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            render: (views) => (
                <Tag color={views > 10 ? 'green' : 'blue'}>
                    <Space>
                        <EyeOutlined />
                        {views}
                    </Space>
                </Tag>
            ),
            sorter: (a, b) => a.views - b.views
        },
        {
            title: 'Last Viewed',
            dataIndex: 'lastViewedAt',
            key: 'lastViewedAt',
            render: (date) => (
                <Tooltip title={date ? formatDate(date, 'YYYY-MM-DD HH:mm:ss') : 'Never'}>
                    <Space>
                        <ClockCircleOutlined />
                        {date ? formatDate(date, 'MMM DD, YYYY') : 'Never'}
                    </Space>
                </Tooltip>
            )
        }
    ];

    // Handle search
    const handleSearch = (value) => {
        setSearch(value);
        fetchData(1, pagination.pageSize, value);
    };

    // Handle table change
    const handleTableChange = (pagination, filters, sorter) => {
        fetchData(pagination.current, pagination.pageSize, search);
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={4}>Shared Wishes Analytics</Title>

            {/* Analytics Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Wishes"
                            value={analytics.totalWishes}
                            prefix={<TeamOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Views"
                            value={analytics.totalViews}
                            prefix={<EyeOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Average Views"
                            value={analytics.averageViews}
                            precision={2}
                            prefix={<RiseOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Recent Views (24h)"
                            value={analytics.recentViews}
                            prefix={<ClockCircleOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Search Bar */}
            <Input.Search
                placeholder="Search by short code, recipient, or sender..."
                allowClear
                enterButton
                size="large"
                onSearch={handleSearch}
                prefix={<SearchOutlined />}
            />

            {/* Wishes Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={wishes}
                    rowKey="_id"
                    pagination={pagination}
                    loading={loading}
                    onChange={handleTableChange}
                />
            </Card>
        </Space>
    );
};

export default SharedWishes;

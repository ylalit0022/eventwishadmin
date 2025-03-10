import React, { useState, useEffect, useCallback } from 'react';
import {
    Row,
    Col,
    Card,
    Button,
    Radio,
    Statistic,
    Spin,
    message,
    Typography,
    theme,
    Input,
    Tooltip
} from 'antd';
import {
    EyeOutlined,
    DownloadOutlined,
    RiseOutlined,
    TrophyOutlined,
    LineChartOutlined,
    SearchOutlined,
    GiftOutlined,
    EyeInvisibleOutlined
} from '@ant-design/icons';
import { sharedWishesApi } from '../services/api';
import debounce from 'lodash.debounce';
import DataTable from './DataTable/DataTable';
import { ResponsiveContainer } from './responsive';

const { Title } = Typography;
const { useToken } = theme;

const SharedWishes = () => {
    const { token } = useToken();
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [data, setData] = useState({
        wishes: [],
        analytics: {
            totalWishes: 0,
            totalViews: 0,
            avgViews: 0,
            topWish: null,
            trend: []
        },
        pagination: {
            current: 1,
            pageSize: 10,
            total: 0
        }
    });
    const [filter, setFilter] = useState('today');
    const [searchText, setSearchText] = useState('');

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((value) => {
            fetchData(1, filter, value);
        }, 500),
        [filter]
    );

    const fetchData = async (page = 1, currentFilter = filter, search = searchText) => {
        try {
            setLoading(true);
            
            // Convert 'today' filter to date format (DD/MM/YYYY)
            let formattedFilter = currentFilter;
            if (currentFilter === 'today') {
                const today = new Date();
                formattedFilter = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
            }

            const response = await sharedWishesApi.getAll({
                page,
                limit: data.pagination.pageSize,
                filter: formattedFilter,
                search
            });

            // Check if response is valid
            if (response?.success && response?.data) {
                const { wishes, analytics, pagination } = response.data;
                setData({
                    wishes: Array.isArray(wishes) ? wishes : [],
                    analytics: {
                        totalWishes: analytics?.totalWishes || 0,
                        totalViews: analytics?.totalViews || 0,
                        avgViews: analytics?.avgViews || 0,
                        topWish: analytics?.topWish || null,
                        trend: Array.isArray(analytics?.trend) ? analytics.trend : []
                    },
                    pagination: {
                        current: page,
                        pageSize: data.pagination.pageSize,
                        total: pagination?.total || 0
                    }
                });
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error fetching wishes:', error);
            message.error(error.response?.data?.message || 'Failed to fetch wishes data');
            setData(prev => ({
                ...prev,
                wishes: [],
                analytics: {
                    totalWishes: 0,
                    totalViews: 0,
                    avgViews: 0,
                    topWish: null,
                    trend: []
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return 'Invalid Date';
        }
        
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 7) {
            return d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const handleTableChange = (pagination, filters, sorter) => {
        fetchData(pagination.current, filter, searchText);
    };

    const handleFilterChange = (e) => {
        const newFilter = e.target.value;
        setFilter(newFilter);
        fetchData(1, newFilter, searchText);
    };

    const handleSearch = (value) => {
        setSearchText(value);
        debouncedSearch(value);
    };

    const handleExport = async () => {
        try {
            setExportLoading(true);
            await sharedWishesApi.exportEnhanced(filter);
            message.success('Export successful');
        } catch (error) {
            console.error('Export error:', error);
            message.error(error.message || 'Failed to export data');
        } finally {
            setExportLoading(false);
        }
    };

    const formatExportDate = (date) => {
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    const columns = [
        {
            title: 'Short Code',
            dataIndex: 'shortCode',
            key: 'shortCode',
            width: 120
        },
        {
            title: 'Preview',
            key: 'preview',
            width: 80,
            align: 'center',
            render: (_, record) => (
                <Tooltip title={record.previewUrl ? 'Click to preview template' : 'No preview available'}>
                    {record.previewUrl ? (
                        <Button
                            type="link"
                            icon={<EyeOutlined />}
                            onClick={() => window.open(record.previewUrl, '_blank')}
                        />
                    ) : (
                        <Button
                            type="link"
                            icon={<EyeInvisibleOutlined />}
                            disabled
                        />
                    )}
                </Tooltip>
            ),
        },
        {
            title: 'Recipient',
            dataIndex: 'recipientName',
            key: 'recipientName',
            ellipsis: true
        },
        {
            title: 'Sender',
            dataIndex: 'senderName',
            key: 'senderName',
            ellipsis: true
        },
        {
            title: 'Views',
            dataIndex: 'views',
            key: 'views',
            width: 100,
            sorter: (a, b) => a.views - b.views,
            render: (views) => (
                <span style={{ color: token.colorPrimary }}>
                    {views}
                </span>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => (
                <span style={{ 
                    color: status === 'active' ? token.colorSuccess : token.colorTextSecondary 
                }}>
                    {status}
                </span>
            )
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 150,
            render: (date) => formatDate(date)
        }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <ResponsiveContainer>
            <Card title="Shared Wishes Analytics" className="wishes-card">
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <Radio.Group 
                        value={filter} 
                        onChange={handleFilterChange}
                        optionType="button"
                        buttonStyle="solid"
                    >
                        <Radio.Button value="today">Today</Radio.Button>
                        <Radio.Button value="week">This Week</Radio.Button>
                        <Radio.Button value="month">This Month</Radio.Button>
                        <Radio.Button value="all">All Time</Radio.Button>
                    </Radio.Group>
                    <Input.Search
                        placeholder="Search wishes..."
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: '200px' }}
                    />
                    <Button 
                        type="primary" 
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        loading={exportLoading}
                    >
                        Export
                    </Button>
                </div>

                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Total Wishes"
                                value={data.analytics.totalWishes}
                                prefix={<RiseOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Total Views"
                                value={data.analytics.totalViews}
                                prefix={<EyeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Average Views"
                                value={data.analytics.avgViews}
                                precision={2}
                                prefix={<LineChartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card>
                            <Statistic
                                title="Top Performing Wish"
                                value={data.analytics.topWish?.views || 0}
                                prefix={<TrophyOutlined />}
                                suffix="views"
                            />
                        </Card>
                    </Col>
                </Row>

                <Card 
                    style={{ 
                        marginBottom: '24px',
                        background: token.colorBgContainer,
                        boxShadow: token.boxShadow,
                        borderRadius: token.borderRadiusLG
                    }}
                >
                    <Title level={4} style={{ marginBottom: '16px' }}>Views Trend</Title>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <div style={{ 
                            height: '200px', 
                            display: 'flex', 
                            alignItems: 'flex-end', 
                            gap: '4px',
                            padding: '16px 0'
                        }}>
                            {data.analytics.trend.map((item) => {
                                const maxViews = Math.max(...data.analytics.trend.map(d => d.views));
                                const percentage = (item.views / maxViews) * 100;
                                return (
                                    <div 
                                        key={item._id} 
                                        style={{ 
                                            flex: 1, 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center',
                                            minWidth: 0
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${percentage}%`,
                                                background: `linear-gradient(180deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                                                borderRadius: '4px 4px 0 0',
                                                minHeight: '1px',
                                                transition: 'height 0.3s ease'
                                            }}
                                        />
                                        <div style={{ 
                                            fontSize: '10px', 
                                            marginTop: '4px', 
                                            transform: 'rotate(-45deg)',
                                            color: token.colorTextSecondary,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '24px'
                                        }}>
                                            {item._id.split('-')[2]}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                <DataTable 
                    columns={columns}
                    data={data.wishes}
                    loading={loading}
                    pagination={data.pagination}
                    onChange={handleTableChange}
                    cardView={true}
                />
            </Card>
        </ResponsiveContainer>
    );
};

export default SharedWishes;

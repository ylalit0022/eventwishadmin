import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Spin, message, Tag } from 'antd';
import {
    FileOutlined,
    ShareAltOutlined,
    GiftOutlined,
    DollarOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { dashboardApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

const { Title, Text } = Typography;

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        totalFiles: 0,
        totalSharedFiles: 0,
        totalSharedWishes: 0,
        totalAdMob: 0,
        recentActivity: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await dashboardApi.getSummary();
                if (response.success) {
                    setDashboardData(response.data);
                } else {
                    message.error('Failed to fetch dashboard data');
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                message.error('Error fetching dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getActivityIcon = (type) => {
        switch (type) {
            case 'wish':
                return <GiftOutlined />;
            case 'file':
                return <FileOutlined />;
            default:
                return <ClockCircleOutlined />;
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <Title level={2}>Dashboard</Title>
            
            {/* Statistics Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Files"
                            value={dashboardData.totalFiles}
                            prefix={<FileOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Shared Files"
                            value={dashboardData.totalSharedFiles}
                            prefix={<ShareAltOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Shared Wishes"
                            value={dashboardData.totalSharedWishes}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Active AdMob"
                            value={dashboardData.totalAdMob}
                            prefix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Recent Activity */}
            <Card title="Recent Activity" style={{ marginTop: '24px' }}>
                <List
                    dataSource={dashboardData.recentActivity}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={getActivityIcon(item.type)}
                                title={item.title}
                                description={
                                    <div>
                                        <Text type="secondary">{item.description}</Text>
                                        <br />
                                        <Text type="secondary">
                                            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                        </Text>
                                    </div>
                                }
                            />
                            {item.status && (
                                <Tag color={
                                    item.status === 'pending' ? 'orange' :
                                    item.status === 'sent' ? 'blue' :
                                    item.status === 'viewed' ? 'green' :
                                    'red'
                                }>
                                    {item.status}
                                </Tag>
                            )}
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default Dashboard;

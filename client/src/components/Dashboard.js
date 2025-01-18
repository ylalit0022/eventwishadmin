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
import { useResponsive } from '../hooks/useResponsive';
import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard = () => {
    const { isMobile } = useResponsive();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        counts: {
            files: 0,
            sharedFiles: 0,
            wishes: 0,
            adMob: 0
        },
        recentActivity: []
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await dashboardApi.getSummary();
                if (response?.data) {
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

    const getActivityColor = (type) => {
        switch (type) {
            case 'wish':
                return 'green';
            case 'file':
                return 'blue';
            default:
                return 'default';
        }
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Title level={isMobile ? 3 : 2} className="dashboard-title">Dashboard Overview</Title>
            
            {/* Statistics Cards */}
            <Row gutter={[16, 16]} className="stat-cards">
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="Total Files"
                            value={dashboardData.counts.files}
                            prefix={<FileOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="Shared Files"
                            value={dashboardData.counts.sharedFiles}
                            prefix={<ShareAltOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="Shared Wishes"
                            value={dashboardData.counts.wishes}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="stat-card">
                        <Statistic
                            title="AdMob Revenue"
                            value={dashboardData.counts.adMob}
                            prefix={<DollarOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Recent Activity */}
            <Card title="Recent Activity" className="activity-card">
                <List
                    dataSource={dashboardData.recentActivity || []}
                    renderItem={item => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={getActivityIcon(item.type)}
                                title={
                                    <span>
                                        {item.title}
                                        <Tag color={getActivityColor(item.type)} style={{ marginLeft: 8 }}>
                                            {item.type}
                                        </Tag>
                                    </span>
                                }
                                description={
                                    <Text type="secondary">
                                        {item.description} • {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                                    </Text>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default Dashboard;

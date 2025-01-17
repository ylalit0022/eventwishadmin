import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Space, Typography } from 'antd';
import {
    FileOutlined,
    EyeOutlined,
    MobileOutlined,
    GiftOutlined,
    RiseOutlined
} from '@ant-design/icons';
import { dashboardApi, sharedWishesApi, adMobApi } from '../services/api';

const { Title } = Typography;

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        templates: 0,
        totalViews: 0,
        activeAds: 0,
        sharedWishes: 0,
        recentViews: 0
    });

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardStats, wishesAnalytics] = await Promise.all([
                dashboardApi.getSummary(),
                sharedWishesApi.getAnalytics()
            ]);

            if (dashboardStats?.data?.success && wishesAnalytics?.data?.success) {
                const dashboard = dashboardStats.data.data;
                const wishes = wishesAnalytics.data.data;

                setStats({
                    templates: dashboard.templateCount || 0,
                    totalViews: wishes.total.views || 0,
                    activeAds: dashboard.activeAdCount || 0,
                    sharedWishes: wishes.total.wishes || 0,
                    recentViews: wishes.views.daily || 0
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={4}>Dashboard Overview</Title>

            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Templates"
                            value={stats.templates}
                            prefix={<FileOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Total Views"
                            value={stats.totalViews}
                            prefix={<EyeOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Active Ads"
                            value={stats.activeAds}
                            prefix={<MobileOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Shared Wishes"
                            value={stats.sharedWishes}
                            prefix={<GiftOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card loading={loading}>
                        <Statistic
                            title="Recent Views (24h)"
                            value={stats.recentViews}
                            prefix={<RiseOutlined />}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    );
};

export default Dashboard;

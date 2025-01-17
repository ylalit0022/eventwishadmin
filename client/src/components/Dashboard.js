import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Statistic } from 'antd';
import { PieChartOutlined, FileOutlined } from '@ant-design/icons';
import { dashboardApi } from '../services/api';
import { toast } from '../utils/notification';

const { Title } = Typography;

function Dashboard() {
    const [stats, setStats] = useState({
        totalTemplates: 0,
        templatesByCategory: [],
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [statsData, activityData] = await Promise.all([
                dashboardApi.getStats(),
                dashboardApi.getActivity()
            ]);

            setStats({
                ...statsData,
                recentActivity: activityData
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                style={{ margin: '24px' }}
            />
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Dashboard</Title>
            
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Card>
                        <Statistic
                            title="Total Templates"
                            value={stats.totalTemplates}
                            prefix={<FileOutlined />}
                        />
                    </Card>
                </Col>

                {stats.templatesByCategory.map((category) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={category._id}>
                        <Card>
                            <Statistic
                                title={`${category._id} Templates`}
                                value={category.count}
                                prefix={<PieChartOutlined />}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {stats.recentActivity.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <Title level={3}>Recent Activity</Title>
                    <Row gutter={[16, 16]}>
                        {stats.recentActivity.map((activity, index) => (
                            <Col xs={24} key={index}>
                                <Card size="small">
                                    <p>{activity.description}</p>
                                    <small>{new Date(activity.timestamp).toLocaleString()}</small>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}
        </div>
    );
}

export default Dashboard;

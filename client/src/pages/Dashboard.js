import React from 'react';
import { Box, Grid, Paper, Typography, Card, CardContent } from '@mui/material';
import {
    BarChart as BarChartIcon,
    People as PeopleIcon,
    Image as ImageIcon,
    MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon: Icon }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Grid container spacing={3} alignItems="center">
                <Grid item>
                    <Icon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Grid>
                <Grid item>
                    <Typography color="textSecondary" gutterBottom variant="overline">
                        {title}
                    </Typography>
                    <Typography color="textPrimary" variant="h4">
                        {value}
                    </Typography>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="TOTAL TEMPLATES"
                        value="25"
                        icon={BarChartIcon}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="ACTIVE USERS"
                        value="1.2k"
                        icon={PeopleIcon}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="SHARED FILES"
                        value="45"
                        icon={ImageIcon}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="AD REVENUE"
                        value="$2.4k"
                        icon={MonetizationOnIcon}
                    />
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Activity
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            No recent activity to display.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;

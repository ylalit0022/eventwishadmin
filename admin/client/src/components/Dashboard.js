import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress
} from '@mui/material';
import {
  Description as TemplateIcon,
  People as UserIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTemplates: 0,
    activeTemplates: 0,
    totalUsers: 0,
    recentViews: 0
  });
  const [recentTemplates, setRecentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Fetch dashboard statistics
        const statsRes = await axios.get('/api/templates/stats', config);
        setStats(statsRes.data);

        // Fetch recent templates
        const templatesRes = await axios.get('/api/templates/recent', config);
        setRecentTemplates(templatesRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: '50%',
              p: 1,
              mr: 2
            }}
          >
            <Icon sx={{ color }} />
          </Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Templates"
            value={stats.totalTemplates}
            icon={TemplateIcon}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Templates"
            value={stats.activeTemplates}
            icon={ViewIcon}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={UserIcon}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Recent Views"
            value={stats.recentViews}
            icon={ShareIcon}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <CardHeader
              title="Recent Templates"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <List>
              {recentTemplates.map((template) => (
                <ListItem key={template._id}>
                  <ListItemText
                    primary={template.title}
                    secondary={`Category: ${template.category}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end">
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <CardHeader
              title="Activity Log"
              action={
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              }
            />
            <List>
              {/* Activity log items would go here */}
              <ListItem>
                <ListItemText
                  primary="New template created"
                  secondary="2 hours ago"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="User settings updated"
                  secondary="5 hours ago"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

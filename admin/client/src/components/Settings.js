import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: null
  });
  const [systemSettings, setSystemSettings] = useState({
    emailNotifications: true,
    darkMode: false,
    autoSave: true,
    showTutorials: true
  });

  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name,
        email: user.email
      }));
    }
    fetchSystemSettings();
  }, [user]);

  const fetchSystemSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get('/api/settings', config);
      setSystemSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleToggleChange = async (event) => {
    const { name, checked } = event.target;
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      await axios.patch('/api/settings', { [name]: checked }, config);
      setSystemSettings((prev) => ({
        ...prev,
        [name]: checked
      }));
      toast.success('Setting updated successfully');
    } catch (error) {
      toast.error('Error updating setting');
    }
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileData((prev) => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      if (profileData.currentPassword) {
        formData.append('currentPassword', profileData.currentPassword);
        formData.append('newPassword', profileData.newPassword);
      }
      if (profileData.avatar) {
        formData.append('avatar', profileData.avatar);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      const response = await axios.put('/api/users/profile', formData, config);
      updateUser(response.data);
      toast.success('Profile updated successfully');

      // Clear password fields
      setProfileData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        avatar: null
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordChange = () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      return false;
    }
    if (profileData.newPassword && profileData.newPassword.length < 6) {
      return false;
    }
    return true;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Settings
            </Typography>
            <Box
              component="form"
              onSubmit={handleProfileUpdate}
              sx={{ mt: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={user?.avatar}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="avatar-upload"
                  type="file"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <IconButton
                    color="primary"
                    component="span"
                    aria-label="upload avatar"
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </label>
              </Box>

              <TextField
                fullWidth
                label="Name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleInputChange}
                margin="normal"
                required
              />

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                Change Password
              </Typography>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type="password"
                value={profileData.currentPassword}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={profileData.newPassword}
                onChange={handleInputChange}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={profileData.confirmPassword}
                onChange={handleInputChange}
                margin="normal"
                error={
                  profileData.newPassword &&
                  profileData.newPassword !== profileData.confirmPassword
                }
                helperText={
                  profileData.newPassword &&
                  profileData.newPassword !== profileData.confirmPassword
                    ? 'Passwords do not match'
                    : ''
                }
              />

              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={
                  loading ||
                  (profileData.newPassword && !validatePasswordChange())
                }
                sx={{ mt: 3 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Settings
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.emailNotifications}
                    onChange={handleToggleChange}
                    name="emailNotifications"
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Receive email notifications about important updates
              </Typography>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.darkMode}
                    onChange={handleToggleChange}
                    name="darkMode"
                  />
                }
                label="Dark Mode"
              />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Toggle dark mode theme
              </Typography>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.autoSave}
                    onChange={handleToggleChange}
                    name="autoSave"
                  />
                }
                label="Auto Save"
              />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Automatically save changes while editing
              </Typography>

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={systemSettings.showTutorials}
                    onChange={handleToggleChange}
                    name="showTutorials"
                  />
                }
                label="Show Tutorials"
              />
              <Typography variant="body2" color="textSecondary" sx={{ ml: 4 }}>
                Display tutorial tooltips for new features
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;

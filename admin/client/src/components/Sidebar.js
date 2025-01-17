import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as TemplatesIcon,
  FolderShared as SharedFilesIcon,
  InsertChart as InsightsIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const Sidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Templates', icon: <TemplatesIcon />, path: '/templates' },
    { text: 'Shared Files', icon: <SharedFilesIcon />, path: '/shared-files' },
    { text: 'Insights', icon: <InsightsIcon />, path: '/insights' },
    { text: 'Users', icon: <UsersIcon />, path: '/users' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : theme.spacing(7),
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : theme.spacing(7),
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
          {open && (
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              EventWishes
            </Typography>
          )}
          <IconButton onClick={handleDrawerToggle}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider />
        <Box sx={{ p: 2 }}>
          <ListItem
            button
            onClick={handleProfileMenuOpen}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : 'auto',
                justifyContent: 'center',
              }}
            >
              {user?.avatar ? (
                <Avatar src={user.avatar} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircleIcon />
              )}
            </ListItemIcon>
            {open && (
              <ListItemText
                primary={user?.name || 'User'}
                secondary={user?.email}
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ noWrap: true }}
              />
            )}
          </ListItem>
        </Box>
      </Drawer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Sidebar;

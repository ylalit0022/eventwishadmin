import React from 'react';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title = 'Event Wishes Admin' }) => {
    const theme = useTheme();
    const navigate = useNavigate();

    return (
        <AppBar 
            position="fixed" 
            sx={{ 
                zIndex: theme.zIndex.drawer + 1,
                backgroundColor: theme.palette.primary.main
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    sx={{ mr: 2 }}
                >
                    <MenuIcon />
                </IconButton>

                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton color="inherit" onClick={() => navigate('/notifications')}>
                        <NotificationsIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={() => navigate('/settings')}>
                        <SettingsIcon />
                    </IconButton>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;

import React, { useState } from 'react';
import {
    Box,
    Button,
    Grid,
    Typography,
    Card,
    CardContent,
    CardActions,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Switch,
    FormControlLabel
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const adTypes = [
    { value: 'banner', label: 'Banner' },
    { value: 'interstitial', label: 'Interstitial' },
    { value: 'rewarded', label: 'Rewarded' },
    { value: 'native', label: 'Native' }
];

const AdMob = () => {
    const [adUnits, setAdUnits] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentAdUnit, setCurrentAdUnit] = useState({
        adUnitName: '',
        adUnitCode: '',
        adType: 'banner',
        description: '',
        isActive: true
    });

    const handleOpen = (adUnit = null) => {
        if (adUnit) {
            setCurrentAdUnit(adUnit);
        } else {
            setCurrentAdUnit({
                adUnitName: '',
                adUnitCode: '',
                adType: 'banner',
                description: '',
                isActive: true
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setCurrentAdUnit({
            ...currentAdUnit,
            [e.target.name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // API call would go here
            toast.success('AdMob unit saved successfully!');
            handleClose();
        } catch (error) {
            toast.error('Failed to save AdMob unit');
        }
    };

    const handleDelete = async (id) => {
        try {
            // API call would go here
            toast.success('AdMob unit deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete AdMob unit');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">AdMob Units</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Add AdMob Unit
                </Button>
            </Box>

            <Grid container spacing={3}>
                {adUnits.map((adUnit) => (
                    <Grid item xs={12} sm={6} md={4} key={adUnit._id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {adUnit.adUnitName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Type: {adUnit.adType}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Code: {adUnit.adUnitCode}
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={adUnit.isActive}
                                            color="primary"
                                            disabled
                                        />
                                    }
                                    label="Active"
                                />
                            </CardContent>
                            <CardActions>
                                <IconButton onClick={() => handleOpen(adUnit)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDelete(adUnit._id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {currentAdUnit._id ? 'Edit AdMob Unit' : 'Add AdMob Unit'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="adUnitName"
                            label="Ad Unit Name"
                            name="adUnitName"
                            value={currentAdUnit.adUnitName}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="adUnitCode"
                            label="Ad Unit Code"
                            name="adUnitCode"
                            value={currentAdUnit.adUnitCode}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            select
                            id="adType"
                            label="Ad Type"
                            name="adType"
                            value={currentAdUnit.adType}
                            onChange={handleChange}
                        >
                            {adTypes.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            margin="normal"
                            fullWidth
                            multiline
                            rows={4}
                            id="description"
                            label="Description"
                            name="description"
                            value={currentAdUnit.description}
                            onChange={handleChange}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentAdUnit.isActive}
                                    onChange={handleChange}
                                    name="isActive"
                                    color="primary"
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdMob;

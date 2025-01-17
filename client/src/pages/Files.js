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
    LinearProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Upload as UploadIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const Files = () => {
    const [files, setFiles] = useState([]);
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentFile, setCurrentFile] = useState({
        description: '',
        file: null
    });

    const handleOpen = (file = null) => {
        if (file) {
            setCurrentFile({
                ...file,
                file: null
            });
        } else {
            setCurrentFile({
                description: '',
                file: null
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setUploading(false);
    };

    const handleChange = (e) => {
        if (e.target.type === 'file') {
            setCurrentFile({
                ...currentFile,
                file: e.target.files[0]
            });
        } else {
            setCurrentFile({
                ...currentFile,
                [e.target.name]: e.target.value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUploading(true);
            // API call would go here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
            toast.success('File uploaded successfully!');
            handleClose();
        } catch (error) {
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            // API call would go here
            toast.success('File deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete file');
        }
    };

    const handleDownload = async (file) => {
        try {
            // API call would go here
            toast.success('File downloaded successfully!');
        } catch (error) {
            toast.error('Failed to download file');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Shared Files</Typography>
                <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => handleOpen()}
                >
                    Upload File
                </Button>
            </Box>

            <Grid container spacing={3}>
                {files.map((file) => (
                    <Grid item xs={12} sm={6} md={4} key={file._id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {file.originalname}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Size: {(file.size / 1024).toFixed(2)} KB
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {file.description}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <IconButton onClick={() => handleOpen(file)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDownload(file)}>
                                    <DownloadIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDelete(file._id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {currentFile._id ? 'Edit File Details' : 'Upload File'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        {!currentFile._id && (
                            <Button
                                variant="outlined"
                                component="label"
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                Choose File
                                <input
                                    type="file"
                                    hidden
                                    onChange={handleChange}
                                />
                            </Button>
                        )}
                        {currentFile.file && (
                            <Typography variant="body2" gutterBottom>
                                Selected: {currentFile.file.name}
                            </Typography>
                        )}
                        <TextField
                            margin="normal"
                            fullWidth
                            multiline
                            rows={4}
                            id="description"
                            label="Description"
                            name="description"
                            value={currentFile.description}
                            onChange={handleChange}
                        />
                        {uploading && (
                            <Box sx={{ width: '100%', mt: 2 }}>
                                <LinearProgress />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={uploading || (!currentFile._id && !currentFile.file)}
                    >
                        {currentFile._id ? 'Save' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Files;

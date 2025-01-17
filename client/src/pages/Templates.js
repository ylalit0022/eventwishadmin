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
    TextField
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const Templates = () => {
    const [templates, setTemplates] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState({
        title: '',
        content: '',
        category: '',
        tags: ''
    });

    const handleOpen = (template = null) => {
        if (template) {
            setCurrentTemplate(template);
        } else {
            setCurrentTemplate({
                title: '',
                content: '',
                category: '',
                tags: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (e) => {
        setCurrentTemplate({
            ...currentTemplate,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // API call would go here
            toast.success('Template saved successfully!');
            handleClose();
        } catch (error) {
            toast.error('Failed to save template');
        }
    };

    const handleDelete = async (id) => {
        try {
            // API call would go here
            toast.success('Template deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Templates</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Add Template
                </Button>
            </Box>

            <Grid container spacing={3}>
                {templates.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template._id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {template.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Category: {template.category}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <IconButton onClick={() => handleOpen(template)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton onClick={() => handleDelete(template._id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {currentTemplate._id ? 'Edit Template' : 'Add Template'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" noValidate sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="title"
                            label="Title"
                            name="title"
                            value={currentTemplate.title}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            multiline
                            rows={4}
                            id="content"
                            label="Content"
                            name="content"
                            value={currentTemplate.content}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="category"
                            label="Category"
                            name="category"
                            value={currentTemplate.category}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="tags"
                            label="Tags (comma separated)"
                            name="tags"
                            value={currentTemplate.tags}
                            onChange={handleChange}
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

export default Templates;

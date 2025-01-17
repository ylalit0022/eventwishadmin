import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    htmlContent: '',
    cssContent: '',
    jsContent: '',
    isActive: true
  });

  const categories = [
    'Birthday',
    'Wedding',
    'Anniversary',
    'Holiday',
    'Corporate',
    'Other'
  ];

  useEffect(() => {
    fetchTemplates();
  }, [page, rowsPerPage, searchQuery]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get(
        `/api/templates?page=${page + 1}&limit=${rowsPerPage}&search=${searchQuery}`,
        config
      );
      setTemplates(response.data.templates || []);
      setTotalCount(response.data.totalTemplates || 0);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Error fetching templates');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData({
        title: template.title,
        category: template.category,
        htmlContent: template.htmlContent || '',
        cssContent: template.cssContent || '',
        jsContent: template.jsContent || '',
        isActive: template.isActive
      });
    } else {
      setSelectedTemplate(null);
      setFormData({
        title: '',
        category: '',
        htmlContent: '',
        cssContent: '',
        jsContent: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTemplate(null);
    setFormData({
      title: '',
      category: '',
      htmlContent: '',
      cssContent: '',
      jsContent: '',
      isActive: true
    });
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (selectedTemplate) {
        await axios.put(
          `/api/templates/${selectedTemplate._id}`,
          formData,
          config
        );
        toast.success('Template updated successfully');
      } else {
        await axios.post('/api/templates', formData, config);
        toast.success('Template created successfully');
      }

      handleCloseDialog();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(error.response?.data?.message || 'Error saving template');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        await axios.delete(`/api/templates/${id}`, config);
        toast.success('Template deleted successfully');
        fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Error deleting template');
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Templates</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Template
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template._id}>
                  <TableCell>{template.title}</TableCell>
                  <TableCell>{template.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={template.isActive ? 'Active' : 'Inactive'}
                      color={template.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenDialog(template)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(template._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                    <IconButton color="info">
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No templates found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              margin="normal"
              required
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="HTML Content"
              name="htmlContent"
              value={formData.htmlContent}
              onChange={handleInputChange}
              margin="normal"
              required
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="CSS Content"
              name="cssContent"
              value={formData.cssContent}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="JavaScript Content"
              name="jsContent"
              value={formData.jsContent}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Templates;

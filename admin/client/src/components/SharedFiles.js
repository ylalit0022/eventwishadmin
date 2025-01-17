import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
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
  CircularProgress,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const SharedFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    fileType: '',
    isPublic: false
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fileTypes = ['image', 'document', 'video', 'other'];

  useEffect(() => {
    fetchFiles();
  }, [searchQuery]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get(
        `/api/shared-files?search=${searchQuery}`,
        config
      );
      setFiles(response.data);
    } catch (error) {
      toast.error('Error fetching files');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setUploadData({
      title: '',
      fileType: '',
      isPublic: false
    });
    setSelectedFile(null);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setUploadData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadData.title);
      formData.append('fileType', uploadData.fileType);
      formData.append('isPublic', uploadData.isPublic);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      await axios.post('/api/shared-files', formData, config);
      toast.success('File uploaded successfully');
      handleCloseDialog();
      fetchFiles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error uploading file');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        await axios.delete(`/api/shared-files/${id}`, config);
        toast.success('File deleted successfully');
        fetchFiles();
      } catch (error) {
        toast.error('Error deleting file');
      }
    }
  };

  const handleShare = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.post(`/api/shared-files/${id}/share`, {}, config);
      toast.success('Share link copied to clipboard');
      navigator.clipboard.writeText(response.data.shareLink);
    } catch (error) {
      toast.error('Error generating share link');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Shared Files</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleOpenDialog}
        >
          Upload File
        </Button>
      </Box>

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Paper>

      <Grid container spacing={3}>
        {files.map((file) => (
          <Grid item xs={12} sm={6} md={4} key={file._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" noWrap>
                  {file.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {file.fileType}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={formatFileSize(file.size)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={file.isPublic ? 'Public' : 'Private'}
                    color={file.isPublic ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleShare(file._id)}>
                  <ShareIcon />
                </IconButton>
                <IconButton href={file.fileUrl} download>
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

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Upload File</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={uploadData.title}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              select
              label="File Type"
              name="fileType"
              value={uploadData.fileType}
              onChange={handleInputChange}
              margin="normal"
              required
            >
              {fileTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ mt: 2 }}>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  Select File
                </Button>
              </label>
              {selectedFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {selectedFile.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SharedFiles;

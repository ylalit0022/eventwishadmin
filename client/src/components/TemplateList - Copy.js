import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  TextField,
  Box,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Switch,
  Checkbox,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

function TemplateList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    active: 0,
    inactive: 0,
    categories: []
  });
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [bulkActionMenuAnchor, setBulkActionMenuAnchor] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      console.log('Fetching templates with params:', {
        page: page + 1,
        limit: rowsPerPage,
        search,
        statusFilter,
        startDate,
        endDate,
        sortField,
        sortOrder
      });

      const statusQuery = statusFilter !== 'all' ? `&isActive=${statusFilter === 'active'}` : '';
      const dateQuery = startDate && endDate 
        ? `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        : '';
      
      const response = await axios.get(
        `http://localhost:5000/api/templates?page=${page + 1}&limit=${rowsPerPage}&search=${search}${statusQuery}${dateQuery}&sort=${sortField}&order=${sortOrder}`
      );
      
      console.log('Fetch response:', response.data);
      
      setTemplates(response.data.templates);
      setTotalCount(response.data.totalTemplates);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching templates:', error.response || error);
      toast.error('Error fetching templates');
    }
  }, [page, rowsPerPage, search, statusFilter, startDate, endDate, sortField, sortOrder]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedTemplates(templates.map(t => t._id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else {
        return [...prev, templateId];
      }
    });
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      await axios.patch('http://localhost:5000/api/templates/bulk-status-update', {
        templateIds: selectedTemplates,
        status
      });
      toast.success('Templates updated successfully');
      setSelectedTemplates([]);
      fetchTemplates();
    } catch (error) {
      toast.error('Error updating templates');
    }
    setBulkActionMenuAnchor(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await axios.delete(`http://localhost:5000/api/templates/${id}`);
        toast.success('Template deleted successfully');
        fetchTemplates();
      } catch (error) {
        toast.error('Error deleting template');
      }
    }
  };

  const handleStatusToggle = async (templateId, currentStatus) => {
    try {
      console.log('Toggling status for template:', templateId);
      
      const response = await axios.patch(`http://localhost:5000/api/templates/${templateId}/toggle-status`);
      
      console.log('Toggle response:', response.data);
      
      if (response.data && response.data._id) {
        await fetchTemplates(); // Refresh the list
        toast.success(`Template ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      } else {
        console.error('Invalid response:', response);
        toast.error('Failed to update template status');
      }
    } catch (error) {
      console.error('Status toggle error:', error.response || error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error updating template status';
      toast.error(errorMessage);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setSortMenuAnchor(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Statistics Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Template Statistics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Active: ${stats?.active || 0}`}
            color="success"
            variant={statusFilter === 'active' ? 'filled' : 'outlined'}
          />
          <Chip 
            label={`Inactive: ${stats?.inactive || 0}`}
            color="default"
            variant={statusFilter === 'inactive' ? 'filled' : 'outlined'}
          />
          {stats?.categories?.map(cat => (
            <Chip
              key={cat._id || 'unknown'}
              label={`${cat._id || 'Unknown'}: ${cat.count || 0}`}
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {/* Actions Bar */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search templates"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setStatusFilter(newValue);
              setPage(0);
            }
          }}
          aria-label="status filter"
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="inactive">Inactive</ToggleButton>
        </ToggleButtonGroup>

        <Button
          startIcon={<FilterIcon />}
          onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
          variant="outlined"
        >
          Filter
        </Button>

        <Button
          startIcon={<SortIcon />}
          onClick={(e) => setSortMenuAnchor(e.currentTarget)}
          variant="outlined"
        >
          Sort
        </Button>

        {selectedTemplates.length > 0 && (
          <Button
            variant="contained"
            onClick={(e) => setBulkActionMenuAnchor(e.currentTarget)}
          >
            Bulk Actions ({selectedTemplates.length})
          </Button>
        )}
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          setFilterDialogOpen(true);
          setFilterMenuAnchor(null);
        }}>
          Date Range
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => setSortMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleSort('title')}>
          Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
        </MenuItem>
        <MenuItem onClick={() => handleSort('category')}>
          Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
        </MenuItem>
        <MenuItem onClick={() => handleSort('createdAt')}>
          Created At {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
        </MenuItem>
      </Menu>

      {/* Bulk Actions Menu */}
      <Menu
        anchorEl={bulkActionMenuAnchor}
        open={Boolean(bulkActionMenuAnchor)}
        onClose={() => setBulkActionMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleBulkStatusUpdate(true)}>
          Set Active
        </MenuItem>
        <MenuItem onClick={() => handleBulkStatusUpdate(false)}>
          Set Inactive
        </MenuItem>
      </Menu>

      {/* Date Range Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)}>
        <DialogTitle>Filter by Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined'
                  }
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                minDate={startDate}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined'
                  }
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setStartDate(null);
            setEndDate(null);
            setFilterDialogOpen(false);
          }}>
            Clear
          </Button>
          <Button onClick={() => setFilterDialogOpen(false)} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Templates Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selectedTemplates.length === templates.length}
                  indeterminate={selectedTemplates.length > 0 && selectedTemplates.length < templates.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow 
                key={template._id}
                selected={selectedTemplates.includes(template._id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedTemplates.includes(template._id)}
                    onChange={() => handleSelectTemplate(template._id)}
                  />
                </TableCell>
                <TableCell>{template.title}</TableCell>
                <TableCell>{template.category}</TableCell>
                <TableCell>
                  <Switch
                    checked={template.isActive}
                    onChange={() => handleStatusToggle(template._id, template.isActive)}
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  {new Date(template.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => navigate(`/templates/edit/${template._id}`)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(template._id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Container>
  );
}

export default TemplateList;

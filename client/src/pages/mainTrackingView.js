import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, Button, IconButton, Paper, BottomNavigation, BottomNavigationAction, Popover, TextField, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavSideBar from "../components/NavSideBar";
import FrequencyWithNotes from '../components/DataTrackingMeasures/frequency_with_notes';
import DurationTimers from '../components/DataTrackingMeasures/durationTimers';
import { useQuery } from '@apollo/client';
import { QUERY_USER } from '../utils/queries';
import AddNewDataMeasure from '../components/AddNewDataMeasure/AddNewDataMeasure';
import { DataGrid } from '@mui/x-data-grid';

export default function MainTrackingView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bottomNav, setBottomNav] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAddDataMeasure, setShowAddDataMeasure] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const selectedStudent = location.state?.selectedStudent;

  const { data: studentData, refetch: refetchStudent } = useQuery(QUERY_USER, {
    variables: { identifier: selectedStudent?.username || '', isUsername: true },
    skip: !selectedStudent?.username,
  });

  const assignedMeasures = [
    ...(studentData?.user?.behaviorFrequencies || []).map(f => ({
      id: f._id,
      _id: f._id,
      behaviorTitle: f.behaviorTitle,
      type: 'frequency'
    })),
    ...(studentData?.user?.behaviorDurations || []).map(d => ({
      id: d._id,
      _id: d._id,
      behaviorTitle: d.behaviorTitle,
      type: 'duration'
    }))
  ];

  useEffect(() => {
    if (!selectedStudent) {
      navigate('/selectStudentToTrack');
    }
  }, [selectedStudent, navigate]);

  const handleOpenPopover = (event) => setAnchorEl(event.currentTarget);
  const handleClosePopover = () => setAnchorEl(null);

  const handleSelectMeasure = (measure) => {
    // Optionally: set selected for tracking, scroll, etc.
    handleClosePopover();
  };

  const handleAddNewDataMeasure = () => {
    setShowAddDataMeasure(true);
    handleClosePopover();
  };

  const handleModalClose = async () => {
    setShowAddDataMeasure(false);
    await refetchStudent(); // Refetch student data so dropdown updates
  };

  const filteredMeasures = assignedMeasures.filter(m =>
    m.behaviorTitle.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === 'all' || m.type === typeFilter)
  );

  const columns = [
    { field: 'behaviorTitle', headerName: 'Behavior Title', flex: 1 },
    { field: 'type', headerName: 'Type', width: 120, valueFormatter: ({ value }) => value.charAt(0).toUpperCase() + value.slice(1) }
  ];

  if (!selectedStudent) {
    return (
      <div>
        <NavSideBar />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">No Student Selected</Typography>
          <Button variant="contained" onClick={() => navigate('/selectStudentToTrack')}>
            Select Student
          </Button>
        </Box>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div>
        <NavSideBar />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">Loading...</Typography>
        </Box>
      </div>
    );
  }

  return (
    <Box sx={{ bgcolor: '#faf7fd', minHeight: '100vh', pb: 10 }}>
      <NavSideBar />

      {/* Back Button */}
      <Box sx={{ maxWidth: 700, mx: 'auto', mt: 4, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="text"
          sx={{ mb: 2, color: '#5e35b1', fontWeight: 600, textTransform: 'none' }}
          onClick={() => navigate('/selectStudentToTrack')}
        >
          Back to Student List
        </Button>
      </Box>

      {/* Header */}
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h5" fontWeight={600}>
            Tracking Data for {selectedStudent.firstName}
          </Typography>
        </Stack>

        {/* Add Data Measure Row */}
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Box>
            <Button
              startIcon={<AddIcon />}
              onClick={handleOpenPopover}
              variant="contained"
              sx={{ borderRadius: 999, fontWeight: 600 }}
            >
              Add Data Measure
            </Button>
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClosePopover}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
              <Box sx={{ p: 2, width: 400 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    label="Search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    size="small"
                    fullWidth
                  />
                  <Select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="frequency">Frequency</MenuItem>
                    <MenuItem value="duration">Duration</MenuItem>
                  </Select>
                </Box>
                <DataGrid
                  rows={filteredMeasures}
                  columns={columns}
                  autoHeight
                  pageSize={5}
                  onRowClick={(params) => {
                    handleSelectMeasure(params.row);
                    handleClosePopover();
                  }}
                  hideFooterSelectedRowCount
                />
                <Button
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{ mt: 2 }}
                  onClick={() => {
                    handleAddNewDataMeasure();
                    handleClosePopover();
                  }}
                >
                  Add New Data Measure
                </Button>
              </Box>
            </Popover>
            {showAddDataMeasure && (
              <AddNewDataMeasure
                studentId={selectedStudent._id}
                onClose={handleModalClose}
              />
            )}
          </Box>
          <IconButton>
            <EditIcon sx={{ color: '#222' }} />
          </IconButton>
          <IconButton>
            <DeleteIcon sx={{ color: '#222' }} />
          </IconButton>
        </Stack>

        {/* Frequency Tracking */}
        <Box mb={3}>
          <FrequencyWithNotes
            studentId={selectedStudent._id}
          />
        </Box>

        {/* Duration Tracking */}
        <Box mb={3}>
          <DurationTimers
            studentId={selectedStudent._id}
          />
        </Box>
      </Box>

      {/* Bottom Navigation */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: '#f3eefa',
          borderRadius: '24px 24px 0 0',
          px: 2,
        }}
      >
        <BottomNavigation
          showLabels
          value={bottomNav}
          onChange={(_, newValue) => setBottomNav(newValue)}
          sx={{
            bgcolor: 'transparent',
            borderRadius: '24px 24px 0 0',
            height: 64,
          }}
        >
          <BottomNavigationAction
            label="Accommodations"
            icon={<StarBorderIcon />}
            sx={{
              color: bottomNav === 0 ? '#5e35b1' : '#888',
              bgcolor: bottomNav === 0 ? '#ede7f6' : 'transparent',
              borderRadius: 3,
              minWidth: 120,
            }}
          />
          <BottomNavigationAction
            label="Contracts"
            icon={<StarBorderIcon />}
            sx={{
              color: bottomNav === 1 ? '#5e35b1' : '#888',
              bgcolor: bottomNav === 1 ? '#ede7f6' : 'transparent',
              borderRadius: 3,
              minWidth: 120,
            }}
          />
          <BottomNavigationAction
            label="Breaks"
            icon={<StarBorderIcon />}
            sx={{
              color: bottomNav === 2 ? '#5e35b1' : '#888',
              bgcolor: bottomNav === 2 ? '#ede7f6' : 'transparent',
              borderRadius: 3,
              minWidth: 120,
            }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
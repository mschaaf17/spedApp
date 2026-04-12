import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, Button, IconButton, Paper, BottomNavigation, BottomNavigationAction, Popover, TextField, Select, MenuItem, Switch, Modal
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavSideBar from "../components/NavSideBar";
import MainBottomNavBar from '../components/mainBottomNavBar';
import FrequencyWithNotes from '../components/DataTrackingMeasures/frequency_with_notes';
import DurationTimers from '../components/DataTrackingMeasures/durationTimers';
import { useQuery } from '@apollo/client';
import { QUERY_USER, QUERY_FREQUENCY_TEMPLATES, QUERY_DURATION_TEMPLATES } from '../utils/queries';
import AddNewDataMeasure from '../components/AddNewDataMeasure/AddNewDataMeasure';
import { DataGrid } from '@mui/x-data-grid';
import { ADD_DATA_MEASURE_TO_STUDENT} from '../utils/mutations';
import { useMutation } from '@apollo/client';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import Snackbar from '@mui/material/Snackbar';

export default function MainTrackingView() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bottomNav, setBottomNav] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAddDataMeasure, setShowAddDataMeasure] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLeftHanded, setIsLeftHanded] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState(undefined); // behavior id


  const selectedStudent = location.state?.selectedStudent;

  const { data: studentData, refetch: refetchStudent } = useQuery(QUERY_USER, {
    variables: { identifier: selectedStudent?.username || '', isUsername: true },
    skip: !selectedStudent?.username,
  });

  const { data: freqTemplatesData, loading: freqTemplatesLoading, refetch: refetchFreqTemplates } = useQuery(QUERY_FREQUENCY_TEMPLATES);
  const { data: durTemplatesData, loading: durTemplatesLoading, refetch: refetchDurTemplates } = useQuery(QUERY_DURATION_TEMPLATES);

  const frequencyTemplates = freqTemplatesData?.frequency?.filter(t => t.isTemplate) || [];
  const durationTemplates = durTemplatesData?.duration?.filter(t => t.isTemplate) || [];

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

  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  const [addedIds, setAddedIds] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);


  useEffect(() => {
    if (!selectedStudent) {
      navigate('/selectStudentToTrack');
    }
  }, [selectedStudent, navigate]);

  const handleOpenPopover = (event) => setAnchorEl(event.currentTarget);
  const handleClosePopover = async () => {
    setAnchorEl(null);
    setAddedIds([]); // Reset local added state
    await refetchStudent(); // Refetch to update the list
  };

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

  const handleAddMeasureToStudent = async (row) => {
    await addDataMeasureToStudent({
      variables: { dataMeasureId: row.id, studentId: selectedStudent._id }
    });
    setAddedIds(prev => [...prev, row.id]);
    setSnackbarOpen(true);
    await refetchStudent();
  };

  // 1. Get assigned IDs
  const assignedFrequencyIds = (studentData?.user?.behaviorFrequencies || []).map(f => f.templateId || f._id);
  const assignedDurationIds = (studentData?.user?.behaviorDurations || []).map(d => d.templateId || d._id);

  // 2. Filter available templates
  const availableFrequencyTemplates = frequencyTemplates.filter(
    t => !assignedFrequencyIds.includes(t._id)
  );
  const availableDurationTemplates = durationTemplates.filter(
    t => !assignedDurationIds.includes(t._id)
  );

  // 3. Combine and filter by search/type
  const availableMeasures = [
    ...availableFrequencyTemplates.map(t => ({
      id: t._id,
      behaviorTitle: t.behaviorTitle,
      type: 'frequency'
    })),
    ...availableDurationTemplates.map(t => ({
      id: t._id,
      behaviorTitle: t.behaviorTitle,
      type: 'duration'
    }))
  ].filter(m =>
    m.behaviorTitle.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === 'all' || m.type === typeFilter)
  );

  const columns = [
    { field: 'behaviorTitle', headerName: 'Behavior Title', flex: 1 },
    { field: 'type', headerName: 'Type', width: 120, valueFormatter: ({ value }) => value.charAt(0).toUpperCase() + value.slice(1) },
    {
      field: 'add',
      headerName: 'Add',
      width: 80,
      sortable: false,
      renderCell: (params) => {
        const isAdded = addedIds.includes(params.row.id);
        return (
          <IconButton
            onClick={async (e) => {
              e.stopPropagation();
              if (!isAdded) {
                await handleAddMeasureToStudent(params.row);
              }
            }}
            color={isAdded ? "primary" : "default"}
            disabled={isAdded}
          >
            {isAdded ? <BookmarkIcon /> : <AddIcon />}
          </IconButton>
        );
      }
    }
  ];

  if (!selectedStudent) {
    return (
      <div>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">No Student Selected</Typography>
          <Button variant="contained" onClick={() => navigate('/selectStudentToTrack')}>
            Select Student
          </Button>
        </Box>
      </div>
    );
  }

  if (freqTemplatesLoading || durTemplatesLoading) {
    return <div>Loading...</div>;
  }

  if (!studentData) {
    return (
      <div>
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">Loading...</Typography>
        </Box>
      </div>
    );
  }

  return (
    <Box>
   
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
            Tracking Data for {selectedStudent.username}
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
                  rows={availableMeasures}
                  columns={columns}
                  autoHeight
                  pageSize={5}
                  onRowClick={(params) => {
                    handleSelectMeasure(params.row);
                    handleClosePopover();
                  }}
                  hideFooterSelectedRowCount
                  sx={{
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 'bold',
                      fontSize: '1.05rem',
                    },
                  }}
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
                onAdded={async () => {
                  await refetchStudent();
                }}
              />
            )}
          </Box>
          <Button onClick={() => setShowAddNote(true)}>
           Add Note
          </Button>
          <IconButton>
            <DeleteIcon sx={{ color: '#222' }} />
          </IconButton>
        </Stack>

        {/* Toggle for handedness */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Switch
            checked={isLeftHanded}
            onChange={() => setIsLeftHanded(lh => !lh)}
            color="secondary"
          />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Toggle for left or right handed
          </Typography>
        </Box>

        {/* Frequency Tracking */}
        <Box mb={3}>
          <FrequencyWithNotes
            studentId={selectedStudent._id}
            isLeftHanded={isLeftHanded}
          />
        </Box>

        {/* Duration Tracking */}
        <Box mb={3}>
          <DurationTimers
            studentId={selectedStudent._id}
            isLeftHanded={isLeftHanded}
          />
        </Box>
      </Box>
      <MainBottomNavBar />

      <Modal
        open={showAddNote}
        onClose={() => {
          setShowAddNote(false);
          setNoteContent('');
          setNoteType(undefined);
        }}
      >
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2, minWidth: 350
        }}>
          <Typography variant="h6" mb={2}>Add Note</Typography>
          <Select
            fullWidth
            value={noteType}
            onChange={e => setNoteType(e.target.value)}
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="" disabled>Select Behavior</MenuItem>
            {(studentData?.user?.behaviorFrequencies || []).map(f => (
              <MenuItem key={f._id} value={f._id}>{f.behaviorTitle} (Frequency)</MenuItem>
            ))}
            {(studentData?.user?.behaviorDurations || []).map(d => (
              <MenuItem key={d._id} value={d._id}>{d.behaviorTitle} (Duration)</MenuItem>
            ))}
          </Select>
          <TextField
            label="Note"
            multiline
            rows={4}
            fullWidth
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setShowAddNote(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!noteContent.trim() || !noteType}
              onClick={async () => {
                // TODO: Call your mutation or logic here
                // Example:
                // await addNoteMutation({ variables: { studentId: selectedStudent._id, behaviorId: noteType, content: noteContent } });
                setShowAddNote(false);
                setNoteContent('');
                setNoteType(undefined);
                // Optionally show a success message
              }}
            >
              Add Note
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="Data measure added"
      />
    </Box>
    
  );
}


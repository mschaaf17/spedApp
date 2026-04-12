import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_ME, QUERY_USER, QUERY_FREQUENCY_TEMPLATES } from '../../utils/queries';
import { useParams } from 'react-router-dom';
import { Button, Select, message, Modal, Switch } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import EditIcon from '@mui/icons-material/Edit';
import { ADD_DATA_MEASURE_TO_STUDENT, REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT, INCREMENT_FREQUENCY, UPDATE_FREQUENCY_NOTE } from '../../utils/mutations';
import Auth from '../../utils/auth';
import { Button as MUIButton } from '@mui/material';
import { Box, Typography } from '@mui/material';
import HandednessRow from '../HandednessRow.js';
import { Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const { confirm } = Modal;

const Frequency = ({ studentId: propStudentId, refetchTrigger, isLeftHanded }) => {
  const { username: usernameFromUrl } = useParams();
  
  // Use propStudentId if provided, otherwise get from URL
  const { loading, data } = useQuery(QUERY_USER, {
    variables: { 
      identifier: propStudentId || usernameFromUrl, 
      isUsername: !propStudentId 
    },
    skip: !propStudentId && !usernameFromUrl
  });

  const studentId = propStudentId || data?.user?._id;

  const { loading: meLoading, data: meData } = useQuery(QUERY_ME);
  
  const { loading: frequencyLoading, data: frequencyData, refetch } = useQuery(QUERY_FREQUENCY_LIST, {
    variables: {studentId}
  });

  const { loading: templatesLoading, data: templatesData, refetch: refetchTemplates } = useQuery(QUERY_FREQUENCY_TEMPLATES);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [showRedXIcons, setShowRedXIcons] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedBehaviorTitles, setSelectedBehaviorTitles] = useState([]);
  const [initialMergedData, setInitialMergedData] = useState([]);
  const [showSelect, setShowSelect] = useState(false);
  const [showDeleteIcons, setShowDeleteIcons] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false); 
  const [selectedBehaviorIds, setSelectedBehaviorIds] = useState([]);
  const [showSaveCancel, setShowSaveCancel] = useState(false);
  const [redBackground, setRedBackground] = useState(false);
  const [deleteIconBehaviorId, setDeleteIconBehaviorId] = useState(null);
  const [selectedBehaviorTitleForDelete, setSelectedBehaviorTitleForDelete] = useState('');
  const [behaviorCounts, setBehaviorCounts] = useState({});
  const [noteStates, setNoteStates] = useState({});
  const [addedIds, setAddedIds] = useState([]); // Track which have been added in this session


  const [addDataMeasureToStudent, { loading: addLoading }] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  const [removeDataMeasureFromStudent, { loading: removeLoading }] = useMutation(REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT);
  const [incrementFrequency] = useMutation(INCREMENT_FREQUENCY);
  const [updateFrequencyNote] = useMutation(UPDATE_FREQUENCY_NOTE);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!loading && data) {
      setUser(data.user);
    }
  }, [loading, data]);

  const handleSelectChange = (value) => {
    setSelectedBehaviorTitles(value);
  };

  function getTodayCount(dailyCounts) {
    const today = new Date();
    const todayString = today.toLocaleDateString();
    
    return (dailyCounts || [])
      .filter(dc => {
        if (!dc.date) return false;
        let d;
        if (typeof dc.date === 'number') {
          d = new Date(dc.date);
        } else if (typeof dc.date === 'string') {
          if (/^\d+$/.test(dc.date)) {
            d = new Date(Number(dc.date));
          } else {
            d = new Date(dc.date);
          }
        }
        if (!d || isNaN(d.getTime())) return false;
        const dString = d.toLocaleDateString();
       
        return dString === todayString;
      })
      .reduce((sum, dc) => sum + dc.count, 0);
  }

  const handleClickForAddingDataMeasure = () => {
    setShowSelect(true);
    setShowDeleteIcons(false);
  };

  const handleAddDataMeasure = async (dataMeasureId) => {
    // Call your mutation or add logic here
    await addDataMeasureToStudent({
      variables: { dataMeasureId, studentId: user._id },
    });
    // Optionally refetch or update state
  };

  const toggleRedXIcons = () => {
    setShowRedXIcons(!showRedXIcons);
  };

  const handleDeleteIconClick = () => {
    setShowRedXIcons(true);
    setShowSaveCancel(true); 
    setDeleteMode(!deleteMode);
    setShowDeleteIcons(false);
  };

  const handleSpecificSelectedButtonToDeleteClick = (behaviorId, behaviorTitle) => {
    if (deleteMode) {
      if (selectedBehaviorIds.includes(behaviorId)) {
        setSelectedBehaviorIds(selectedBehaviorIds.filter(id => id !== behaviorId));
        setSelectedBehaviorTitles(selectedBehaviorTitles.filter(title => title !== behaviorTitle));
      } else {
        setSelectedBehaviorIds([...selectedBehaviorIds, behaviorId]);
        setSelectedBehaviorTitles([...selectedBehaviorTitles, behaviorTitle]);
      }
    }
  };

  const handleCancelClickForExitingDeleteMode = () => {
    setDeleteMode(false);
    setShowSaveCancel(false);
    setSelectedBehaviorIds([]);
    setSelectedBehaviorTitles([]);
    setShowRedXIcons(false);
  };

  const handleSaveClickForDeletingFrequency = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      for (const behaviorId of selectedBehaviorIds) {
        await removeDataMeasureFromStudent({ variables: { frequencyId: behaviorId, studentId: user._id } });
      }
      setSelectedBehaviorIds([]);
      setSelectedBehaviorTitles([]);
      setDeleteMode(false);
      setShowSaveCancel(false);
      setShowDeleteConfirmation(false);
      toggleRedXIcons(false);
      showDeleteMessage(selectedBehaviorTitles);
    } catch (error) {
      console.error('Error deleting data measures from student: ', error);
    }
  };

  const showDeleteMessage = (behaviorTitles) => {
    let formatted;
    if (Array.isArray(behaviorTitles)) {
      if (behaviorTitles.length === 1) {
        formatted = behaviorTitles[0];
      } else if (behaviorTitles.length === 2) {
        formatted = behaviorTitles.join(' and ');
      } else {
        formatted = behaviorTitles.slice(0, -1).join(', ') + ', and ' + behaviorTitles[behaviorTitles.length - 1];
      }
    } else {
      formatted = behaviorTitles;
    }
    message.success(`${formatted} was removed from list`);
  };

  const handleIncrementFrequency = async (frequencyId) => {
    try {
      const currentDate = new Date().toISOString();
      await incrementFrequency({
        variables: { frequencyId, studentId: data.user._id, date: currentDate },
      });
      await refetch();
    } catch (error) {
      console.error('Error incrementing frequency:', error);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfile = await Auth.getProfile();
        if (userProfile) {
          setLoggedInUser(userProfile);
        } else {
          setLoggedInUser(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoggedInUser(null);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!loggedInUser || !frequencyData || !user) return;

    const loggedInUserId = loggedInUser.data._id;

    const filteredFrequencyData = frequencyData?.frequency.filter(
      (item) => item.createdBy.some((user) => user._id === loggedInUserId)
    ) || [];

    const mergedData = filteredFrequencyData.filter(
      (frequency) => !user.behaviorFrequencies.some((behavior) => behavior.behaviorTitle === frequency.behaviorTitle)
    );
    setInitialMergedData(mergedData);
  }, [loggedInUser, frequencyData, user]);

  const handleRemove = async (frequencyId) => {
    await removeDataMeasureFromStudent({
      variables: { frequencyId, studentId },
    });
    await refetch();
  };

  useEffect(() => {
    if (refetchTrigger) {
      refetch();
      refetchTemplates();
    }
  }, [refetchTrigger, refetch, refetchTemplates]);

  if (loading || frequencyLoading || !user) {
    return <div>Loading...</div>;
  }

  const assignedIds = user.behaviorFrequencies
    .filter(b => !b.isTemplate)
    .map(b => b.templateId || b._id);

  const availableTemplates = templatesData?.frequency?.filter(
    template => template.isTemplate && !assignedIds.includes(template._id)
  );

  const activeFrequencies = (frequencyData?.frequency || []).filter(b => b.isActive && !b.isTemplate);

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
                // Call your add logic here
                await handleAddDataMeasure(params.row.id);
                setAddedIds(prev => [...prev, params.row.id]);
              }
            }}
            color={isAdded ? "primary" : "default"}
          >
            {isAdded ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        );
      }
    }
  ];


  return (
    <>
      <div className='centerBody'>
        <div>
          {user.behaviorFrequencies.length === 0 ? (
            <>
              <div className='thirdHeading'>No behavior frequencies found for this user.</div>
              <div className='dataContainer'>
                <Button onClick={handleClickForAddingDataMeasure}>Add Data Measure For Student</Button>
                {showSelect && (
                  <div style={{ width: 500, background: "#fff", borderRadius: 12, padding: 16, margin: "0 auto" }}>
                    {templatesLoading ? (
                      <div>Loading templates...</div>
                    ) : (
                      <DataGrid
                        rows={availableTemplates?.map(t => ({
                          id: t._id,
                          behaviorTitle: t.behaviorTitle,
                          type: t.type,
                        })) || []}
                        columns={columns}
                        autoHeight
                        pageSize={5}
                        disableSelectionOnClick
                        hideFooterSelectedRowCount
                      />
                    )}
                    <div style={{ marginTop: 12, textAlign: "center" }}>
                      <Button
                        type='link'
                        onClick={() => {/* logic to open add new data measure modal */}}
                        style={{ color: "#1976d2" }}
                      >
                        + ADD NEW DATA MEASURE
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <div className='container'>
                <div className='tooltip'>
                  <DeleteForeverIcon color="error" className='deleteIcon' onClick={handleDeleteIconClick} />
                  <span className='tooltipText'>Remove Data Measure</span>
                </div>
              </div>
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div
                    className='dataContainer'
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '24px',
                      marginTop: 24,
                      justifyContent: 'center',
                    }}
                  >
                  

                    {activeFrequencies.map((behavior) => (
  <Paper
    key={behavior._id}
    elevation={2}
    sx={{
      display: 'flex',
      alignItems: 'stretch', // Make buttons fill the height
      justifyContent: 'space-between',
      borderRadius: 4,
      border: '1.5px solid #e0d7f6',
      bgcolor: '#faf8ff',
      px: 0,
      py: 0,
      mb: 2,
      width: '100%',
      // maxWidth: 500,
      minHeight: '100%',
    // Ensures a fixed height for the row
      mx: 'auto',
      boxShadow: '0 2px 8px 0 #f3eaff',
    }}
  >
    {isLeftHanded ? (
      <>
        {/* Plus Button (left) */}
        <Box sx={{ flex: '0 0 72px', height: '100%' }}>
          <Button
            sx={{
              width: '100%',
              height: '100%',
              minWidth: 0,
              minHeight: 0,
              p: 0,
              borderRadius: '0 4px 4px 0',
              color: '#fff',
              bgcolor: '#5e35b1',
              fontSize: 36,
              boxShadow: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': { bgcolor: '#7c43bd' },
            }}
            onClick={() => handleIncrementFrequency(behavior._id)}
          >
            <AddIcon sx={{ fontSize: 36 }} />
          </Button>
        </Box>
        {/* Center Label */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography sx={{ fontWeight: 600, textAlign: 'center', fontSize: 20 }}>
            {behavior.behaviorTitle}: ({getTodayCount(behavior.dailyCounts || [])})
          </Typography>
        </Box>
        {/* Minus Button (right) */}
        <Box sx={{ flex: '0 0 72px', display: 'flex', height: '100%' }}>
          <Button
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              borderRadius: '0 4px 4px 0',
              color: '#bdbdbd',
              bgcolor: '#f3eaff',
              border: 'none',
              fontSize: 36,
              minWidth: 0,
              p: 0,
              boxShadow: 0,
            }}
            disabled
          >
            <RemoveIcon sx={{ fontSize: 36 }} />
          </Button>
        </Box>
      </>
    ) : (
      <>
        {/* Minus Button (left) */}
        <Box sx={{ flex: '0 0 72px', display: 'flex', height: '100%' }}>
          <Button
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
              borderRadius: '4px 0 0 4px',
              color: '#bdbdbd',
              bgcolor: '#f3eaff',
              border: 'none',
              fontSize: 36,
              minWidth: 0,
              p: 0,
              boxShadow: 0,
            }}
            disabled
          >
            <RemoveIcon sx={{ fontSize: 36 }} />
          </Button>
        </Box>
        {/* Center Label */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography sx={{ fontWeight: 600, textAlign: 'center', fontSize: 20 }}>
            {behavior.behaviorTitle}: ({getTodayCount(behavior.dailyCounts || [])})
          </Typography>
        </Box>
        {/* Plus Button (right) */}
        <Box sx={{ flex: '0 0 72px', display: 'flex', height: '100%' }}>
          <Button
            sx={{
              width: '100%',
              height: '100%',
              borderRadius: '0 4px 4px 0',
              color: '#fff',
              bgcolor: '#5e35b1',
              fontSize: 36,
              minWidth: 0,
              p: 0,
              boxShadow: 0,
              '&:hover': { bgcolor: '#7c43bd' },
            }}
            onClick={() => handleIncrementFrequency(behavior._id)}
          >
            <AddIcon sx={{ fontSize: 36 }} />
          </Button>
        </Box>
      </>
    )}
  </Paper>
))}
                  </div>
                </div>
              </div>

              <Modal
                title={`Are you sure you want to delete ${
                  selectedBehaviorTitles.length === 1
                    ? selectedBehaviorTitles[0]
                    : selectedBehaviorTitles.length === 2
                    ? selectedBehaviorTitles.join(' and ')
                    : selectedBehaviorTitles.slice(0, -1).join(', ') + ', and ' + selectedBehaviorTitles[selectedBehaviorTitles.length - 1]
                }?`}
                open={showDeleteConfirmation}
                onOk={handleConfirmDelete}
                onCancel={() => setShowDeleteConfirmation(false)}
              >
                <p>Click "OK" to confirm deletion.</p>
              </Modal>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Frequency; 
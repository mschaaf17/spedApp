import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_ME, QUERY_USER, QUERY_FREQUENCY_TEMPLATES } from '../../utils/queries';
import { useParams } from 'react-router-dom';
import { Button, Select, message, Modal } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { ADD_DATA_MEASURE_TO_STUDENT, REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT, INCREMENT_FREQUENCY, UPDATE_FREQUENCY_NOTE } from '../../utils/mutations';
import Auth from '../../utils/auth';
import { Button as MUIButton } from '@mui/material';

const { confirm } = Modal;

const Frequency = ({ studentId: propStudentId, refetchTrigger }) => {
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

  const handleAdd = async (dataMeasureId) => {
    await addDataMeasureToStudent({
      variables: { dataMeasureId, studentId },
    });
    await refetch();
    setShowSelect(false);
    setSelectedBehaviorTitles([]);
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
                  <>
                    {templatesLoading ? <div>Loading templates...</div> : (
                      <Select
                        mode='multiple'
                        style={{ width: '100%' }}
                        placeholder='Select behavior titles'
                        onChange={handleSelectChange}
                      >
                        {availableTemplates?.map((template) => (
                          <Select.Option key={template._id} value={template._id}>
                            {template.behaviorTitle}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                    <Button
                      type='primary'
                      onClick={async () => {
                        await Promise.all(
                          selectedBehaviorTitles.map((dataMeasureId) =>
                            handleAdd(dataMeasureId)
                          )
                        );
                        setShowSelect(false);
                        setSelectedBehaviorTitles([]);
                      }}
                      disabled={selectedBehaviorTitles.length === 0}
                    >
                      Save
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div>
              <div className='container'>
                <div className='tooltip'>
                  <DeleteForeverIcon danger className='deleteIcon' onClick={handleDeleteIconClick} />
                  <span className='tooltipText'>Remove Data Measure</span>
                </div>
              </div>
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className='dataContainer' style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: 24 }}>
                    {activeFrequencies.map((behavior) => {
                      return (
                        <div key={behavior._id} style={{ position: 'relative', marginBottom: 12, width: '100%' }}>
                          <MUIButton
                            variant="contained"
                            disableElevation
                            fullWidth
                            sx={{
                              borderRadius: 999,
                              bgcolor: selectedBehaviorIds.includes(behavior._id) ? '#ffcccc' : '#7c4dff',
                              color: selectedBehaviorIds.includes(behavior._id) ? '#b71c1c' : '#fff',
                              fontWeight: 700,
                              fontSize: 20,
                              px: 4,
                              py: 2,
                              mb: 2,
                              boxShadow: '0 2px 8px rgba(124,77,255,0.08)',
                              transition: 'background 0.2s',
                              '&:hover': {
                                bgcolor: selectedBehaviorIds.includes(behavior._id) ? '#ffb3b3' : '#651fff',
                              },
                              border: selectedBehaviorIds.includes(behavior._id) ? '2px solid #b71c1c' : 'none',
                            }}
                            onClick={() => {
                              if (deleteMode) {
                                handleSpecificSelectedButtonToDeleteClick(behavior._id, behavior.behaviorTitle);
                              } else {
                                handleIncrementFrequency(behavior._id);
                              }
                            }}
                          >
                            <span>
                              {behavior.behaviorTitle} <b>({getTodayCount(behavior.dailyCounts || [])})</b>
                            </span>
                          </MUIButton>
                        </div>
                      );
                    })}
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
                visible={showDeleteConfirmation}
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
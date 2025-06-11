import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_ME, QUERY_USER, QUERY_FREQUENCY_TEMPLATES } from '../../utils/queries';
import { useParams } from 'react-router-dom';
import { Button, Select, message, Modal } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import { ADD_DATA_MEASURE_TO_STUDENT, REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT, INCREMENT_FREQUENCY } from '../../utils/mutations';
import Auth from '../../utils/auth';

const { confirm } = Modal;

  const Frequency = () => {
  const { username: usernameFromUrl } = useParams();
  const { loading, data } = useQuery(QUERY_USER, {
    variables: { identifier: usernameFromUrl, isUsername: true },
  });

  const studentId = data?.user?._id;


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
  const [showDeleteIcons, setShowDeleteIcons] = useState(false); // State to track whether to show delete icons
  const [deleteMode, setDeleteMode] = useState(false); 
  const [selectedBehaviorIds, setSelectedBehaviorIds] = useState([]);
  const [showSaveCancel, setShowSaveCancel] = useState(false);
  const [redBackground, setRedBackground] = useState(false);
  const [deleteIconBehaviorId, setDeleteIconBehaviorId] = useState(null); // State to track which behavior id's delete icon was clicked
  const [selectedBehaviorTitleForDelete, setSelectedBehaviorTitleForDelete] = useState('');
  const [behaviorCounts, setBehaviorCounts] = useState({});

  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  const [removeDataMeasureFromStudent] = useMutation(REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT);
  const [incrementFrequency] = useMutation(INCREMENT_FREQUENCY);
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
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    return dailyCounts
      ?.filter(dc => {
        // Convert the timestamp to a date string
        const dateString = new Date(Number(dc.date)).toISOString().slice(0, 10);
        return dateString === today;
      })
      .reduce((sum, dc) => sum + dc.count, 0);
  }

  const handleClickForAddingDataMeasure = () => {
    setShowSelect(true);
    setShowDeleteIcons(false);
  };

  const handleSaveClickForAddingFrequency = async () => {
    try {
      if (!selectedBehaviorTitles || selectedBehaviorTitles.length === 0) {
        console.error('No behaviors selected to add.');
        return;
      }

      // Handle multiple behaviors using Promise.all for better performance
      if (Array.isArray(selectedBehaviorTitles)) {
        await Promise.all(
          selectedBehaviorTitles.map((dataMeasureId) =>
            addDataMeasureToStudent({
              variables: { dataMeasureId, studentId: user._id },
            })
          )
        );
      } else {
        // Handle single behavior case
        await addDataMeasureToStudent({
          variables: { dataMeasureId: selectedBehaviorTitles, studentId: user._id },
        });
      }

      console.log('Data measure(s) added to student successfully');
      setShowSelect(false); // Ensure UI updates after saving
    } catch (error) {
      console.error('Error adding data measure to student: ', error);
    }
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
      formatted = behaviorTitles; // fallback for single string
    }
    message.success(`${formatted} was removed from list`);
  };

  const handleIncrementFrequency = async (frequencyId) => {
    try {
      const currentDate = new Date().toISOString();
      console.log("currentDate being sent:", currentDate);
      const { data: incrementData } = await incrementFrequency({
        variables: { frequencyId, studentId: data.user._id, date: currentDate },
      });

      // Find the behavior in your local state and update its todayTotal
      setUser(prevUser => {
        const updatedFrequencies = prevUser.behaviorFrequencies.map(b => {
          if (b._id === frequencyId) {
            return {
              ...b,
              todayTotal: incrementData.incrementFrequency.todayTotal,
              dailyCounts: incrementData.incrementFrequency.dailyCounts,
            };
          }
          return b;
        });
        return { ...prevUser, behaviorFrequencies: updatedFrequencies };
      });
      console.log("button is clicked")

    
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

  if (loading || frequencyLoading  || !user) {
    return <div>Loading...</div>;
  }

 

  // Get the titles of behaviors already assigned to the student
  const assignedTitles = user.behaviorFrequencies.map(b => b.behaviorTitle);

  // Filter templates to only those not already assigned
  const availableTemplates = templatesData?.frequency?.filter(
    template => !assignedTitles.includes(template.behaviorTitle)
  );

  const activeFrequencies = user?.behaviorFrequencies?.filter(b => b.isActive) || [];

  return (
    <>


    <div className='centerBody'>
    <div className='titleSection'>
  <h1 className ="title"> Logging for {usernameFromUrl}</h1>
  </div>
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
                <Button type='primary' onClick={handleSaveClickForAddingFrequency}>
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
              <AddIcon danger className='icons' onClick={handleClickForAddingDataMeasure} />
              <span className='tooltipText'>Add Data Measure</span>
            </div>
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
                <Button type='primary' onClick={handleSaveClickForAddingFrequency}>
                  Save
                </Button>
              </>
            )}
            
            <div className='tooltip'>
              <DeleteForeverIcon danger className='deleteIcon' onClick={handleDeleteIconClick} />
              <span className='tooltipText'>Remove Data Measure</span>
            </div>
          </div>

          <h2 className='secondHeading'>Click button as behavior occurs</h2>
          <div className='dataContainer'>

            

         
            {activeFrequencies.map((behavior) => {
              
              console.log(behavior, "full behavior object");
              console.log(behavior.dailyCounts ? behavior.dailyCounts : "no dailyCounts", "behavior.dailyCounts");
              console.log(behavior.todayTotal ? behavior.todayTotal : "no todayTotal", "behavior.todayTotal");
              return (
                <div key={behavior._id} style={{ position: 'relative' }}>
                  <Button
                    className={`buttonContent frequencyButtons ${selectedBehaviorIds.includes(behavior._id) ? 'selectedForDelete' : ''}`}
                    onClick={() => {
                      if (deleteMode) {
                        handleSpecificSelectedButtonToDeleteClick(behavior._id, behavior.behaviorTitle);
                      } else {
                        handleIncrementFrequency(behavior._id);
                      }
                    }}
                  >
                    {behavior.behaviorTitle} : ({getTodayCount(behavior.dailyCounts)})
                    {showRedXIcons && (
                      <span className='deleteIcon' onClick={e => {
                        e.stopPropagation(); // Prevents triggering the main button click
                        handleSpecificSelectedButtonToDeleteClick(behavior._id, behavior.behaviorTitle);
                      }}>
                        &times;
                      </span>
                    )}
                  </Button>
                </div>
              );
            })}

            {showSaveCancel && (
              <>
                <Button type='primary' onClick={handleSaveClickForDeletingFrequency} disabled={selectedBehaviorIds.length === 0}>
                  Save
                </Button>
                <Button onClick={handleCancelClickForExitingDeleteMode} disabled={!showSaveCancel}>
                  Cancel
                </Button>
              </>
            )}
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

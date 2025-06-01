import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_ME, QUERY_USER } from '../../utils/queries';
import { useParams } from 'react-router-dom';
import { Button, Select, message, Modal } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import { ADD_DATA_MEASURE_TO_STUDENT, REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT, FREQUENCY_INCREASED } from '../../utils/mutations';
import Auth from '../../utils/auth';

const { confirm } = Modal;

const Frequency = () => {
  const { username: usernameFromUrl } = useParams();
  const { loading, data } = useQuery(QUERY_USER, {
    variables: { identifier: usernameFromUrl, isUsername: true },
  });

  const { loading: meLoading, data: meData } = useQuery(QUERY_ME);
  const { loading: frequencyLoading, data: frequencyData, refetch: refetchBehaviorFrequency } = useQuery(QUERY_FREQUENCY_LIST);

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

  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  const [removeDataMeasureFromStudent] = useMutation(REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT);
  const [frequencyItemIncreased] = useMutation(FREQUENCY_INCREASED);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!loading && data) {
      setUser(data.user);
    }
  }, [loading, data]);

  const handleSelectChange = (value) => {
    setSelectedBehaviorTitles(value);
  };

  const handleClickForAddingDataMeasure = () => {
    setShowSelect(true);
    setShowDeleteIcons(false);
  };

  const handleSaveClickForAddingFrequency = async () => {
    try {
      if (Array.isArray(selectedBehaviorTitles)) {
        for (const dataMeasureId of selectedBehaviorTitles) {
          await addDataMeasureToStudent({
            variables: { dataMeasureId, studentId: user._id },
          });
        }
      } else {
        await addDataMeasureToStudent({
          variables: { dataMeasureId: selectedBehaviorTitles, studentId: user._id },
        });
      }
      console.log('Data measure(s) added to student successfully');
      setShowSelect(false);
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
      setSelectedBehaviorTitleForDelete(behaviorTitle); 
    }
  };

  const handleCancelClickForExitingDeleteMode = () => {
    setDeleteMode(false);
    setShowSaveCancel(false);
    setSelectedBehaviorIds([]);
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
      setDeleteMode(false);
      setShowSaveCancel(false);
      setShowDeleteConfirmation(false);
      toggleRedXIcons(false);
      showDeleteMessage(selectedBehaviorTitleForDelete);
    } catch (error) {
      console.error('Error deleting data measures from student: ', error);
    }
  };

  const showDeleteMessage = (behaviorTitle) => {
    message.success(`${behaviorTitle} was removed from list`);
  };

  const handleFrequencyItemIncreasing = async (behaviorId) => {
    try {
      // Optimistically update the UI
      const updatedBehaviorFrequencies = user.behaviorFrequencies.map((behavior) =>
        behavior._id === behaviorId ? { ...behavior, count: behavior.count + 1 } : behavior
      );
      setUser({ ...user, behaviorFrequencies: updatedBehaviorFrequencies });
  
      // Call the mutation
      await frequencyItemIncreased({ variables: { frequencyId: behaviorId, studentId: user._id } });
  
      console.log('Frequency increased successfully');
    } catch (error) {
      console.error('Error increasing frequency count: ', error);
      // Revert the UI changes on error
      // You can handle this based on your specific requirements
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

  if (loading || frequencyLoading || meLoading || !user) {
    return <div>Loading...</div>;
  }

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
                <Select
                  mode='multiple'
                  style={{ width: '100%' }}
                  placeholder='Select behavior titles'
                  onChange={handleSelectChange}
                >
                  {initialMergedData.map((frequency) => (
                    <Select.Option key={frequency._id} value={frequency._id}>
                      {frequency.behaviorTitle}
                    </Select.Option>
                  ))}
                </Select>
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
                <Select
                  mode='multiple'
                  style={{ width: '100%' }}
                  placeholder='Select behavior titles'
                  onChange={handleSelectChange}
                >
                  {initialMergedData.map((frequency) => (
                    <Select.Option key={frequency._id} value={frequency._id}>
                      {frequency.behaviorTitle}
                    </Select.Option>
                  ))}
                </Select>
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
            {user.behaviorFrequencies.map((behavior) => (
              <div key={behavior._id} style={{ position: 'relative' }}>
                <Button 
                  className={`buttonContent frequencyButtons ${selectedBehaviorIds.includes(behavior._id) ? 'selectedForDelete' : ''}`}
                  onClick={() => handleSpecificSelectedButtonToDeleteClick(behavior._id, behavior.behaviorTitle)}
                >
                  <div onClick={() => handleFrequencyItemIncreasing(behavior._id)}>
                    {behavior.behaviorTitle} : ({behavior.count}) 
                  </div>
                  {showRedXIcons && (
                    <div>
                      <span className='deleteIcon' onClick={() => handleSpecificSelectedButtonToDeleteClick(behavior._id, behavior.behaviorTitle)}>&times;</span>
                    </div>
                  )}
                </Button>
              </div>
            ))}

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
            title={`Are you sure you want to delete ${selectedBehaviorTitles.length > 0 ? (
              selectedBehaviorTitles.length === 1 ? (
                selectedBehaviorTitles[0]
              ) : selectedBehaviorTitles.length === 2 ? (
                selectedBehaviorTitles.join(' and ')
              ) : (
                selectedBehaviorTitles.slice(0, -1).join(', ') + ', and ' + selectedBehaviorTitles[selectedBehaviorTitles.length - 1]
              )
            ) : ''}?`}
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

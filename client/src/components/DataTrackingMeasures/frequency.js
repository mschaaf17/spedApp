import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_DURATION_LIST, QUERY_ME, QUERY_USER } from '../../utils/queries';
import { useParams } from 'react-router-dom';
import { Button, Select } from 'antd';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';
import { ADD_DATA_MEASURE_TO_STUDENT } from '../../utils/mutations';
import Auth from '../../utils/auth';

const Frequency = () => {
  const { username: usernameFromUrl } = useParams();
  const { loading, data } = useQuery(QUERY_USER, {
    variables: { username: usernameFromUrl },
  });

  const { loading: meLoading, data: meData } = useQuery(QUERY_ME);
  const { loading: frequencyLoading, data: frequencyData } = useQuery(QUERY_FREQUENCY_LIST);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [selectedBehaviorTitles, setSelectedBehaviorTitles] = useState([]);
  const [selectedDataMeasureId, setSelectedDataMeasureId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [initialMergedData, setInitialMergedData] = useState([]);
  const [addedStudents, setAddedStudents] = useState({});
  const [showSelect, setShowSelect] = useState(false); // State to manage the visibility of the select dropdown

  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
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
    setShowSelect(true); // Show the select dropdown
  };

  const handleSaveClick = async () => {
    try {
      await addDataMeasureToStudent({
        variables: { dataMeasureId: selectedBehaviorTitles, studentId: user._id },
      });
      console.log('Data measure added to student successfully');
    } catch (error) {
      console.error('Error adding data measure to student: ', error);
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
    if (!loggedInUser || !frequencyData) return;

    const loggedInUserId = loggedInUser.data._id;

    const filteredFrequencyData = frequencyData?.frequency.filter(
      (item) => item.createdBy.some((user) => user._id === loggedInUserId)
    ) || [];

    const mergedData = [...filteredFrequencyData];
    setInitialMergedData(mergedData);
  }, [loggedInUser, frequencyData]);

  const updateMergedData = (newData) => {
    setInitialMergedData(newData);
  };

  if (loading || frequencyLoading || meLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user && user.behaviorFrequencies && user.behaviorFrequencies.length > 0 ? (
        <div>
          <div className='container'>
            <div className='tooltip'>
              <AddIcon danger className='icons' onClick={handleClickForAddingDataMeasure} />
              <span className='tooltipText'>Add Data Measure</span>
            </div>
            <div className='tooltip'>
              <DeleteForeverIcon danger className='deleteIcon' />
              <span className='tooltipText'>Remove Data Measure</span>
            </div>
          </div>
          <h2>Click button as behavior occurs</h2>
          <div className='data-logging-container'>
            {user.behaviorFrequencies.map((behavior) => (
              <button key={behavior._id}>{behavior.behaviorTitle}</button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div>No behavior frequencies found for this user.</div>
          <div>Add a frequency behavior ???</div>
        </>
      )}
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
          <Button type='primary' onClick={handleSaveClick}>
            Save
          </Button>
        </>
      )}
    </div>
  );
};

export default Frequency;

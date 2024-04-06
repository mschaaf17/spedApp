import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_DURATION_LIST, QUERY_ME } from '../../../utils/queries';
import { Button, message } from 'antd';
import { DataMeasureTable } from '../../../components/Tables/GeneralTables/dataMeasuresListTable';
import Auth from '../../../utils/auth';
import { REMOVE_FREQUENCY_TITLE, REMOVE_DURATION_TITLE, ADD_DATA_MEASURE_TO_STUDENT } from '../../../utils/mutations';
import AddNewDataMeasure from '../../../components/AddNewDataMeasure/AddNewDataMeasure';

export default function DataMeasuresList() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isDataMeasureModalOpen, setDataMeasureModalOpen] = useState(false);
  const [selectedDataMeasureId, setSelectedDataMeasureId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [addedStudents, setAddedStudents] = useState({});
  const [initialMergedData, setInitialMergedData] = useState([]);
  const [addDataMeasureToStudent, { error: removeDataMeasureError }] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  const [removeFrequencyTitleFromList] = useMutation(REMOVE_FREQUENCY_TITLE);
  const [removeDurationTitleFromList] = useMutation(REMOVE_DURATION_TITLE);

  const { loading: meLoading, data: meData } = useQuery(QUERY_ME);
  const { loading: frequencyLoading, data: frequencyData } = useQuery(QUERY_FREQUENCY_LIST);
  const { loading: durationLoading, data: durationData } = useQuery(QUERY_DURATION_LIST);

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
    if (!loggedInUser || !frequencyData || !durationData) return;

    const loggedInUserId = loggedInUser.data._id;

    const filteredFrequencyData = frequencyData?.frequency.filter(item =>
      item.createdBy.some(user => user._id === loggedInUserId)
    ) || [];

    const filteredDurationData = durationData?.duration.filter(item =>
      item.createdBy.some(user => user._id === loggedInUserId)
    ) || [];

    const mergedData = [...filteredFrequencyData, ...filteredDurationData];
    setInitialMergedData(mergedData);
  }, [loggedInUser, frequencyData, durationData]);

  const updateMergedData = (newData) => {
    setInitialMergedData(newData);
  };

  const handleDataMeasureForStudentClick = (dataMeasureId) => {
    setSelectedDataMeasureId(dataMeasureId);
  };

  const submitDataMeasureForStudent = async (selectedDataMeasureId, selectedStudentId) => {
    if (!selectedStudent || !selectedDataMeasureId) return;
    try {
      await addDataMeasureToStudent({
        variables: {
          studentId: selectedStudentId,
          dataMeasureId: selectedDataMeasureId
        }
      });
      setAddedStudents(prevAddedStudents => ({
        ...prevAddedStudents,
        [selectedStudent]: true,
      }));
    } catch (error) {
      console.error('Error saving data measure: ', error);
    }
  };

  const openDataMeasureModal = () => {
    console.log("Opening Data measure Modal");
    setDataMeasureModalOpen(true);
  };

  const closeAddDataMeasurenModal = () => {
    setDataMeasureModalOpen(false);
  };

  const showDeleteMessage = (dataType) => {
    message.success(`${dataType} was removed from list`);
  };

  const handleDelete = async (record) => {
    const { _id, __typename } = record;
    const dataType = __typename === 'Frequency' ? 'Frequency' : 'Duration';
    try {
      if (dataType === "Frequency") {
        await removeFrequencyTitleFromList({ variables: { id: _id } });
      } else {
        await removeDurationTitleFromList({ variables: { id: _id } });
      }
      const updatedData = initialMergedData.filter(item => item._id !== _id);
      setInitialMergedData(updatedData);
      showDeleteMessage(dataType);
    } catch (error) {
      console.error(`Error removing ${dataType.toLowerCase()} data measure:`, error);
    }
  };

  return (
    <div>
      <div className='titleSection'>
        <h1 className="title">Data Measures</h1>
      </div>
      {!isDataMeasureModalOpen && (
        <Button className='generalButton' onClick={openDataMeasureModal}>Add Data Measure</Button>
      )}
      {isDataMeasureModalOpen && <AddNewDataMeasure onClose={closeAddDataMeasurenModal} updateMergedData={updateMergedData} mergedData={initialMergedData} />}
      <DataMeasureTable
        loading={frequencyLoading || durationLoading}
        mergedData={initialMergedData}
        meData={meData?.me || null}
        selectedDataMeasureId={selectedDataMeasureId}
        onDataMeasureClick={handleDataMeasureForStudentClick}
        submitDataMeasureForStudent={submitDataMeasureForStudent}
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
        handleDelete={handleDelete}
      />
    </div>
  );
}

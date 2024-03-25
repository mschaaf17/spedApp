import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_DURATION_LIST, QUERY_ME } from '../../../utils/queries';
// import { Button } from 'react-bootstrap';
import { Button } from 'antd';
import  {DataMeasureTable} from '../../../components/Tables/GeneralTables/dataMeasuresListTable'
import Auth from '../../../utils/auth';
//neeed to import add frequency to student, duration title, and duration to student 
import { ADD_FREQUENCY_TITLE, ADD_DURATION_TITLE, REMOVE_FREQUENCY_TITLE, REMOVE_DURATION_TITLE, ADD_DATA_MEASURE_TO_STUDENT } from '../../../utils/mutations';
import AddNewDataMeasure from '../../../components/AddNewDataMeasure/AddNewDataMeasure';


export default function DataMeasuresList() {
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [isDataMeasureModalOpen, setDataMeasureModalOpen] = useState(false);
    const [selectedDataMeasureId, setSelectedDataMeasureId] = useState(null)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [addedStudents, setAddedStudents] = useState({});
    const [addDataMeasureToStudent, {error: removeDataMeasureError}] = useMutation(ADD_DATA_MEASURE_TO_STUDENT)

    const { loading: meLoading, data: meData } = useQuery(QUERY_ME);
    const { loading: frequencyLoading, data: frequencyData } = useQuery(QUERY_FREQUENCY_LIST);
    const { loading: durationLoading, data: durationData } = useQuery(QUERY_DURATION_LIST);
  
    const me = meData?.me || null;

    useEffect(() => {
      const userProfile = Auth.getProfile();
      if (userProfile) {
        // If user is logged in, set the loggedInUser state with user profile
        setLoggedInUser(userProfile);
      } else {
        // Handle case when user is not logged in
        setLoggedInUser(null);
      }
    }, []);
  
    // Check if user is logged in and retrieve user ID
    const loggedInUserId = loggedInUser ? loggedInUser._id : null;
  
    // Fetch frequency and duration data
    const getAllFrequencyData = frequencyData?.frequency || [];
    const getAllDurationData = durationData?.duration || [];
  
    // Filter data based on logged in user ID
    // const filteredFrequencyData = getAllFrequencyData.filter(item =>
    //   item.createdBy.some(user => user._id === loggedInUserId)
    // );
    // const filteredDurationData = getAllDurationData.filter(item =>
    //   item.createdBy.some(user => user._id === loggedInUserId)
    // );
    const filteredFrequencyData = getAllFrequencyData.filter(item => {
        // Log the createdBy array for each item
        console.log("Item:", item);
        console.log("CreatedBy:", item.createdBy);
      
        // Use the some() method to check if any user ID matches the loggedInUserId
        const filtered = item.createdBy.some(user => {
          console.log("User ID:", user._id);
          console.log("LoggedInUserId:", loggedInUserId);
          return user._id 
        });
      
        return filtered;
      });
      
      const filteredDurationData = getAllDurationData.filter(item => {
        // Log the createdBy array for each item
        console.log("Item:", item);
        console.log("CreatedBy:", item.createdBy);
      
        // Use the some() method to check if any user ID matches the loggedInUserId
        const filtered = item.createdBy.some(user => {
          console.log("User ID:", user._id);
          console.log("LoggedInUserId:", loggedInUserId);
          //return user._id === loggedInUserId;
          //loggedInUserId is displaying as undefined
          return user._id 
        });
      
        return filtered;
      });
  
    // Merge filtered frequency and duration data
    const mergedData = [...filteredFrequencyData, ...filteredDurationData];

    // const handleDataMeasureSelect = (dataMeasureId) => {
    //   setSelectedDataMeasureId(dataMeasureId)
    // }
    const handleDataMeasureForStudentClick = (dataMeasureId)=> {
      setSelectedDataMeasureId(dataMeasureId)
    }

   

    const submitDataMeasureForStudent = async(selectedDataMeasureId, selectedStudentId) => {
      if (!selectedStudent || !selectedDataMeasureId) return;
      //if the id clicked has behavior run the addDurationToStudent
      //if the id from the table click has frequency run the addFrequenyToStudent
      try{
        await addDataMeasureToStudent({
          variables: {
            studentId: selectedStudentId, 
            dataMeasureId: selectedDataMeasureId
          }
        })
        setAddedStudents(prevAddedStudents => ({
          ...prevAddedStudents,
          [selectedStudent]: true,
        }))
      } catch (error) {
        console.error('Error saving data measure: ', error)        
      }
    }

    const openDataMeasureModal = () => {
      console.log("Opening Data measure Modal");
      setDataMeasureModalOpen(true);
    }
    
  
    const closeAddDataMeasurenModal = () => {
      setDataMeasureModalOpen(false);
      
    }
  
    // Log authentication state and user profile to console
    console.log('Is user logged in?', loggedInUser !== null);
    console.log('Logged in user profile:', loggedInUser);
    console.log("Filtered Frequency Data:", filteredFrequencyData);
console.log("Filtered Duration Data:", filteredDurationData);

  
  
  return (
    <div>
      <div className='titleSection'>
        <h1 className="title">Data Measures</h1>
      </div>
    {!isDataMeasureModalOpen && (
      <Button className='generalButton' onClick={openDataMeasureModal}>Add Data Measure</Button>
    )}

    {isDataMeasureModalOpen && <AddNewDataMeasure onClose = {closeAddDataMeasurenModal}/>}

        <DataMeasureTable
        loading = {frequencyLoading || durationLoading} 
        mergedData = {mergedData}
        meData = {me}
        selectedDataMeasureId = {selectedDataMeasureId}
        onDataMeasureClick = {handleDataMeasureForStudentClick}
        submitDataMeasureForStudent = {submitDataMeasureForStudent}
        selectedStudent = {selectedStudent}
        setSelectedStudent = {setSelectedStudent}
        />
        
    </div>
  );
}

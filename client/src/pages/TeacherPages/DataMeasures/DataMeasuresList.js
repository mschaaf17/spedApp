import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_FREQUENCY_LIST, QUERY_DURATION_LIST, QUERY_ME, QUERY_FREQUENCY_TEMPLATES } from '../../../utils/queries';
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
  const [addDataMeasureToStudent, { refetch: refetchMe }] = useMutation(ADD_DATA_MEASURE_TO_STUDENT, {
    refetchQueries: [{ query: QUERY_ME }]
  });
  const [removeFrequencyTitleFromList] = useMutation(REMOVE_FREQUENCY_TITLE);
  const [removeDurationTitleFromList] = useMutation(REMOVE_DURATION_TITLE);

  const { loading: meLoading, data: meData } = useQuery(QUERY_ME);
  const { loading: frequencyLoading, data: frequencyData } = useQuery(QUERY_FREQUENCY_LIST);
  const { loading: durationLoading, data: durationData } = useQuery(QUERY_DURATION_LIST);
  const { loading: templateLoading, data: templateFrequencyData } = useQuery(QUERY_FREQUENCY_TEMPLATES);



//adding a data measure to a student needs to match the frequnecy.js file because that one works



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
    if (!loggedInUser || !templateFrequencyData || !durationData) return;
    console.log('templateData', templateFrequencyData?.frequency);
    const loggedInUserId = loggedInUser.data._id;

     const filteredFrequencyData = templateFrequencyData?.frequency
     //.filter(item =>
    //   item.createdBy.some(user => user._id === loggedInUserId)
    // ) || [];

    const filteredDurationData = durationData?.duration
    // .filter(item =>
    //   item.createdBy.some(user => user._id === loggedInUserId)
    // ) || [];

    const mergedData = [...filteredFrequencyData, ...filteredDurationData];
    setInitialMergedData(mergedData);
  }, [loggedInUser, templateFrequencyData, durationData]);

  // useEffect(() => {
  //   // Skip if we don't have template data
  //   if (!templateData?.frequency) {
  //     console.log('No template data available');
  //     return;
  //   }

  //   // Get all templates
  //   const templates = templateData.frequency;
  //   console.log('Available templates:', templates);

  //   // If we have student data, filter out already assigned behaviors
  //   if (meData?.me?.students) {
  //     const assignedBehaviors = new Set();
  //     meData.me.students.forEach(student => {
  //       if (student.behaviorFrequencies) {
  //         student.behaviorFrequencies.forEach(freq => {
  //           if (freq.isTemplate) {
  //             assignedBehaviors.add(freq.behaviorTitle);
  //           }
  //         });
  //       }
  //     });

  //     console.log('All templates:', templates);
  //     console.log('Assigned behaviors:', Array.from(assignedBehaviors));

  //     // Filter out templates that are already assigned
  //     const availableTemplates = templates.filter(template => 
  //       !assignedBehaviors.has(template.behaviorTitle)
  //     );
  //     console.log('Filtered templates:', availableTemplates);
  //     setInitialMergedData(availableTemplates);
  //   } else {
  //     // If no student data, show all templates
  //     setInitialMergedData(templates);
  //   }
  // }, [templateData, meData]);

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
        variables: { dataMeasureId: selectedDataMeasureId, studentId: selectedStudentId },
      });

      setAddedStudents(prevAddedStudents => ({
        ...prevAddedStudents,
        [selectedStudent]: true,
      }));
      
      const dataMeasure = Array.isArray(initialMergedData)
        ? initialMergedData.find(dm => dm._id === selectedDataMeasureId)
        : null;

      const studentList = meData?.students || meData?.me?.students || [];
      const student = Array.isArray(studentList)
        ? studentList.find(stu => stu._id === selectedStudentId)
        : null;

      const dataMeasureName = dataMeasure ? dataMeasure.behaviorTitle : selectedDataMeasureId;
      const studentName = student ? `${student.firstName} ${student.lastName}` : selectedStudentId;

      message.success(`${dataMeasureName} was added to ${studentName}`);
    } catch (error) {
      if (
        error?.graphQLErrors?.[0]?.message &&
        error.graphQLErrors[0].message.includes("already tracking the behavior")
      ) {
        alert(error.graphQLErrors[0].message);
      } else {
        console.error('Error saving data measure: ', error);
      }
    }
  
  };

  const openDataMeasureModal = () => {
    console.log("Opening Data measure Modal");
    setDataMeasureModalOpen(true);
  };

  const closeAddDataMeasurenModal = () => {
    setDataMeasureModalOpen(false);
  };

  const showDeleteMessage = (deletedBehaviorTitle) => {
    message.success(`${deletedBehaviorTitle} was removed from list`);
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
      showDeleteMessage(record.behaviorTitle);
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
        loading={templateLoading}
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

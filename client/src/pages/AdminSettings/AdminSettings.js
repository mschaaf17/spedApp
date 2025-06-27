import React, { useState } from 'react';
import { Layout, Tabs, Button, Modal, message } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME, QUERY_STUDENT_LIST, QUERY_ACCOMMODATION_TEMPLATES, QUERY_INTERVENTION_TEMPLATES, QUERY_FREQUENCY_LIST, QUERY_DURATION_LIST, QUERY_CONTRACT_MEASURES, QUERY_CONTRACTS } from '../../utils/queries';
import { ADD_STUDENT_TO_LIST, REMOVE_STUDENT_FROM_LIST, ADD_ACCOMMODATION_TEMPLATE, REMOVE_ACCOMMODATION, ADD_INTERVENTION_TEMPLATE, REMOVED_INTERVENTION_FROM_LIST, ADD_FREQUENCY_TITLE, REMOVE_FREQUENCY_TITLE, ADD_DURATION_TITLE, REMOVE_DURATION_TITLE, ADD_ACCOMMODATION_FOR_STUDENT, ADD_INTERVENTION_FOR_STUDENT, ADD_DATA_MEASURE_TO_STUDENT, ADD_CONTRACT_MEASURE_TO_STUDENT } from '../../utils/mutations';

// Import table components
import StudentTable from '../../components/Tables/studentTable';
import AccommodationListTable from '../../components/Tables/GeneralTables/accommodationListTable';
import InterventionListTable from '../../components/Tables/GeneralTables/interventionListTable';
import DataMeasuresListTable from '../../components/Tables/GeneralTables/dataMeasuresListTable';
import ContractMeasuresAdminTable from '../../components/Tables/GeneralTables/ContractMeasuresAdminTable';

// Import add new item components
import AddNewAccommodation from '../../components/AddNewAccommodation/AddNewAccommodation';
import AddNewIntervention from '../../components/AddNewIntervention/AddNewIntervention';
import AddNewDataMeasure from '../../components/AddNewDataMeasure/AddNewDataMeasure';

import './AdminSettings.css';

const { Content } = Layout;
const { TabPane } = Tabs;

const AdminSettings = () => {
  // State for modals
  const [isAccommodationModalOpen, setAccommodationModalOpen] = useState(false);
  const [isInterventionModalOpen, setInterventionModalOpen] = useState(false);
  const [isDataMeasureModalOpen, setDataMeasureModalOpen] = useState(false);

  // State for table interactions
  const [selectedDataMeasureId, setSelectedDataMeasureId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [addedStudents, setAddedStudents] = useState({});

  // Queries
  const { loading: meLoading, data: meData, refetch: refetchMe } = useQuery(QUERY_ME);
  const { loading: allStudentsLoading, data: allStudentsData } = useQuery(QUERY_STUDENT_LIST);
  const { loading: accommodationLoading, data: accommodationData } = useQuery(QUERY_ACCOMMODATION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const { loading: interventionLoading, data: interventionData } = useQuery(QUERY_INTERVENTION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const { loading: frequencyLoading, data: frequencyData } = useQuery(QUERY_FREQUENCY_LIST);
  const { loading: durationLoading, data: durationData } = useQuery(QUERY_DURATION_LIST, {
    variables: { isTemplate: true }
  });
  const { loading: contractMeasuresLoading, data: contractMeasuresData } = useQuery(QUERY_CONTRACT_MEASURES);
  const { loading: contractsLoading, data: contractsData } = useQuery(QUERY_CONTRACTS);

  // Mutations
  const [addStudentToList] = useMutation(ADD_STUDENT_TO_LIST);
  const [removeStudentFromList] = useMutation(REMOVE_STUDENT_FROM_LIST);
  const [addAccommodationTemplate] = useMutation(ADD_ACCOMMODATION_TEMPLATE);
  const [removeAccommodation] = useMutation(REMOVE_ACCOMMODATION);
  const [addInterventionTemplate] = useMutation(ADD_INTERVENTION_TEMPLATE);
  const [removedInterventionFromList] = useMutation(REMOVED_INTERVENTION_FROM_LIST);
  const [addFrequencyTitleToList] = useMutation(ADD_FREQUENCY_TITLE);
  const [removeFrequencyTitleFromList] = useMutation(REMOVE_FREQUENCY_TITLE);
  const [addDurationTitleToList] = useMutation(ADD_DURATION_TITLE);
  const [removeDurationTitleFromList] = useMutation(REMOVE_DURATION_TITLE);
  const [addAccommodationForStudent] = useMutation(ADD_ACCOMMODATION_FOR_STUDENT);
  const [addInterventionForStudent] = useMutation(ADD_INTERVENTION_FOR_STUDENT);
  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  const [addContractMeasureToStudent] = useMutation(ADD_CONTRACT_MEASURE_TO_STUDENT);

  // Data
  const myStudents = meData?.me?.students || [];
  const getAllStudents = allStudentsData?.students || [];
  const accommodationList = accommodationData?.accommodationList || [];
  const interventionList = interventionData?.interventionList || [];
  const frequencyList = frequencyData?.frequency || [];
  const durationList = durationData?.duration || [];
  const contractMeasures = contractMeasuresData?.contractMeasures || [];
  const contracts = contractsData?.contracts || [];

  // Merge frequency and duration data for data measures (only templates)
  const mergedDataMeasures = [
    ...frequencyList.filter(freq => freq.isTemplate).map(freq => ({ ...freq, __typename: 'Frequency', dataMeasureType: 'Frequency' })),
    ...durationList.filter(dur => dur.isTemplate).map(dur => ({ ...dur, __typename: 'Duration', dataMeasureType: 'Duration' }))
    // No contracts here!
  ];

  const loading = meLoading || allStudentsLoading || accommodationLoading || interventionLoading || frequencyLoading || durationLoading || contractMeasuresLoading || contractsLoading;

  // Student management functions
  const handleAddStudent = async (studentId) => {
    try {
      await addStudentToList({
        variables: { studentId },
        refetchQueries: [{ query: QUERY_ME }]
      });
      setAddedStudents((prevAddedStudents) => ({
        ...prevAddedStudents,
        [studentId]: true,
      }));
      message.success('Student added successfully');
    } catch (error) {
      console.error('Error adding student:', error);
      message.error('Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await removeStudentFromList({
        variables: { studentId },
        refetchQueries: [{ query: QUERY_ME }]
      });
      setAddedStudents((prevAddedStudents) => {
        const updatedStudents = { ...prevAddedStudents };
        delete updatedStudents[studentId];
        return updatedStudents;
      });
      message.success('Student removed successfully');
    } catch (error) {
      console.error('Error removing student:', error);
      message.error('Failed to remove student');
    }
  };

  const isStudentAdded = (userId) => !!addedStudents[userId];

  // Helper function to check if an intervention is a core intervention
  const isCoreIntervention = (title) => {
    const lowerTitle = title.toLowerCase();
    return lowerTitle.includes('break'); // Only protect Breaks, Contracts are now managed through student dashboard
  };

  // Accommodation management functions
  const handleAssignAccommodation = async (accommodationId, studentId) => {
    try {
      await addAccommodationForStudent({
        variables: { accommodationId, studentId },
        refetchQueries: [{ query: QUERY_ME }]
      });
      message.success('Accommodation assigned successfully');
    } catch (error) {
      console.error('Error assigning accommodation:', error);
      message.error('Failed to assign accommodation');
    }
  };

  const handleDeleteAccommodation = async (accommodationId) => {
    try {
      await removeAccommodation({
        variables: { id: accommodationId },
        refetchQueries: [{ query: QUERY_ACCOMMODATION_TEMPLATES, variables: { isTemplate: true, isActive: true } }]
      });
      message.success('Accommodation deleted successfully');
    } catch (error) {
      console.error('Error deleting accommodation:', error);
      message.error('Failed to delete accommodation');
    }
  };

  // Intervention management functions
  const handleAssignIntervention = async (interventionId, studentId, behaviorId) => {
    try {
      await addInterventionForStudent({
        variables: { interventionId, studentId, behaviorId },
        refetchQueries: [{ query: QUERY_ME }]
      });
      message.success('Intervention assigned successfully');
    } catch (error) {
      console.error('Error assigning intervention:', error);
      message.error('Failed to assign intervention');
    }
  };

  const handleDeleteIntervention = async (interventionId) => {
    try {
      // Find the intervention to check its title
      const intervention = interventionList.find(intervention => intervention._id === interventionId);
      
      if (intervention) {
        const title = intervention.title.toLowerCase();
        if (isCoreIntervention(title)) {
          message.warning('Cannot delete core interventions: Breaks are always available to all teachers.');
          return;
        }
      }
      
      await removedInterventionFromList({
        variables: { interventionId: interventionId },
        refetchQueries: [{ query: QUERY_INTERVENTION_TEMPLATES, variables: { isTemplate: true, isActive: true } }]
      });
      message.success('Intervention deleted successfully');
    } catch (error) {
      console.error('Error deleting intervention:', error);
      message.error('Failed to delete intervention');
    }
  };

  // Data measure management functions
  const handleAssignDataMeasure = async (dataMeasureId, studentId) => {
    try {
      // Find the data measure to determine its type
      const dataMeasure = mergedDataMeasures.find(measure => measure._id === dataMeasureId);
      
      if (dataMeasure && dataMeasure.__typename === 'Contract') {
        // For contracts, use the contract measure mutation
        await addContractMeasureToStudent({
          variables: { contractMeasureId: dataMeasureId, studentId },
          refetchQueries: [{ query: QUERY_ME }]
        });
        message.success('Contract measure assigned successfully');
        return;
      }
      
      await addDataMeasureToStudent({
        variables: { dataMeasureId, studentId },
        refetchQueries: [{ query: QUERY_ME }]
      });
      message.success('Data measure assigned successfully');
    } catch (error) {
      console.error('Error assigning data measure:', error);
      message.error('Failed to assign data measure');
    }
  };

  const handleDeleteDataMeasure = async (dataMeasure) => {
    try {
      if (dataMeasure.__typename === 'Frequency') {
        await removeFrequencyTitleFromList({
          variables: { _id: dataMeasure._id },
          refetchQueries: [{ query: QUERY_FREQUENCY_LIST }]
        });
      } else if (dataMeasure.__typename === 'Duration') {
        await removeDurationTitleFromList({
          variables: { _id: dataMeasure._id },
          refetchQueries: [{ query: QUERY_DURATION_LIST }]
        });
      } else if (dataMeasure.__typename === 'Contract') {
        // Note: Contract measures don't have a delete mutation yet, so we'll skip this for now
        message.info('Contract measure deletion not implemented yet');
        return;
      }
      message.success('Data measure deleted successfully');
    } catch (error) {
      console.error('Error deleting data measure:', error);
      message.error('Failed to delete data measure');
    }
  };

  const handleDataMeasureClick = (dataMeasureId) => {
    setSelectedDataMeasureId(dataMeasureId);
  };

  // Modal handlers
  const openAccommodationModal = () => setAccommodationModalOpen(true);
  const closeAccommodationModal = () => setAccommodationModalOpen(false);
  
  const openInterventionModal = () => setInterventionModalOpen(true);
  const closeInterventionModal = () => setInterventionModalOpen(false);
  
  const openDataMeasureModal = () => setDataMeasureModalOpen(true);
  const closeDataMeasureModal = () => setDataMeasureModalOpen(false);

  return (
    <Layout className="admin-settings-layout">
      <div className="admin-settings-header">
        <h1>Admin Settings</h1>
        <p>Manage students, accommodations, interventions, and data measures</p>
      </div>

      <Content className="admin-settings-content">
        <Tabs defaultActiveKey="students" size="large">
          <TabPane tab="Students" key="students">
            <div className="tab-content">
              <div className="tab-header">
                <h2>Student Management</h2>
                <p>Add and remove students from your list</p>
              </div>
              
              <StudentTable
                placeholder="Search to add student..."
                isStudentAdded={isStudentAdded}
                getAllStudents={getAllStudents}
                getMyStudentList={myStudents}
                removeStudent={handleRemoveStudent}
                addStudent={handleAddStudent}
                setSelectedForm={() => {}}
              />
            </div>
          </TabPane>

          <TabPane tab="Accommodations" key="accommodations">
            <div className="tab-content">
              <div className="tab-header">
                <h2>Accommodation Management</h2>
                <p>Create and manage accommodation templates</p>
                <Button type="primary" onClick={openAccommodationModal}>
                  Add New Accommodation
                </Button>
              </div>

              <AccommodationListTable
                accommodationItems={accommodationList}
                meData={meData?.me || null}
                accommodationLoading={accommodationLoading || meLoading}
                onAccommodationClick={() => {}}
                submitAccommodationForStudent={handleAssignAccommodation}
                onRemoveAccommodation={handleDeleteAccommodation}
              />
            </div>
          </TabPane>

          <TabPane tab="Interventions" key="interventions">
            <div className="tab-content">
              <div className="tab-header">
                <h2>Intervention Management</h2>
                <p>Create and manage intervention templates</p>
                <Button type="primary" onClick={openInterventionModal}>
                  Add New Intervention
                </Button>
              </div>

              <InterventionListTable 
                submitInterventionForStudent={handleAssignIntervention}
                meData={meData?.me || null}
                interventionLoading={interventionLoading || meLoading}
                onRemoveIntervention={handleDeleteIntervention}
              />
            </div>
          </TabPane>

          <TabPane tab="Data Measures" key="dataMeasures">
            <div className="tab-content">
              <div className="tab-header">
                <h2>Data Measure Management</h2>
                <p>Create and manage frequency and duration templates</p>
                <Button type="primary" onClick={openDataMeasureModal}>
                  Add New Data Measure
                </Button>
              </div>

              <DataMeasuresListTable
                loading={frequencyLoading || durationLoading}
                mergedData={mergedDataMeasures}
                meData={meData?.me || null}
                selectedDataMeasureId={selectedDataMeasureId}
                onDataMeasureClick={handleDataMeasureClick}
                submitDataMeasureForStudent={handleAssignDataMeasure}
                selectedStudent={selectedStudent}
                setSelectedStudent={setSelectedStudent}
                handleDelete={handleDeleteDataMeasure}
              />
            </div>
          </TabPane>

          <TabPane tab="Contracts Data Measures" key="contractsDataMeasures">
            <div className="tab-content">
              <div className="tab-header">
                <h2>Contract Data Measure Management</h2>
                <p>Create and manage contract behavior templates for student behavior contracts</p>
              </div>
              
              <ContractMeasuresAdminTable
                contractMeasures={contractMeasures}
                refetchContractMeasures={contractMeasuresData?.refetch}
                contracts={contracts}
              />
            </div>
          </TabPane>
        </Tabs>
      </Content>

      {/* Modals */}
      <Modal
        title="Add New Accommodation"
        open={isAccommodationModalOpen}
        onCancel={closeAccommodationModal}
        footer={null}
        width={600}
      >
        <AddNewAccommodation onClose={closeAccommodationModal} />
      </Modal>

      <Modal
        title="Add New Intervention"
        open={isInterventionModalOpen}
        onCancel={closeInterventionModal}
        footer={null}
        width={600}
      >
        <AddNewIntervention onClose={closeInterventionModal} />
      </Modal>

      <Modal
        title="Add New Data Measure"
        open={isDataMeasureModalOpen}
        onCancel={closeDataMeasureModal}
        footer={null}
        width={600}
      >
        <AddNewDataMeasure onClose={closeDataMeasureModal} />
      </Modal>
    </Layout>
  );
};

export default AdminSettings; 
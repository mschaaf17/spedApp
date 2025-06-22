import React, { useState, useEffect } from 'react';
import { Layout, Menu, Select, Card, Tabs, Button, Table, Space, Input, Dropdown, Modal, Popconfirm } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME, QUERY_STUDENT_LIST, QUERY_INTERVENTION_TEMPLATES, QUERY_ACCOMMODATION_TEMPLATES } from '../../utils/queries';
import { ADD_STUDENT_TO_LIST, REMOVE_STUDENT_FROM_LIST, ADD_INTERVENTION_FOR_STUDENT, REMOVE_INTERVENTION_FROM_STUDENT, ADD_ACCOMMODATION_FOR_STUDENT, REMOVE_ACCOMMODATION_FROM_STUDENT } from '../../utils/mutations';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Scatter, Circle, BarChart, Bar } from 'recharts';
import './Dashboard.css';

// Import your existing components
import InterventionsTable from '../Tables/StudentSpecificTables/interventionsTable';
import DurationCharts from '../DataTrackingMeasures/durationCharts';
import FrequencyCharts from '../DataTrackingMeasures/frequencyCharts';
import StudentDataMeasuresTable from '../Tables/StudentSpecificTables/studentDataMeasuresTable';

const { Header, Content } = Layout;
const { TabPane } = Tabs;

// Color palette for interventions
const interventionColors = [
  '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
  '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe'
];

function getInterventionColor(intervention) {
  if (!intervention) return '#8884d8';
  const str = intervention._id ? intervention._id.toString() : '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return interventionColors[Math.abs(hash) % interventionColors.length];
}

const Dashboard = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [addedStudents, setAddedStudents] = useState({});
  const [showAddIntervention, setShowAddIntervention] = useState(false);
  const [selectedBehaviorForIntervention, setSelectedBehaviorForIntervention] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showAddAccommodation, setShowAddAccommodation] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const navigate = useNavigate();

  // Query logged-in user and their student list
  const { loading: meLoading, data: meData, refetch: refetchMe } = useQuery(QUERY_ME);
  const { loading: allStudentsLoading, data: allStudentsData } = useQuery(QUERY_STUDENT_LIST);
  const { loading: interventionsLoading, data: interventionsData } = useQuery(QUERY_INTERVENTION_TEMPLATES, {
    variables: { isTemplate: false, isActive: true }
  });
  const { loading: templateLoading, data: templateData } = useQuery(QUERY_INTERVENTION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const { loading: accommodationLoading, data: accommodationData } = useQuery(QUERY_ACCOMMODATION_TEMPLATES, {
    variables: { isTemplate: false, isActive: true }
  });
  const { loading: accommodationTemplateLoading, data: accommodationTemplateData } = useQuery(QUERY_ACCOMMODATION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });

  // Mutations for adding/removing students, interventions, and accommodations
  const [addStudentToList] = useMutation(ADD_STUDENT_TO_LIST);
  const [removeStudentFromList] = useMutation(REMOVE_STUDENT_FROM_LIST);
  const [addInterventionForStudent] = useMutation(ADD_INTERVENTION_FOR_STUDENT);
  const [removeInterventionForStudent] = useMutation(REMOVE_INTERVENTION_FROM_STUDENT);
  const [addAccommodationForStudent] = useMutation(ADD_ACCOMMODATION_FOR_STUDENT);
  const [removeAccommodationFromStudent] = useMutation(REMOVE_ACCOMMODATION_FROM_STUDENT);

  const myStudents = meData?.me?.students || [];
  const getAllStudents = allStudentsData?.students || [];
  const allInterventions = interventionsData?.interventionList || [];
  const interventionTemplates = templateData?.interventionList || [];
  const allAccommodations = accommodationData?.accommodationList || [];
  const accommodationTemplates = accommodationTemplateData?.accommodationList || [];
  const loading = meLoading || allStudentsLoading || interventionsLoading || templateLoading || accommodationLoading || accommodationTemplateLoading;

  // Get interventions for the selected student with complete data
  const getStudentInterventions = () => {
    if (!selectedStudent || !allInterventions) return [];
    
    return allInterventions.filter(intervention => 
      intervention.studentId?._id === selectedStudent._id
    );
  };

  // Handle student selection from dropdown
  const handleStudentChange = (value) => {
    const student = myStudents.find(s => s._id === value);
    setSelectedStudent(student);
    setSelectedBehavior(null); // Reset behavior selection when student changes
  };

  // Handle behavior selection for charts
  const handleBehaviorChange = (value) => {
    const [type, id] = value.split('-');
    setSelectedBehavior({ type, id });
  };

  // Handle adding a student to the teacher's list
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
      
      // Refetch the teacher's data to update the student list
      await refetchMe();
      
      // Clear the search
      setSearchValue('');
      setFilteredData([]);
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  // Handle adding an intervention to the student
  const handleAddIntervention = async () => {
    if (!selectedBehaviorForIntervention || !selectedIntervention) {
      return;
    }

    try {
      await addInterventionForStudent({
        variables: {
          interventionId: selectedIntervention,
          studentId: selectedStudent._id,
          behaviorId: selectedBehaviorForIntervention
        },
        refetchQueries: [
          { query: QUERY_ME }
        ]
      });

      // Reset form and close modal
      setSelectedBehaviorForIntervention(null);
      setSelectedIntervention(null);
      setShowAddIntervention(false);
      
    } catch (error) {
      console.error('Error adding intervention:', error);
    }
  };

  // Handle search/filter for adding students
  const handleFilter = (e) => {
    const searchWord = e.target.value.toLowerCase();
    setSearchValue(searchWord);
    
    if (!searchWord) {
      setFilteredData([]);
      return;
    }

    const newFilter = getAllStudents.filter((student) => {
      const { username, firstName, lastName, studentSchoolId } = student;
      return (
        username.toLowerCase().includes(searchWord) ||
        firstName.toLowerCase().includes(searchWord) ||
        lastName.toLowerCase().includes(searchWord) ||
        studentSchoolId.includes(searchWord)
      );
    });
    
    setFilteredData(newFilter);
  };

  // Capitalize helper
  const capitalizeInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get all behaviors for the selected student
  const getBehaviors = () => {
    if (!selectedStudent) return [];
    
    const durations = (selectedStudent.behaviorDurations || []).map(d => ({
      id: d._id,
      title: d.behaviorTitle,
      type: 'duration',
      data: d
    }));
    
    const frequencies = (selectedStudent.behaviorFrequencies || []).map(f => ({
      id: f._id,
      title: f.behaviorTitle,
      type: 'frequency',
      data: f
    }));
    
    return [...durations, ...frequencies];
  };

  // Render the appropriate chart based on selected behavior
  const renderBehaviorChart = () => {
    if (!selectedBehavior) return null;

    const behavior = getBehaviors().find(b => 
      b.type === selectedBehavior.type && b.id === selectedBehavior.id
    );

    if (!behavior) return null;

    if (selectedBehavior.type === 'frequency') {
      return (
        <FrequencyCharts 
          frequencies={[behavior.data]}
          interventions={selectedStudent.interventions}
        />
      );
    } else {
      return (
        <DurationCharts 
          durations={[behavior.data]}
        />
      );
    }
  };

  // Get available behaviors for the selected student
  const getAvailableBehaviors = () => {
    if (!selectedStudent) return [];
    
    const frequencies = (selectedStudent.behaviorFrequencies || [])
      .filter(f => f.isActive)
      .map(f => ({
        value: f._id,
        label: `${f.behaviorTitle} (Frequency)`
      }));
    
    const durations = (selectedStudent.behaviorDurations || [])
      .filter(d => d.isActive)
      .map(d => ({
        value: d._id,
        label: `${d.behaviorTitle} (Duration)`
      }));
    
    return [...frequencies, ...durations];
  };

  // Get available interventions (filter out already assigned ones)
  const getAvailableInterventions = () => {
    if (!selectedStudent || !interventionTemplates) return [];
    
    const studentInterventions = getStudentInterventions();
    const assignedInterventionTitles = new Set(
      studentInterventions.map(i => i.title)
    );
    
    return interventionTemplates
      .filter(intervention => !assignedInterventionTitles.has(intervention.title))
      .map(intervention => ({
        value: intervention._id,
        label: intervention.title
      }));
  };

  // Get accommodations for the selected student with complete data
  const getStudentAccommodations = () => {
    if (!selectedStudent) return [];
    
    // Use accommodations directly from the student data in QUERY_ME
    return selectedStudent.accommodations || [];
  };

  // Get available accommodations (filter out already assigned ones)
  const getAvailableAccommodations = () => {
    if (!selectedStudent || !accommodationTemplates) return [];
    
    const studentAccommodations = getStudentAccommodations();
    const assignedAccommodationTitles = new Set(
      studentAccommodations.map(a => a.title)
    );
    
    return accommodationTemplates
      .filter(accommodation => !assignedAccommodationTitles.has(accommodation.title))
      .map(accommodation => ({
        value: accommodation._id,
        label: accommodation.title
      }));
  };

  // Handle removing an intervention from the student
  const handleRemoveIntervention = async (interventionId) => {
    try {
      await removeInterventionForStudent({
        variables: {
          interventionId: interventionId,
          studentId: selectedStudent._id
        },
        refetchQueries: [
          { query: QUERY_ME }
        ]
      });
      
    } catch (error) {
      console.error('Error removing intervention:', error);
    }
  };

  // Handle adding an accommodation to the student
  const handleAddAccommodation = async () => {
    if (!selectedAccommodation) {
      return;
    }

    try {
      await addAccommodationForStudent({
        variables: {
          accommodationId: selectedAccommodation,
          studentId: selectedStudent._id
        },
        refetchQueries: [
          { query: QUERY_ME }
        ]
      });

      // Reset form and close modal
      setSelectedAccommodation(null);
      setShowAddAccommodation(false);
      
    } catch (error) {
      console.error('Error adding accommodation:', error);
    }
  };

  // Handle removing an accommodation from the student
  const handleRemoveAccommodation = async (accommodationId) => {
    try {
      await removeAccommodationFromStudent({
        variables: {
          accommodationId: accommodationId,
          studentId: selectedStudent._id
        },
        refetchQueries: [
          { query: QUERY_ME }
        ]
      });
      
    } catch (error) {
      console.error('Error removing accommodation:', error);
    }
  };

  return (
    <Layout className="dashboard-layout">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <span>Select Student</span>
          <span>Add Student</span>
          <span>Logout</span>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Student Selection Section */}
        <div className="student-selector-section">
          <div className="student-dropdown">
            <Select
              placeholder="Select Student"
              style={{ width: 300 }}
              onChange={handleStudentChange}
              loading={loading}
            >
              {myStudents.map(student => (
                <Select.Option key={student._id} value={student._id}>
                  {`${student.lastName}, ${student.firstName} (${student.studentSchoolId})`}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="add-student-section">
            <Input
              placeholder="Search to add student..."
              prefix={<SearchIcon />}
              onChange={handleFilter}
              value={searchValue}
            />
            {filteredData.length > 0 && (
              <div className="search-results">
                {filteredData.map((student) => {
                  const isAdded = myStudents.some(s => s._id === student._id);
                  return (
                    <div 
                      key={student._id} 
                      className="search-result-item"
                      onClick={() => {
                        if (!isAdded) {
                          handleAddStudent(student._id);
                        }
                      }}
                    >
                      <span>
                        {`${student.lastName}, ${student.firstName} (${student.studentSchoolId})`}
                      </span>
                      {isAdded ? (
                        <BookmarkAddedIcon style={{ color: '#52c41a' }} />
                      ) : (
                        <AddIcon className="add-icon" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Student Data Section */}
        {selectedStudent && (
          <div className="student-data-section">
            <div className="student-header">
              <h2>{selectedStudent.firstName} {selectedStudent.lastName}</h2>
              <p>ID: {selectedStudent.studentSchoolId}</p>
            </div>

            <Tabs defaultActiveKey="accommodations">
              <TabPane tab="Accommodations" key="accommodations">
                <div className="accommodations-content">
                  <div className="accommodations-header">
                    <h3>Current Accommodations</h3>
                    <Button type="primary" onClick={() => setShowAddAccommodation(true)}>
                      Add Accommodation
                    </Button>
                  </div>
                  
                  <Table
                    columns={[
                      {
                        title: 'Title',
                        dataIndex: 'title',
                        key: 'title',
                        render: text => <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{text}</span>
                      },
                      {
                        title: 'Description',
                        dataIndex: 'description',
                        key: 'description',
                        ellipsis: {
                          showTitle: false,
                        },
                        render: (text) => (
                          <span>{text || '—'}</span>
                        )
                      },
                      {
                        title: 'Assigned Date',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        render: (createdAt) => {
                          if (!createdAt) return '—';
                          let dateObj;
                          if (typeof createdAt === "number") {
                            dateObj = new Date(createdAt);
                          } else if (typeof createdAt === "string" && /^\d+$/.test(createdAt)) {
                            dateObj = new Date(Number(createdAt));
                          } else {
                            dateObj = new Date(createdAt);
                          }
                          return isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleDateString();
                        },
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_, record) => (
                          <Popconfirm
                            title="Remove this accommodation from student?"
                            onConfirm={() => handleRemoveAccommodation(record._id)}
                          >
                            <Button danger size="small">
                              Remove
                            </Button>
                          </Popconfirm>
                        ),
                      },
                    ]}
                    dataSource={getStudentAccommodations()}
                    rowKey="_id"
                    loading={loading}
                    locale={{
                      emptyText: 'No accommodations found for this student'
                    }}
                  />
                </div>
              </TabPane>

              <TabPane tab="Interventions" key="interventions">
                <div className="interventions-content">
                  <div className="interventions-header">
                    <h3>Current Interventions</h3>
                    <Button type="primary" onClick={() => setShowAddIntervention(true)}>
                      Add Intervention
                    </Button>
                  </div>
                  
                  <Table
                    columns={[
                      {
                        title: 'Title',
                        dataIndex: 'title',
                        key: 'title',
                        render: text => <span style={{ fontWeight: 500 }}>{text}</span>
                      },
                      {
                        title: 'Behavior',
                        dataIndex: 'behaviorId',
                        key: 'behavior',
                        render: (behaviorId) => behaviorId?.behaviorTitle || '—',
                      },
                      {
                        title: 'Assigned Date',
                        dataIndex: 'createdAt',
                        key: 'createdAt',
                        render: (createdAt) => {
                          if (!createdAt) return '—';
                          let dateObj;
                          if (typeof createdAt === "number") {
                            dateObj = new Date(createdAt);
                          } else if (typeof createdAt === "string" && /^\d+$/.test(createdAt)) {
                            dateObj = new Date(Number(createdAt));
                          } else {
                            dateObj = new Date(createdAt);
                          }
                          return isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleDateString();
                        },
                      },
                      {
                        title: 'Function',
                        dataIndex: 'function',
                        key: 'function',
                      },
                      {
                        title: 'Summary',
                        dataIndex: 'summary',
                        key: 'summary',
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_, record) => (
                          <Popconfirm
                            title="Are you sure you want to remove this intervention?"
                            onConfirm={() => handleRemoveIntervention(record._id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button type="link" danger size="small">
                              Remove
                            </Button>
                          </Popconfirm>
                        ),
                      },
                    ]}
                    dataSource={getStudentInterventions()}
                    rowKey="_id"
                  />
                </div>
              </TabPane>

              <TabPane tab="Data Measures" key="dataMeasures">
                <div className="data-measures-content">
                  <StudentDataMeasuresTable
                    student={selectedStudent}
                    onViewChart={(record) => {
                      // Switch to charts tab and select the behavior
                      const behaviorType = record.type;
                      const behaviorId = record._id;
                      setSelectedBehavior({ type: behaviorType, id: behaviorId });
                      // You might want to add a way to switch tabs here
                    }}
                    onRemoveDataMeasure={(record) => {
                      // Handle data measure removal
                      console.log('Data measure removed:', record);
                    }}
                  />
                </div>
              </TabPane>
            </Tabs>

            {/* Charts Section - Only show if student has data measures */}
            {getBehaviors().length > 0 && (
              <div className="charts-section" style={{ marginTop: 24 }}>
                <div className="charts-header">
                  <h3>Data Charts</h3>
                  <div className="behavior-selector">
                    <Select 
                      placeholder="Select Behavior to View Chart" 
                      style={{ width: 300 }}
                      onChange={handleBehaviorChange}
                      value={selectedBehavior ? `${selectedBehavior.type}-${selectedBehavior.id}` : undefined}
                      allowClear
                    >
                      {getBehaviors().map(behavior => (
                        <Select.Option 
                          key={`${behavior.type}-${behavior.id}`} 
                          value={`${behavior.type}-${behavior.id}`}
                        >
                          {behavior.title} ({behavior.type})
                        </Select.Option>
                      ))}
                    </Select>
                  </div>
                </div>
                
                {selectedBehavior && (
                  <div className="charts-display" style={{ marginTop: 16 }}>
                    {renderBehaviorChart()}
                  </div>
                )}
                
                {!selectedBehavior && (
                  <div className="charts-placeholder" style={{ 
                    textAlign: 'center', 
                    padding: 40, 
                    color: '#666',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 8
                  }}>
                    <p>Select a behavior from the dropdown above to view its chart</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Intervention Modal */}
      <Modal
        title="Add Intervention"
        open={showAddIntervention}
        onOk={handleAddIntervention}
        onCancel={() => {
          setShowAddIntervention(false);
          setSelectedBehaviorForIntervention(null);
          setSelectedIntervention(null);
        }}
        okText="Add Intervention"
        cancelText="Cancel"
        okButtonProps={{ 
          disabled: !selectedBehaviorForIntervention || !selectedIntervention 
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Behavior:
          </label>
          <Select
            placeholder="Select a behavior"
            style={{ width: '100%' }}
            value={selectedBehaviorForIntervention}
            onChange={setSelectedBehaviorForIntervention}
            options={getAvailableBehaviors()}
          />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Intervention:
          </label>
          <Select
            placeholder="Select an intervention"
            style={{ width: '100%' }}
            value={selectedIntervention}
            onChange={setSelectedIntervention}
            disabled={!selectedBehaviorForIntervention}
            options={getAvailableInterventions()}
          />
        </div>
        
        {selectedIntervention && (
          <div style={{ 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            marginTop: 16 
          }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Intervention Details:</h4>
            {(() => {
              const intervention = interventionTemplates.find(i => i._id === selectedIntervention);
              return intervention ? (
                <div>
                  <p><strong>Function:</strong> {intervention.function}</p>
                  <p><strong>Summary:</strong> {intervention.summary}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </Modal>

      {/* Add Accommodation Modal */}
      <Modal
        title="Add Accommodation"
        open={showAddAccommodation}
        onOk={handleAddAccommodation}
        onCancel={() => {
          setShowAddAccommodation(false);
          setSelectedAccommodation(null);
        }}
        okText="Add Accommodation"
        cancelText="Cancel"
        okButtonProps={{ 
          disabled: !selectedAccommodation 
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Accommodation:
          </label>
          <Select
            placeholder="Select an accommodation"
            style={{ width: '100%' }}
            value={selectedAccommodation}
            onChange={setSelectedAccommodation}
            options={getAvailableAccommodations()}
          />
        </div>
        
        {selectedAccommodation && (
          <div style={{ 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            marginTop: 16 
          }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Accommodation Details:</h4>
            {(() => {
              const accommodation = accommodationTemplates.find(a => a._id === selectedAccommodation);
              return accommodation ? (
                <div>
                  <p><strong>Description:</strong> {accommodation.description}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Dashboard; 
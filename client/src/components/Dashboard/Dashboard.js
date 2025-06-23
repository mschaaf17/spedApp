import React, { useState, useEffect } from 'react';
import { Layout, Menu, Select, Card, Tabs, Button, Table, Space, Input, Dropdown, Modal, Popconfirm, message, Form, InputNumber, Switch, Radio } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME, QUERY_STUDENT_LIST, QUERY_INTERVENTION_TEMPLATES, QUERY_ACCOMMODATION_TEMPLATES, QUERY_USER, QUERY_FREQUENCY_TEMPLATES, QUERY_DURATION_TEMPLATES } from '../../utils/queries';
import { ADD_STUDENT_TO_LIST, REMOVE_STUDENT_FROM_LIST, ADD_INTERVENTION_FOR_STUDENT, REMOVE_INTERVENTION_FROM_STUDENT, ADD_ACCOMMODATION_FOR_STUDENT, REMOVE_ACCOMMODATION_FROM_STUDENT, ADD_DATA_MEASURE_TO_STUDENT, UPDATE_STUDENT_VIEW_CONFIG, UPDATE_BREAK_SETTINGS } from '../../utils/mutations';
import { Link, useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Scatter, Circle, BarChart, Bar } from 'recharts';
import './Dashboard.css';
import StudentAccommodations from '../../pages/StudentPages/StudentAccommodations/StudentAccommodations';

// Import your existing components
import InterventionsTable from '../Tables/StudentSpecificTables/interventionsTable';
import DurationCharts from '../DataTrackingMeasures/durationCharts';
import FrequencyCharts from '../DataTrackingMeasures/frequencyCharts';
import StudentDataMeasuresTable from '../Tables/StudentSpecificTables/studentDataMeasuresTable';

// Import data tracking components
import Frequency from '../DataTrackingMeasures/frequency';
import DurationTimers from '../DataTrackingMeasures/durationTimers';

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
  const [showAddDataMeasure, setShowAddDataMeasure] = useState(false);
  const [selectedDataMeasure, setSelectedDataMeasure] = useState(null);
  const [selectedDataMeasureType, setSelectedDataMeasureType] = useState(null);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('analyze');
  const [activeTab, setActiveTab] = useState('accommodations');
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  // Student View Configuration State
  const [showAccommodations, setShowAccommodations] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState([]);
  const [showBreaks, setShowBreaks] = useState(false);
  
  // Break Settings State
  const [breakSettings, setBreakSettings] = useState({
    isEnabled: false,
    duration: 5,
    hasDelay: false,
    delayDuration: 15,
    dailyLimit: 0, // 0 for unlimited
  });
  const [isUnlimitedBreaks, setIsUnlimitedBreaks] = useState(true);

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

  // Get detailed student data with interventions that have behaviorId
  const { loading: selectedStudentLoading, data: selectedStudentData, refetch: refetchSelectedStudent } = useQuery(QUERY_USER, {
    variables: { identifier: selectedStudent?.username || '', isUsername: true },
    skip: !selectedStudent?.username,
    pollInterval: 5000, // Poll every 5 seconds to keep duration data fresh
    notifyOnNetworkStatusChange: true
  });

  // Queries for data measure templates
  const { loading: frequencyLoading, data: frequencyData } = useQuery(QUERY_FREQUENCY_TEMPLATES);
  const { loading: durationLoading, data: durationData } = useQuery(QUERY_DURATION_TEMPLATES);

  // Mutations for adding/removing students, interventions, and accommodations
  const [addStudentToList] = useMutation(ADD_STUDENT_TO_LIST);
  const [removeStudentFromList] = useMutation(REMOVE_STUDENT_FROM_LIST);
  const [addInterventionForStudent] = useMutation(ADD_INTERVENTION_FOR_STUDENT);
  const [removeInterventionForStudent] = useMutation(REMOVE_INTERVENTION_FROM_STUDENT);
  const [addAccommodationForStudent] = useMutation(ADD_ACCOMMODATION_FOR_STUDENT);
  const [removeAccommodationFromStudent] = useMutation(REMOVE_ACCOMMODATION_FROM_STUDENT);
  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  const [updateStudentViewConfig] = useMutation(UPDATE_STUDENT_VIEW_CONFIG);
  const [updateBreakSettings] = useMutation(UPDATE_BREAK_SETTINGS);

  const myStudents = meData?.me?.students || [];
  const getAllStudents = allStudentsData?.students || [];
  const allInterventions = interventionsData?.interventionList || [];
  const interventionTemplates = templateData?.interventionList || [];
  const allAccommodations = accommodationData?.accommodationList || [];
  const accommodationTemplates = accommodationTemplateData?.accommodationList || [];
  const loading = meLoading || allStudentsLoading || interventionsLoading || templateLoading || accommodationLoading || accommodationTemplateLoading || selectedStudentLoading || frequencyLoading || durationLoading;

  // Data measure templates
  const frequencyTemplates = frequencyData?.frequency?.filter(t => t.isTemplate) || [];
  const durationTemplates = durationData?.duration?.filter(t => t.isTemplate) || [];

  // Get interventions for the selected student with complete data
  const getStudentInterventions = () => {
    if (!selectedStudent) return [];
    
    // Use detailed student data if available (includes behaviorId field)
    if (selectedStudentData?.user) {
      return selectedStudentData.user.interventions || [];
    }
    
    // Fallback to basic intervention data from QUERY_ME
    if (!allInterventions) return [];
    
    return allInterventions.filter(intervention => 
      intervention.studentId?._id === selectedStudent._id
    );
  };

  // Handle student selection from dropdown
  const handleStudentChange = (value) => {
    const student = myStudents.find(s => s._id === value);
    setSelectedStudent(student);
    setSelectedBehavior(null);
    
    // Load student view configuration
    if (student?.studentViewConfig) {
      setShowAccommodations(student.studentViewConfig.showAccommodations || false);
      setSelectedCharts(student.studentViewConfig.selectedCharts || []);
    } else {
      setShowAccommodations(false);
      setSelectedCharts([]);
    }
    
    // Load break settings configuration
    if (student?.breakSettings) {
      setBreakSettings(student.breakSettings);
      setIsUnlimitedBreaks(student.breakSettings.dailyLimit === 0);
      setShowBreaks(student.breakSettings.isEnabled || false);
    } else {
      // Reset to defaults
      setBreakSettings({ isEnabled: false, duration: 5, hasDelay: false, delayDuration: 15, dailyLimit: 0 });
      setIsUnlimitedBreaks(true);
      setShowBreaks(false);
    }
  };

  // Handle behavior selection for charts
  const handleBehaviorChange = (value) => {
    if (Array.isArray(value)) {
      // Multiple selections
      const behaviors = value.map(v => {
        const [type, id] = v.split('-');
        return { type, id };
      });
      setSelectedBehavior(behaviors);
      
      // Refetch student data to ensure we have the latest duration/frequency data
      if (selectedStudent?.username) {
        refetchSelectedStudent();
      }
    } else if (value) {
      // Single selection (for backward compatibility)
      const [type, id] = value.split('-');
      setSelectedBehavior([{ type, id }]);
      
      // Refetch student data to ensure we have the latest duration/frequency data
      if (selectedStudent?.username) {
        refetchSelectedStudent();
      }
    } else {
      // No selection
      setSelectedBehavior(null);
    }
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
          { query: QUERY_ME },
          { query: QUERY_USER, variables: { identifier: selectedStudent.username, isUsername: true } }
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
    
    // Use detailed student data if available (more up-to-date)
    const studentData = selectedStudentData?.user || selectedStudent;
    
    const durations = (studentData.behaviorDurations || []).map(d => ({
      id: d._id,
      title: d.behaviorTitle,
      type: 'duration',
      data: d
    }));
    
    const frequencies = (studentData.behaviorFrequencies || []).map(f => ({
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

    // Handle both single and multiple behaviors
    const behaviors = Array.isArray(selectedBehavior) ? selectedBehavior : [selectedBehavior];
    
    return behaviors.map(behavior => {
      const behaviorData = getBehaviors().find(b => 
        b.type === behavior.type && b.id === behavior.id
      );

      if (!behaviorData) return null;

      // Get interventions for this specific behavior
      const behaviorInterventions = getStudentInterventions().filter(intervention => 
        intervention.behaviorId?._id === behavior.id
      );

      if (behavior.type === 'frequency') {
        return (
          <div key={`${behavior.type}-${behavior.id}`} style={{ marginBottom: 24 }}>
            <FrequencyCharts 
              frequencies={[behaviorData.data]}
              interventions={behaviorInterventions}
            />
          </div>
        );
      } else {
        return (
          <div key={`${behavior.type}-${behavior.id}`} style={{ marginBottom: 24 }}>
            <DurationCharts 
              durations={[behaviorData.data]}
              interventions={behaviorInterventions}
            />
          </div>
        );
      }
    });
  };

  // Get available behaviors for the selected student
  const getAvailableBehaviors = () => {
    if (!selectedStudent) return [];
    
    // Use detailed student data if available (more up-to-date)
    const studentData = selectedStudentData?.user || selectedStudent;
    
    const frequencies = (studentData.behaviorFrequencies || [])
      .filter(f => f.isActive)
      .map(f => ({
        value: f._id,
        label: `${f.behaviorTitle} (Frequency)`
      }));
    
    const durations = (studentData.behaviorDurations || [])
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

  // Get available data measures (filter out already assigned ones)
  const getAvailableDataMeasures = () => {
    if (!selectedStudent) return [];
    
    // Get currently active behaviors from the student
    const studentFrequencies = (selectedStudent.behaviorFrequencies || [])
      .map(f => f.templateId || f._id); // Use templateId if available, fallback to _id
    
    const studentDurations = (selectedStudent.behaviorDurations || [])
      .map(d => d.templateId || d._id); // Use templateId if available, fallback to _id
    
    const assignedIds = new Set([...studentFrequencies, ...studentDurations]);
    
    // Filter based on selected type
    if (selectedDataMeasureType === 'frequency') {
      return frequencyTemplates
        .filter(freq => !assignedIds.has(freq._id))
        .map(freq => ({
          value: freq._id,
          label: freq.behaviorTitle
        }));
    } else if (selectedDataMeasureType === 'duration') {
      return durationTemplates
        .filter(dur => !assignedIds.has(dur._id))
        .map(dur => ({
          value: dur._id,
          label: dur.behaviorTitle
        }));
    }
    
    return [];
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
          { query: QUERY_ME },
          { query: QUERY_USER, variables: { identifier: selectedStudent.username, isUsername: true } }
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

  // Handle adding a data measure to the student
  const handleAddDataMeasure = async () => {
    if (!selectedDataMeasure || !selectedDataMeasureType) {
      return;
    }

    try {
      await addDataMeasureToStudent({
        variables: {
          dataMeasureId: selectedDataMeasure,
          studentId: selectedStudent._id,
          dataMeasureType: selectedDataMeasureType
        },
        refetchQueries: [
          { query: QUERY_ME },
          { query: QUERY_USER, variables: { identifier: selectedStudent.username, isUsername: true } }
        ]
      });

      // Manual refetch to ensure immediate update
      await refetchMe();
      await refetchSelectedStudent();

      // Additional refetch with delay to ensure mutation completes
      setTimeout(async () => {
        await refetchMe();
        await refetchSelectedStudent();
        // Trigger refetch in tracking components
        setRefetchTrigger(prev => prev + 1);
      }, 100);

      // Reset form and close modal
      setSelectedDataMeasure(null);
      setSelectedDataMeasureType(null);
      setShowAddDataMeasure(false);
      
      message.success('Data measure added successfully');
      
    } catch (error) {
      console.error('Error adding data measure:', error);
    }
  };

  // Handle saving student view configuration
  const handleSaveStudentViewConfig = async () => {
    if (!selectedStudent) return;

    // Create a clean selectedCharts array without GraphQL-specific properties
    const cleanSelectedCharts = selectedCharts.map(chart => ({
      type: chart.type,
      id: chart.id,
      title: chart.title
    }));

    console.log('Saving student view configuration:', {
      studentId: selectedStudent._id,
      showAccommodations,
      selectedCharts: cleanSelectedCharts,
      showBreaks
    });

    try {
      // Save student view configuration
      await updateStudentViewConfig({
        variables: {
          studentId: selectedStudent._id,
          showAccommodations,
          selectedCharts: cleanSelectedCharts
        },
        refetchQueries: [
          { query: QUERY_ME },
          { query: QUERY_USER, variables: { identifier: selectedStudent.username, isUsername: true } }
        ]
      });
      
      // If breaks are enabled in student view, also save break settings
      if (showBreaks) {
        const settingsToSend = {
          isEnabled: true,
          duration: breakSettings.duration,
          hasDelay: breakSettings.hasDelay,
          delayDuration: breakSettings.delayDuration,
          dailyLimit: isUnlimitedBreaks ? 0 : breakSettings.dailyLimit,
        };
        
        console.log('Saving break settings:', settingsToSend);
        
        await updateBreakSettings({
          variables: {
            studentId: selectedStudent._id,
            settings: settingsToSend,
          },
          update: (cache, { data }) => {
            // Update the cache for the admin's view (QUERY_ME)
            try {
              const existingData = cache.readQuery({ query: QUERY_ME });
              if (existingData?.me?.students) {
                const updatedStudents = existingData.me.students.map(student => 
                  student._id === selectedStudent._id 
                    ? { ...student, breakSettings: data.updateBreakSettings.breakSettings }
                    : student
                );
                cache.writeQuery({
                  query: QUERY_ME,
                  data: {
                    ...existingData,
                    me: {
                      ...existingData.me,
                      students: updatedStudents
                    }
                  }
                });
              }
            } catch (error) {
              console.log('Could not update QUERY_ME cache:', error);
            }

            // Update the cache for the student's view (QUERY_USER)
            try {
              const existingUserData = cache.readQuery({ 
                query: QUERY_USER, 
                variables: { identifier: selectedStudent.username, isUsername: true } 
              });
              if (existingUserData?.user) {
                cache.writeQuery({
                  query: QUERY_USER,
                  variables: { identifier: selectedStudent.username, isUsername: true },
                  data: {
                    ...existingUserData,
                    user: {
                      ...existingUserData.user,
                      breakSettings: data.updateBreakSettings.breakSettings
                    }
                  }
                });
              }
            } catch (error) {
              console.log('Could not update QUERY_USER cache:', error);
            }
          }
        });
      }
      
      message.success('Student view configuration saved successfully');
    } catch (error) {
      console.error('Error saving student view configuration:', error);
      console.error('Error details:', error.graphQLErrors, error.networkError);
      message.error('Failed to save student view configuration');
    }
  };

  // Check if student has a "Break" accommodation or intervention
  const studentHasBreaksFeature = selectedStudentData?.user?.accommodations.some(a => a.title.toLowerCase().includes('break')) ||
                                 selectedStudentData?.user?.interventions.some(i => i.title.toLowerCase().includes('break'));

  const handleSaveBreakSettings = async () => {
    if (!selectedStudent) return;
    
    // Create a clean settings object without GraphQL-specific properties
    const settingsToSend = {
      isEnabled: breakSettings.isEnabled,
      duration: breakSettings.duration,
      hasDelay: breakSettings.hasDelay,
      delayDuration: breakSettings.delayDuration,
      dailyLimit: isUnlimitedBreaks ? 0 : breakSettings.dailyLimit,
    };
    
    console.log('Saving break settings:', {
      studentId: selectedStudent._id,
      settings: settingsToSend,
      isUnlimitedBreaks
    });
    
    try {
      await updateBreakSettings({
        variables: {
          studentId: selectedStudent._id,
          settings: settingsToSend,
        },
        update: (cache, { data }) => {
          console.log('Cache update data:', data);
          // Update the cache for the admin's view (QUERY_ME)
          try {
            const existingData = cache.readQuery({ query: QUERY_ME });
            if (existingData?.me?.students) {
              const updatedStudents = existingData.me.students.map(student => 
                student._id === selectedStudent._id 
                  ? { ...student, breakSettings: data.updateBreakSettings.breakSettings }
                  : student
              );
              cache.writeQuery({
                query: QUERY_ME,
                data: {
                  ...existingData,
                  me: {
                    ...existingData.me,
                    students: updatedStudents
                  }
                }
              });
            }
          } catch (error) {
            console.log('Could not update QUERY_ME cache:', error);
          }

          // Update the cache for the student's view (QUERY_USER)
          try {
            const existingUserData = cache.readQuery({ 
              query: QUERY_USER, 
              variables: { identifier: selectedStudent.username, isUsername: true } 
            });
            if (existingUserData?.user) {
              cache.writeQuery({
                query: QUERY_USER,
                variables: { identifier: selectedStudent.username, isUsername: true },
                data: {
                  ...existingUserData,
                  user: {
                    ...existingUserData.user,
                    breakSettings: data.updateBreakSettings.breakSettings
                  }
                }
              });
            }
          } catch (error) {
            console.log('Could not update QUERY_USER cache:', error);
          }
        }
      });
      message.success('Break settings saved successfully!');
    } catch (error) {
      console.error("Failed to save break settings:", error);
      console.error("Error details:", error.graphQLErrors, error.networkError);
      message.error('Failed to save break settings.');
    }
  };

  return (
    <Layout className="dashboard-layout">
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

            {/* Main Action Buttons */}
            <div className="main-action-buttons" style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '24px',
              width: '100%'
            }}>
              <Button 
                type={activeSection === 'analyze' ? 'primary' : 'default'}
                size="large"
                style={{ flex: 1, height: '60px', fontSize: '16px' }}
                onClick={() => {
                  setActiveSection('analyze');
                  // Refresh student data when switching to analyze section
                  if (selectedStudent?.username) {
                    setTimeout(() => {
                      refetchSelectedStudent();
                    }, 100);
                  }
                }}
              >
                Analyze Data
              </Button>
              <Button 
                type={activeSection === 'track' ? 'primary' : 'default'}
                size="large"
                style={{ flex: 1, height: '60px', fontSize: '16px' }}
                onClick={() => setActiveSection('track')}
              >
                Track Data
              </Button>
              <Button 
                type={activeSection === 'studentView' ? 'primary' : 'default'}
                size="large"
                style={{ flex: 1, height: '60px', fontSize: '16px' }}
                onClick={() => setActiveSection('studentView')}
              >
                Student View
              </Button>
            </div>

            {/* Content Sections */}
            {activeSection === 'analyze' && (
              <div className="analyze-section">
                <h3>Data Analysis & Management</h3>
                <p>View charts, analyze student behavior data, and manage accommodations, interventions, and data measures</p>
                
                <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
                  <TabPane tab="Accommodations" key="accommodations">
                    <div className="accommodations-content">
                      <div className="accommodations-header">
                        <h4>Current Accommodations</h4>
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
                          emptyText: (
                            <div style={{ textAlign: 'center', padding: '24px' }}>
                              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                                {selectedStudent.firstName} doesn't have any accommodations assigned.
                              </p>
                              <p style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
                                Please add an accommodation using the button above, or navigate to Admin Settings to add new accommodation templates.
                              </p>
                              <Button 
                                type="primary" 
                                onClick={() => navigate('/admin-settings')}
                                style={{ marginRight: '8px' }}
                              >
                                Go to Admin Settings
                              </Button>
                            </div>
                          )
                        }}
                      />
                    </div>
                  </TabPane>

                  <TabPane tab="Interventions" key="interventions">
                    <div className="interventions-content">
                      <div className="interventions-header">
                        <h4>Current Interventions</h4>
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
                        locale={{
                          emptyText: (
                            <div style={{ textAlign: 'center', padding: '24px' }}>
                              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                                {selectedStudent.firstName} doesn't have any interventions assigned.
                              </p>
                              <p style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
                                Please add an intervention using the button above, or navigate to Admin Settings to add new intervention templates.
                              </p>
                              <Button 
                                type="primary" 
                                onClick={() => navigate('/admin-settings')}
                                style={{ marginRight: '8px' }}
                              >
                                Go to Admin Settings
                              </Button>
                            </div>
                          )
                        }}
                      />
                    </div>
                  </TabPane>

                  <TabPane tab="Data Measures" key="dataMeasures">
                    <div className="data-measures-content">
                      <div className="data-measures-header">
                        <h4>Current Data Measures</h4>
                        <Button type="primary" onClick={() => setShowAddDataMeasure(true)}>
                          Add Data Measure
                        </Button>
                      </div>
                      <StudentDataMeasuresTable
                        student={selectedStudentData?.user || selectedStudent}
                        onViewChart={(record) => {
                          // Switch to charts section and select the behavior
                          const behaviorType = record.type;
                          const behaviorId = record._id;
                          setSelectedBehavior([{ type: behaviorType, id: behaviorId }]);
                          
                          // Refetch student data to ensure we have the latest duration/frequency data
                          if (selectedStudent?.username) {
                            refetchSelectedStudent();
                          }
                          
                          // Scroll to charts section
                          document.getElementById('charts-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        onRemoveDataMeasure={(record) => {
                          // Handle data measure removal - trigger refetch
                          refetchMe();
                          // Also refetch the selected student data if available
                          if (selectedStudent?.username) {
                            refetchSelectedStudent();
                          }
                          // Force a small delay to ensure the mutation completes
                          setTimeout(() => {
                            refetchMe();
                            if (selectedStudent?.username) {
                              refetchSelectedStudent();
                            }
                            // Trigger refetch in tracking components
                            setRefetchTrigger(prev => prev + 1);
                          }, 100);
                        }}
                      />
                    </div>
                  </TabPane>

                  {studentHasBreaksFeature && (
                    <TabPane tab="Breaks" key="breaks">
                      <div className="breaks-config-section">
                        <h4>Configure Break Settings</h4>
                        <p>Set the rules for when and how {selectedStudent?.firstName} can take breaks.</p>
                        <Form layout="vertical" style={{ marginTop: 24 }}>
                          <Form.Item label="Break Duration (minutes)">
                            <InputNumber
                              min={1}
                              max={60}
                              value={breakSettings.duration}
                              onChange={(value) => setBreakSettings(prev => ({ ...prev, duration: value }))}
                            />
                          </Form.Item>
                          <Form.Item label="Daily Break Limit">
                            <Radio.Group
                              value={isUnlimitedBreaks}
                              onChange={(e) => setIsUnlimitedBreaks(e.target.value)}
                            >
                              <Radio value={true}>Unlimited</Radio>
                              <Radio value={false}>Limited</Radio>
                            </Radio.Group>
                            {!isUnlimitedBreaks && (
                              <InputNumber
                                min={1}
                                max={10}
                                value={breakSettings.dailyLimit}
                                onChange={(value) => setBreakSettings(prev => ({ ...prev, dailyLimit: value }))}
                                style={{ marginLeft: 16 }}
                              />
                            )}
                          </Form.Item>
                          <Form.Item label="Enable Delay Between Breaks">
                            <Switch
                              checked={breakSettings.hasDelay}
                              onChange={(checked) => setBreakSettings(prev => ({ ...prev, hasDelay: checked }))}
                            />
                          </Form.Item>
                          {breakSettings.hasDelay && (
                            <Form.Item label="Delay Duration (minutes)">
                              <InputNumber
                                min={1}
                                max={120}
                                value={breakSettings.delayDuration}
                                onChange={(value) => setBreakSettings(prev => ({ ...prev, delayDuration: value }))}
                              />
                            </Form.Item>
                          )}
                          <Form.Item>
                            <Button type="primary" onClick={handleSaveBreakSettings}>
                              Save Break Settings
                            </Button>
                          </Form.Item>
                        </Form>
                      </div>
                    </TabPane>
                  )}
                </Tabs>

                {/* Charts Section - Only show if student has data measures */}
                {getBehaviors().length > 0 && (
                  <div id="charts-section" className="charts-section" style={{ marginTop: 24 }}>
                    <div className="charts-header">
                      <h3>Data Charts</h3>
                      <div className="behavior-selector">
                        <Select 
                          mode="multiple"
                          placeholder="Select behaviors to view charts" 
                          style={{ width: 300 }}
                          onChange={handleBehaviorChange}
                          value={selectedBehavior ? selectedBehavior.map(b => `${b.type}-${b.id}`) : undefined}
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
                    
                    {selectedBehavior && selectedBehavior.length > 0 && (
                      <div className="charts-display" style={{ marginTop: 16 }}>
                        {renderBehaviorChart()}
                      </div>
                    )}
                    
                    {(!selectedBehavior || selectedBehavior.length === 0) && (
                      <div className="charts-placeholder" style={{ 
                        textAlign: 'center', 
                        padding: 40, 
                        color: '#666',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 8
                      }}>
                        <p>Select behaviors from the dropdown above to view their charts</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'track' && (
              <div className="track-data-section">
                <div className="track-data-header">
                  <h3>Data Tracking</h3>
                  <p>Track frequency and duration data for {selectedStudent.firstName}</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <h4>Frequency Tracking</h4>
                    <Frequency 
                      studentId={selectedStudent._id} 
                      key={`frequency-${selectedStudent._id}-${selectedStudentData?.user?.behaviorFrequencies?.length || 0}`}
                      refetchTrigger={refetchTrigger}
                    />
                  </div>
                  <div>
                    <h4>Duration Tracking</h4>
                    <DurationTimers 
                      studentId={selectedStudent._id}
                      key={`duration-${selectedStudent._id}-${selectedStudentData?.user?.behaviorDurations?.length || 0}`}
                      refetchTrigger={refetchTrigger}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'studentView' && (
              <div className="student-view-section">
                <div className="student-view-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>Student View Configuration</h3>
                      <p>Configure what {selectedStudent.firstName} will see on their student view</p>
                    </div>
                    <Button 
                      type="primary" 
                      onClick={handleSaveStudentViewConfig}
                      disabled={!selectedStudent}
                    >
                      Save Configuration
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                  {/* Configuration Panel */}
                  <div style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                    <h4>Available Options</h4>
                    
                    {/* Accommodations Section */}
                    <div style={{ marginBottom: '24px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #d9d9d9'
                      }}>
                        <div>
                          <h5 style={{ margin: 0 }}>Accommodations</h5>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                            Show all assigned accommodations
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={showAccommodations}
                          onChange={(e) => setShowAccommodations(e.target.checked)}
                          style={{ transform: 'scale(1.2)' }}
                        />
                      </div>
                    </div>

                    {/* Breaks Section - Only show if student has breaks feature */}
                    {studentHasBreaksFeature && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '12px',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          border: '1px solid #d9d9d9'
                        }}>
                          <div>
                            <h5 style={{ margin: 0 }}>Breaks</h5>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                              Enable break functionality for student
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={showBreaks}
                            onChange={(e) => setShowBreaks(e.target.checked)}
                            style={{ transform: 'scale(1.2)' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Charts Section */}
                    <div>
                      <h5>Individual Charts</h5>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                        Select specific behavior charts to show
                      </p>
                      
                      {getBehaviors().map(behavior => (
                        <div key={`${behavior.type}-${behavior.id}`} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          border: '1px solid #d9d9d9',
                          marginBottom: '8px'
                        }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>{behavior.title}</span>
                            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                              ({behavior.type})
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedCharts.some(chart => 
                              chart.type === behavior.type && chart.id === behavior.id
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCharts([...selectedCharts, { type: behavior.type, id: behavior.id, title: behavior.title }]);
                              } else {
                                setSelectedCharts(selectedCharts.filter(chart => 
                                  !(chart.type === behavior.type && chart.id === behavior.id)
                                ));
                              }
                            }}
                            style={{ transform: 'scale(1.1)' }}
                          />
                        </div>
                      ))}
                      
                      {getBehaviors().length === 0 && (
                        <div style={{ 
                          padding: '16px', 
                          backgroundColor: 'white', 
                          borderRadius: '6px',
                          border: '1px dashed #d9d9d9',
                          textAlign: 'center',
                          color: '#666'
                        }}>
                          No data measures available. Add data measures first to configure charts.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student View Preview */}
                  <div style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
                    <h4>Student View Preview</h4>
                    <div style={{ 
                      backgroundColor: 'white', 
                      minHeight: '400px', 
                      padding: '20px',
                      borderRadius: '6px',
                      border: '1px solid #d9d9d9'
                    }}>
                      <StudentAccommodations
                        accommodations={selectedStudentData?.user?.accommodations}
                        behaviorFrequencies={selectedStudentData?.user?.behaviorFrequencies}
                        behaviorDurations={selectedStudentData?.user?.behaviorDurations}
                        studentViewConfig={{
                          showAccommodations,
                          selectedCharts
                        }}
                        breakSettings={showBreaks ? {
                          isEnabled: true,
                          duration: breakSettings.duration,
                          hasDelay: breakSettings.hasDelay,
                          delayDuration: breakSettings.delayDuration,
                          dailyLimit: isUnlimitedBreaks ? 0 : breakSettings.dailyLimit,
                        } : { isEnabled: false }}
                        previewMode={true}
                      />
                    </div>
                  </div>
                </div>
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
          disabled: !selectedBehaviorForIntervention || !selectedIntervention || getAvailableBehaviors().length === 0 || getAvailableInterventions().length === 0
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Behavior:
          </label>
          {getAvailableBehaviors().length > 0 ? (
            <Select
              placeholder="Select a behavior"
              style={{ width: '100%' }}
              value={selectedBehaviorForIntervention}
              onChange={setSelectedBehaviorForIntervention}
              options={getAvailableBehaviors()}
            />
          ) : (
            <div style={{ 
              padding: 16, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 6,
              textAlign: 'center',
              border: '1px dashed #d9d9d9'
            }}>
              <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                No behaviors available for this student.
              </p>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#999' }}>
                Please add data measures first, then you can assign interventions.
              </p>
              <Button 
                type="primary" 
                onClick={() => {
                  setShowAddIntervention(false); // Close the intervention modal
                  setActiveSection('analyze'); // Switch to analyze section (which contains the tabs)
                  setActiveTab('dataMeasures'); // Switch to Data Measures tab
                  // Use setTimeout to ensure the tab switch happens before opening the modal
                  setTimeout(() => {
                    setShowAddDataMeasure(true); // Open the data measure modal
                  }, 100);
                }}
                style={{ marginRight: 8 }}
              >
                Go to Data Measures
              </Button>
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Intervention:
          </label>
          {getAvailableInterventions().length > 0 ? (
            <Select
              placeholder="Select an intervention"
              style={{ width: '100%' }}
              value={selectedIntervention}
              onChange={setSelectedIntervention}
              disabled={!selectedBehaviorForIntervention}
              options={getAvailableInterventions()}
            />
          ) : (
            <div style={{ 
              padding: 16, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 6,
              textAlign: 'center',
              border: '1px dashed #d9d9d9'
            }}>
              <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                No more intervention templates available for this student.
              </p>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#999' }}>
                All intervention templates have been assigned to this student.
              </p>
              <Button 
                type="primary" 
                onClick={() => navigate('/admin-settings')}
              >
                Go to Admin Settings
              </Button>
            </div>
          )}
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
          disabled: !selectedAccommodation || getAvailableAccommodations().length === 0
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Accommodation:
          </label>
          {getAvailableAccommodations().length > 0 ? (
            <Select
              placeholder="Select an accommodation"
              style={{ width: '100%' }}
              value={selectedAccommodation}
              onChange={setSelectedAccommodation}
              options={getAvailableAccommodations()}
            />
          ) : (
            <div style={{ 
              padding: 16, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 6,
              textAlign: 'center',
              border: '1px dashed #d9d9d9'
            }}>
              <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                No more accommodation templates available for this student.
              </p>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#999' }}>
                All accommodation templates have been assigned to this student.
              </p>
              <Button 
                type="primary" 
                onClick={() => navigate('/admin-settings')}
              >
                Go to Admin Settings
              </Button>
            </div>
          )}
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

      {/* Add Data Measure Modal */}
      <Modal
        title="Add Data Measure"
        open={showAddDataMeasure}
        onOk={handleAddDataMeasure}
        onCancel={() => {
          setShowAddDataMeasure(false);
          setSelectedDataMeasure(null);
          setSelectedDataMeasureType(null);
        }}
        okText="Add Data Measure"
        cancelText="Cancel"
        okButtonProps={{ 
          disabled: !selectedDataMeasure || !selectedDataMeasureType || getAvailableDataMeasures().length === 0
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select Data Measure Type:
          </label>
          <Select
            placeholder="Select data measure type"
            style={{ width: '100%' }}
            value={selectedDataMeasureType}
            onChange={(value) => {
              setSelectedDataMeasureType(value);
              setSelectedDataMeasure(null); // Reset selection when type changes
            }}
            options={[
              { value: 'frequency', label: 'Frequency' },
              { value: 'duration', label: 'Duration' }
            ]}
          />
        </div>
        
        {selectedDataMeasureType && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Select {selectedDataMeasureType === 'frequency' ? 'Frequency' : 'Duration'} Behavior:
            </label>
            {getAvailableDataMeasures().length > 0 ? (
              <Select
                placeholder={`Select a ${selectedDataMeasureType} behavior`}
                style={{ width: '100%' }}
                value={selectedDataMeasure}
                onChange={setSelectedDataMeasure}
                options={getAvailableDataMeasures()}
              />
            ) : (
              <div style={{ 
                padding: 16, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 6,
                textAlign: 'center',
                border: '1px dashed #d9d9d9'
              }}>
                <p style={{ margin: '0 0 12px 0', color: '#666' }}>
                  No more {selectedDataMeasureType} templates available for this student.
                </p>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#999' }}>
                  All {selectedDataMeasureType} templates have been assigned to this student.
                </p>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/admin-settings')}
                >
                  Go to Admin Settings
                </Button>
              </div>
            )}
          </div>
        )}
        
        {selectedDataMeasure && (
          <div style={{ 
            padding: 12, 
            backgroundColor: '#f5f5f5', 
            borderRadius: 6,
            marginTop: 16 
          }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Data Measure Details:</h4>
            {(() => {
              let dataMeasure;
              
              if (selectedDataMeasureType === 'frequency') {
                dataMeasure = frequencyTemplates.find(f => f._id === selectedDataMeasure);
              } else if (selectedDataMeasureType === 'duration') {
                dataMeasure = durationTemplates.find(d => d._id === selectedDataMeasure);
              }
              
              return dataMeasure ? (
                <div>
                  <p><strong>Behavior Title:</strong> {dataMeasure.behaviorTitle}</p>
                  <p><strong>Operational Definition:</strong> {dataMeasure.operationalDefinition}</p>
                  <p><strong>Type:</strong> {selectedDataMeasureType === 'frequency' ? 'Frequency' : 'Duration'}</p>
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
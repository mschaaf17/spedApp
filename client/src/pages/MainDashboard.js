import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME, QUERY_STUDENT_LIST, QUERY_INTERVENTION_TEMPLATES, QUERY_ACCOMMODATION_TEMPLATES, QUERY_USER, QUERY_FREQUENCY_TEMPLATES, QUERY_DURATION_TEMPLATES, QUERY_CONTRACT_MEASURES } from '../utils/queries';
import { UPDATE_STUDENT_VIEW_CONFIG, UPDATE_BREAK_SETTINGS } from '../utils/mutations';
import NavSideBar from "../components/NavSideBar";
import MainTrackingView from './mainTrackingView';
import MainBottomNavBar from '../components/mainBottomNavBar';
import BreakConfigForm from '../components/DataTrackingMeasures/BreakConfigForm';
import MainConfigureStudentView from '../components/MainConfigureStudentView';
import MainAnalyzeDataHomePage from './MainAnalyzeDataHomePage';

export default function MainDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [section, setSection] = useState('tracking'); // default section

  // Student selection state
  const [selectedStudent, setSelectedStudent] = useState(location.state?.selectedStudent || null);
  
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
    pollInterval: 0, // Temporarily disable polling completely
    notifyOnNetworkStatusChange: true
  });

  // Queries for data measure templates
  const { loading: frequencyLoading, data: frequencyData } = useQuery(QUERY_FREQUENCY_TEMPLATES);
  const { loading: durationLoading, data: durationData } = useQuery(QUERY_DURATION_TEMPLATES);
  const { loading: contractLoading, data: contractData } = useQuery(QUERY_CONTRACT_MEASURES, {
    variables: { isActive: true }
  });

  // Mutations
  const [updateStudentViewConfig] = useMutation(UPDATE_STUDENT_VIEW_CONFIG);
  const [updateBreakSettings] = useMutation(UPDATE_BREAK_SETTINGS);

  const myStudents = meData?.me?.students || [];
  const getAllStudents = allStudentsData?.students || [];
  const allInterventions = interventionsData?.interventionList || [];
  const interventionTemplates = templateData?.interventionList || [];
  const allAccommodations = accommodationData?.accommodationList || [];
  const accommodationTemplates = accommodationTemplateData?.accommodationList || [];
  const loading = meLoading || allStudentsLoading || interventionsLoading || templateLoading || accommodationLoading || accommodationTemplateLoading || selectedStudentLoading || frequencyLoading || durationLoading || contractLoading;

  // Data measure templates
  const frequencyTemplates = frequencyData?.frequency?.filter(t => t.isTemplate) || [];
  const durationTemplates = durationData?.duration?.filter(t => t.isTemplate) || [];
  const contractTemplates = contractData?.contractMeasures || [];

  // Check if student has a "Break" accommodation or intervention
  const studentHasBreaksFeature = selectedStudentData?.user?.accommodations?.some(a => a.title.toLowerCase().includes('break')) ||
                                 selectedStudentData?.user?.interventions?.some(i => i.title.toLowerCase().includes('break'));

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
    
    // Add break charts if student has break settings enabled
    const breakCharts = [];
    if (studentData.breakSettings?.isEnabled) {
      // Add break frequency chart
      breakCharts.push({
        id: 'break-frequency',
        title: 'Break Frequency',
        type: 'break-frequency',
        data: {
          breakHistory: studentData.breakHistory || [],
          breakSettings: studentData.breakSettings
        }
      });
      
      // Add break duration chart
      breakCharts.push({
        id: 'break-duration',
        title: 'Break Duration',
        type: 'break-duration',
        data: {
          breakHistory: studentData.breakHistory || [],
          breakSettings: studentData.breakSettings
        }
      });
    }
    
    return [...durations, ...frequencies, ...breakCharts];
  };

  // Handle saving student view configuration
  const handleSaveStudentViewConfig = async () => {
    if (!selectedStudent) return;

    // Create a clean selectedCharts array without GraphQL-specific properties
    const cleanSelectedCharts = selectedCharts.map(chart => ({
      type: chart.type,
      id: chart.id, // Always use the id, even for break charts
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
            settings: settingsToSend
          }
        });
      }
      
      console.log('Student view configuration saved successfully');
    } catch (error) {
      console.error('Error saving student view configuration:', error);
      console.error('Error details:', error.graphQLErrors, error.networkError);
    }
  };

  // Load student view configuration when student changes
  useEffect(() => {
    if (selectedStudent?.studentViewConfig) {
      setShowAccommodations(selectedStudent.studentViewConfig.showAccommodations || false);
      setSelectedCharts(selectedStudent.studentViewConfig.selectedCharts || []);
    } else {
      setShowAccommodations(false);
      setSelectedCharts([]);
    }
    
    // Load break settings configuration
    if (selectedStudent?.breakSettings) {
      setBreakSettings(selectedStudent.breakSettings);
      setIsUnlimitedBreaks(selectedStudent.breakSettings.dailyLimit === 0);
      setShowBreaks(selectedStudent.breakSettings.isEnabled || false);
    } else {
      // Reset to defaults
      setBreakSettings({ isEnabled: false, duration: 5, hasDelay: false, delayDuration: 15, dailyLimit: 0 });
      setIsUnlimitedBreaks(true);
      setShowBreaks(false);
    }
  }, [selectedStudent]);

  // Handle break settings save
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
          settings: settingsToSend
        }
      });
      console.log('Break settings saved successfully!');
    } catch (error) {
      console.error("Failed to save break settings:", error);
      console.error("Error details:", error.graphQLErrors, error.networkError);
    }
  };

  if (!selectedStudent) {
    return (
      <div>
        <NavSideBar />
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5">No Student Selected</Typography>
          <Button variant="contained" onClick={() => navigate('/selectStudentToTrack')}>
            Select Student
          </Button>
        </Box>
      </div>
    );
  }

  return (
    <Box>
      <NavSideBar setSection={setSection} />
      <Box sx={{ pl: { xs: 0, md: '64px' }, pr: { xs: 0, md: '32px' }, pt: 3, maxWidth: '100vw' }}>
        {section === 'tracking' && <MainTrackingView />}
        {section === 'studentView' && (
          <MainConfigureStudentView
            selectedStudent={selectedStudent}
            selectedStudentData={selectedStudentData}
            showAccommodations={showAccommodations}
            setShowAccommodations={setShowAccommodations}
            showBreaks={showBreaks}
            setShowBreaks={setShowBreaks}
            getBehaviors={getBehaviors}
            selectedCharts={selectedCharts}
            setSelectedCharts={setSelectedCharts}
            breakSettings={breakSettings}
            isUnlimitedBreaks={isUnlimitedBreaks}
            handleSaveStudentViewConfig={handleSaveStudentViewConfig}
            studentHasBreaksFeature={studentHasBreaksFeature}
          />
        )}
        {section === 'breaks' && (
          <BreakConfigForm
            breakSettings={breakSettings}
            isUnlimitedBreaks={isUnlimitedBreaks}
            setBreakSettings={setBreakSettings}
            setIsUnlimitedBreaks={setIsUnlimitedBreaks}
            handleSaveBreakSettings={handleSaveBreakSettings}
            student={selectedStudent}
          />
        )}
        {section === 'analyzeData' && (
         <MainAnalyzeDataHomePage studentId={selectedStudent._id} />
        )}
      </Box>
    </Box>
  );
}
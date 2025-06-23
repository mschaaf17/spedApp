import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Select, Button, message } from 'antd';
import { QUERY_ME, QUERY_USER } from '../../../utils/queries';
import { TAKE_BREAK, END_BREAK } from '../../../utils/mutations';
import Auth from '../../../utils/auth';
import FrequencyCharts from '../../../components/DataTrackingMeasures/frequencyCharts';
import DurationCharts from '../../../components/DataTrackingMeasures/durationCharts';
import BreakTimer from '../BreakTimer/BreakTimer';
import './index.css';

const { Option } = Select;

const StudentAccommodations = ({
  accommodations: propAccommodations,
  behaviorFrequencies: propFrequencies,
  behaviorDurations: propDurations,
  studentViewConfig: propConfig,
  breakSettings: propBreakSettings,
  previewMode = false
}) => {
  const { username: userParam } = useParams();
  const [clickedImageId, setClickedImageId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedChart, setSelectedChart] = useState(null);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const [breakDuration, setBreakDuration] = useState(0);

  // Only fetch if not in preview mode and no props provided
  const shouldFetch = !previewMode && !propAccommodations && !propFrequencies && !propDurations && !propConfig && !propBreakSettings;
  const query = userParam ? QUERY_USER : QUERY_ME;
  const variables = userParam ? { identifier: userParam, isUsername: true } : {};
  const { loading, data, error, refetch } = useQuery(query, { variables, skip: !shouldFetch });

  const [takeBreak, { error: takeBreakError }] = useMutation(TAKE_BREAK);
  const [endBreak, { error: endBreakError }] = useMutation(END_BREAK);

  // Log any errors to the console
  useEffect(() => {
    if (error) {
      console.error('GraphQL Query Error:', error);
    }
    if (takeBreakError) {
        message.error(takeBreakError.message);
    }
    if (endBreakError) {
        message.error(endBreakError.message);
    }
  }, [error, takeBreakError, endBreakError]);

  // Use props if provided, otherwise use fetched data
  const user = shouldFetch ? (data?.me || data?.user || {}) : {};
  const accommodations = propAccommodations ?? user.accommodations ?? [];
  const behaviorFrequencies = propFrequencies ?? user.behaviorFrequencies ?? [];
  const behaviorDurations = propDurations ?? user.behaviorDurations ?? [];
  const studentViewConfig = propConfig ?? user.studentViewConfig ?? {};
  const breakSettings = propBreakSettings ?? user.breakSettings ?? {};

  // Calculate break count and remaining breaks
  const calculateBreakInfo = () => {
    const breakHistory = user.breakHistory || [];
    const today = new Date().toDateString();
    
    // Filter for today's breaks using the new structure
    const todayBreaks = breakHistory.filter(breakRecord => {
      let breakDate;
      if (typeof breakRecord === 'string') {
        // Legacy format - timestamp string
        breakDate = new Date(parseInt(breakRecord));
      } else if (breakRecord.startTime) {
        // New format - object with startTime
        breakDate = new Date(breakRecord.startTime);
      } else {
        // Fallback - assume it's a Date object
        breakDate = new Date(breakRecord);
      }
      return breakDate.toDateString() === today;
    });
    
    const todayCount = todayBreaks.length;
    const isUnlimited = breakSettings.dailyLimit === 0;
    const remaining = isUnlimited ? null : Math.max(0, breakSettings.dailyLimit - todayCount);
    
    return { todayCount, remaining, isUnlimited };
  };

  const { todayCount, remaining, isUnlimited } = calculateBreakInfo();

  // Set the default selected chart if charts are available
  useEffect(() => {
    if (studentViewConfig?.selectedCharts?.length > 0) {
      const firstChart = studentViewConfig.selectedCharts[0];
      setSelectedChart(`${firstChart.type}-${firstChart.id}`);
    } else {
      setSelectedChart(null); // Reset if no charts are available
    }
  }, [studentViewConfig]);

  if (!previewMode && Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/studentAccommodations" />;
  }

  if (!previewMode && loading) {
    return <div>Loading...</div>;
  }

  const handleTakeBreak = async () => {
    try {
        const studentId = user._id;
        if (!studentId) {
            message.error("Student ID not found.");
            return;
        }
      await takeBreak({ 
        variables: { studentId },
        update: (cache, { data }) => {
          // Update the cache for the student's view
          try {
            const existingData = cache.readQuery({ 
              query: QUERY_ME,
              variables: {}
            });
            if (existingData?.me) {
              cache.writeQuery({
                query: QUERY_ME,
                data: {
                  ...existingData,
                  me: {
                    ...existingData.me,
                    breakHistory: data.takeBreak.breakHistory
                  }
                }
              });
            }
          } catch (error) {
            console.log('Could not update QUERY_ME cache for break:', error);
          }

          // Also update QUERY_USER cache if using that query
          try {
            const existingUserData = cache.readQuery({ 
              query: QUERY_USER, 
              variables: { identifier: user.username, isUsername: true } 
            });
            if (existingUserData?.user) {
              cache.writeQuery({
                query: QUERY_USER,
                variables: { identifier: user.username, isUsername: true },
                data: {
                  ...existingUserData,
                  user: {
                    ...existingUserData.user,
                    breakHistory: data.takeBreak.breakHistory
                  }
                }
              });
            }
          } catch (error) {
            console.log('Could not update QUERY_USER cache for break:', error);
          }
        }
      });
      setBreakDuration(breakSettings.duration * 60); // convert minutes to seconds
      setIsBreakTime(true);
      // Refetch data to ensure break count is updated
      if (shouldFetch) {
        refetch();
      }
      message.success("Enjoy your break!");
    } catch (err) {
      // Error message is handled by the useEffect hook
    }
  };

  const handleEndBreak = async () => {
    try {
      const studentId = user._id;
      if (!studentId) {
        message.error("Student ID not found.");
        return;
      }
      
      await endBreak({ 
        variables: { studentId },
        update: (cache, { data }) => {
          // Update the cache for the student's view
          try {
            const existingData = cache.readQuery({ 
              query: QUERY_ME,
              variables: {}
            });
            if (existingData?.me) {
              cache.writeQuery({
                query: QUERY_ME,
                data: {
                  ...existingData,
                  me: {
                    ...existingData.me,
                    breakHistory: data.endBreak.breakHistory
                  }
                }
              });
            }
          } catch (error) {
            console.log('Could not update QUERY_ME cache for end break:', error);
          }

          // Also update QUERY_USER cache if using that query
          try {
            const existingUserData = cache.readQuery({ 
              query: QUERY_USER, 
              variables: { identifier: user.username, isUsername: true } 
            });
            if (existingUserData?.user) {
              cache.writeQuery({
                query: QUERY_USER,
                variables: { identifier: user.username, isUsername: true },
                data: {
                  ...existingUserData,
                  user: {
                    ...existingUserData.user,
                    breakHistory: data.endBreak.breakHistory
                  }
                }
              });
            }
          } catch (error) {
            console.log('Could not update QUERY_USER cache for end break:', error);
          }
        }
      });
      
      setIsBreakTime(false);
      // Refetch data to ensure break count is updated
      if (shouldFetch) {
        refetch();
      }
      message.success("Break ended!");
    } catch (err) {
      // Error message is handled by the useEffect hook
    }
  };

  const handleImageError = (accommodationId) => {
    setImageErrors(prev => ({
      ...prev,
      [accommodationId]: true
    }));
  };

  const renderSelectedChart = () => {
    if (!selectedChart) return null;
    const [type, id] = selectedChart.split('-');
    if (type === 'frequency') {
      const frequency = behaviorFrequencies?.find(f => f._id === id || f.id === id);
      if (frequency) {
        return (
          <div className="frequency-chart-container">
            <FrequencyCharts frequencies={[frequency]} interventions={[]} />
          </div>
        );
      }
    } else if (type === 'duration') {
      const duration = behaviorDurations?.find(d => d._id === id || d.id === id);
      if (duration) {
        return (
          <div className="duration-chart-container">
            <DurationCharts durations={[duration]} interventions={[]} />
          </div>
        );
      }
    }
    return null;
  };

  const hasVisibleCharts = studentViewConfig?.selectedCharts?.length > 0;
  
  return (
    <div className={`student-dashboard-container ${previewMode ? 'preview-mode' : ''}`}>
      {isBreakTime ? (
        <BreakTimer duration={breakDuration} onFinish={handleEndBreak} />
      ) : (
        <>
            <h2 className="dashboard-title">Welcome, {user.firstName || user.username || ''}</h2>

            {breakSettings?.isEnabled && (
                <div className="take-break-section">
                    <div className="break-info">
                        <Button type="primary" size="large" onClick={handleTakeBreak}>
                            Take a Break
                        </Button>
                        <div className="break-counter">
                            {isUnlimited ? (
                                <span>Today's breaks: {todayCount}</span>
                            ) : (
                                <span>Breaks remaining: {remaining}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={`main-content-grid ${hasVisibleCharts ? 'charts-visible' : 'no-charts'}`}>
                {/* Accommodations Section */}
                {studentViewConfig?.showAccommodations && (
                <div className="accommodations-section">
                    <h3 className="section-title">Your Accommodations</h3>
                    <div className="accommodations-grid">
                    {accommodations?.map(accommodation => {
                        const imagePath = accommodation.image?.startsWith('http')
                          ? accommodation.image
                          : (accommodation.image?.startsWith('/') ? accommodation.image : `/${accommodation.image}`);
                        return (
                          <div 
                            key={accommodation._id || accommodation.id}
                            className={`accommodation-card ${clickedImageId === (accommodation._id || accommodation.id) ? 'highlighted' : ''}`}
                            onClick={() => {
                              setClickedImageId(accommodation._id || accommodation.id);
                              setTimeout(() => setClickedImageId(null), 1000);
                            }}
                          >
                            {!imagePath || imageErrors[accommodation._id || accommodation.id] ? (
                              <div className="fallback-image">
                                <span>No Image</span>
                              </div>
                            ) : (
                              <img 
                                src={imagePath}
                                alt={accommodation.title}
                                onError={() => handleImageError(accommodation._id || accommodation.id)}
                              />
                            )}
                            <div className="accommodation-info">
                              <h4>{accommodation.title}</h4>
                              <p>{accommodation.description}</p>
                            </div>
                          </div>
                        );
                    })}
                    </div>
                </div>
                )}
                {/* Charts Section */}
                {hasVisibleCharts && (
                <div className="charts-section">
                    <h3 className="section-title">Your Progress</h3>
                    <Select
                    value={selectedChart}
                    style={{ width: '100%', marginBottom: '20px' }}
                    onChange={value => setSelectedChart(value)}
                    placeholder="Select a chart to view"
                    >
                    {studentViewConfig.selectedCharts.map(chart => (
                        <Option key={`${chart.type}-${chart.id}`} value={`${chart.type}-${chart.id}`}>
                        {chart.title} ({chart.type})
                        </Option>
                    ))}
                    </Select>
                    <div className="chart-display-area">
                    {renderSelectedChart()}
                    </div>
                </div>
                )}
            </div>
            {/* Message when nothing is configured to be shown */}
            {!studentViewConfig?.showAccommodations && !hasVisibleCharts && (
                <div className="empty-dashboard-message">
                <p>Your dashboard is not yet configured.</p>
                <p>Please contact your teacher for access to your accommodations and charts.</p>
                </div>
            )}
        </>
      )}
    </div>
  );
};

export default StudentAccommodations; 
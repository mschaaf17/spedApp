import React, { useState, useEffect } from 'react';
import { Button, Card, message, Space, Typography, Divider } from 'antd';
import { useMutation } from '@apollo/client';
import { TAKE_BREAK, END_BREAK } from '../../utils/mutations';
import { QUERY_USER, QUERY_ME } from '../../utils/queries';
import { PlayCircleOutlined, PauseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const BreakTracking = ({ student, breakSettings, breakHistory, refetchTrigger }) => {
  const [isBreakActive, setIsBreakActive] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [takeBreak] = useMutation(TAKE_BREAK);
  const [endBreak] = useMutation(END_BREAK);

  // Check if there's an active break
  useEffect(() => {
    if (breakHistory && breakHistory.length > 0) {
      const latestBreak = breakHistory[breakHistory.length - 1];
      if (latestBreak && !latestBreak.endTime) {
        setIsBreakActive(true);
        setBreakStartTime(new Date(latestBreak.startTime));
      } else {
        setIsBreakActive(false);
        setBreakStartTime(null);
      }
    } else {
      setIsBreakActive(false);
      setBreakStartTime(null);
    }
  }, [breakHistory]);

  // Timer for active break
  useEffect(() => {
    let interval;
    if (isBreakActive && breakStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now - breakStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreakActive, breakStartTime]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Check if break is over time
  const isBreakOverTime = () => {
    if (!breakSettings?.duration || !isBreakActive) return false;
    const breakDurationInSeconds = breakSettings.duration * 60;
    return elapsedTime > breakDurationInSeconds;
  };

  // Get the color for the timer display
  const getTimerColor = () => {
    if (isBreakOverTime()) {
      return '#ff4d4f'; // Red for overtime
    }
    return '#1890ff'; // Blue for normal
  };

  const handleStartBreak = async () => {
    try {
      await takeBreak({
        variables: { studentId: student._id },
        update: (cache, { data }) => {
          // Update the cache for the student's view (QUERY_USER)
          try {
            const existingUserData = cache.readQuery({ 
              query: QUERY_USER, 
              variables: { identifier: student.username, isUsername: true } 
            });
            if (existingUserData?.user) {
              cache.writeQuery({
                query: QUERY_USER,
                variables: { identifier: student.username, isUsername: true },
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

          // Also update QUERY_ME cache if the student is viewing their own dashboard
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
        },
        refetchQueries: [
          { query: QUERY_USER, variables: { identifier: student.username, isUsername: true } }
        ]
      });
      message.success('Break started!');
    } catch (error) {
      console.error('Error starting break:', error);
      message.error('Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    try {
      await endBreak({
        variables: { studentId: student._id },
        update: (cache, { data }) => {
          // Update the cache for the student's view (QUERY_USER)
          try {
            const existingUserData = cache.readQuery({ 
              query: QUERY_USER, 
              variables: { identifier: student.username, isUsername: true } 
            });
            if (existingUserData?.user) {
              cache.writeQuery({
                query: QUERY_USER,
                variables: { identifier: student.username, isUsername: true },
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

          // Also update QUERY_ME cache if the student is viewing their own dashboard
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
        },
        refetchQueries: [
          { query: QUERY_USER, variables: { identifier: student.username, isUsername: true } }
        ]
      });
      message.success('Break ended!');
    } catch (error) {
      console.error('Error ending break:', error);
      message.error('Failed to end break');
    }
  };

  // Check if student can take a break
  const canTakeBreak = () => {
    if (!breakSettings?.isEnabled) return false;
    
    // Check daily limit
    if (breakSettings.dailyLimit > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayBreaks = breakHistory?.filter(breakRecord => {
        const breakDate = new Date(breakRecord.startTime).toISOString().split('T')[0];
        return breakDate === today;
      }) || [];
      
      if (todayBreaks.length >= breakSettings.dailyLimit) {
        return false;
      }
    }
    
    return true;
  };

  const getBreakStatus = () => {
    if (!breakSettings?.isEnabled) {
      return { status: 'disabled', message: 'Breaks are not enabled for this student' };
    }
    
    if (isBreakActive) {
      return { status: 'active', message: 'Break in progress' };
    }
    
    if (!canTakeBreak()) {
      return { status: 'limit-reached', message: 'Daily break limit reached' };
    }
    
    return { status: 'available', message: 'Ready for break' };
  };

  const breakStatus = getBreakStatus();

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>Break Management</Title>
      
      {/* Break Settings Summary */}
      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>Break Settings</Title>
        <Space direction="vertical" size="small">
          <Text><strong>Duration:</strong> {breakSettings?.duration || 5} minutes</Text>
          <Text><strong>Daily Limit:</strong> {breakSettings?.dailyLimit === 0 ? 'Unlimited' : breakSettings?.dailyLimit || 0}</Text>
          <Text><strong>Delay Between Breaks:</strong> {breakSettings?.hasDelay ? `${breakSettings?.delayDuration || 15} minutes` : 'None'}</Text>
        </Space>
      </Card>

      {/* Break Controls */}
      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>Break Controls</Title>
        
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {isBreakActive ? (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '20px', color: getTimerColor() }}>
                <ClockCircleOutlined />
              </div>
              <Title level={2} style={{ color: getTimerColor() }}>
                {formatTime(elapsedTime)}
              </Title>
              <Text style={{ display: 'block', marginBottom: '20px', color: getTimerColor() }}>
                {isBreakOverTime() ? 'Break over time - continue until stopped' : 'Break in progress'}
              </Text>
              {isBreakOverTime() && (
                <div style={{ 
                  backgroundColor: '#fff2f0', 
                  border: '1px solid #ffccc7', 
                  borderRadius: '6px', 
                  padding: '8px 12px', 
                  marginBottom: '20px',
                  color: '#ff4d4f'
                }}>
                  ⚠️ Break has exceeded the configured duration of {breakSettings?.duration || 5} minutes
                </div>
              )}
              <Button 
                type="primary" 
                danger={isBreakOverTime()}
                size="large"
                icon={<PauseCircleOutlined />}
                onClick={handleEndBreak}
              >
                {isBreakOverTime() ? 'Stop Overdue Break' : 'End Break'}
              </Button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '48px', marginBottom: '20px', color: breakStatus.status === 'available' ? '#52c41a' : '#d9d9d9' }}>
                <PlayCircleOutlined />
              </div>
              <Text style={{ display: 'block', marginBottom: '20px', color: breakStatus.status === 'available' ? '#52c41a' : '#666' }}>
                {breakStatus.message}
              </Text>
              <Button 
                type="primary" 
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStartBreak}
                disabled={breakStatus.status !== 'available'}
              >
                Start Break
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Break History */}
      <Card>
        <Title level={4}>Today's Breaks</Title>
        {breakHistory && breakHistory.length > 0 ? (
          <div>
            {breakHistory
              .filter(breakRecord => {
                const breakDate = new Date(breakRecord.startTime).toISOString().split('T')[0];
                const today = new Date().toISOString().split('T')[0];
                return breakDate === today;
              })
              .map((breakRecord, index) => {
                const breakStartTime = new Date(breakRecord.startTime);
                const breakEndTime = breakRecord.endTime ? new Date(breakRecord.endTime) : null;
                const breakDurationInSeconds = breakRecord.duration ? breakRecord.duration * 60 : 0;
                const configuredDurationInSeconds = (breakSettings?.duration || 5) * 60;
                const isOverTime = breakEndTime && breakDurationInSeconds > configuredDurationInSeconds;
                
                return (
                  <div key={index} style={{ 
                    padding: '12px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px', 
                    marginBottom: '8px',
                    backgroundColor: breakRecord.endTime 
                      ? (isOverTime ? '#fff2f0' : '#f6ffed') 
                      : '#fff7e6'
                  }}>
                    <Space direction="vertical" size="small">
                      <Text>
                        <strong>Start:</strong> {breakStartTime.toLocaleTimeString()}
                      </Text>
                      {breakEndTime && (
                        <>
                          <Text>
                            <strong>End:</strong> {breakEndTime.toLocaleTimeString()}
                          </Text>
                          <Text style={{ color: isOverTime ? '#ff4d4f' : 'inherit' }}>
                            <strong>Duration:</strong> {breakRecord.duration ? `${breakRecord.duration.toFixed(1)} minutes` : 'Unknown'}
                            {isOverTime && (
                              <span style={{ color: '#ff4d4f', marginLeft: '8px' }}>
                                ⚠️ Over time limit
                              </span>
                            )}
                          </Text>
                        </>
                      )}
                      {!breakEndTime && (
                        <Text style={{ color: '#faad14' }}>
                          <strong>Status:</strong> Active
                        </Text>
                      )}
                    </Space>
                  </div>
                );
              })}
          </div>
        ) : (
          <Text type="secondary">No breaks taken today</Text>
        )}
      </Card>
    </div>
  );
};

export default BreakTracking; 
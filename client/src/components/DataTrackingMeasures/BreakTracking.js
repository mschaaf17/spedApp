import React, { useState, useEffect } from 'react';
import { Button, Card, message, Space, Typography, Divider } from 'antd';
import { useMutation } from '@apollo/client';
import { TAKE_BREAK, END_BREAK } from '../../utils/mutations';
import { QUERY_USER } from '../../utils/queries';
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

  const handleStartBreak = async () => {
    try {
      await takeBreak({
        variables: { studentId: student._id },
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
              <div style={{ fontSize: '48px', marginBottom: '20px', color: '#1890ff' }}>
                <ClockCircleOutlined />
              </div>
              <Title level={2} style={{ color: '#1890ff' }}>
                {formatTime(elapsedTime)}
              </Title>
              <Text style={{ display: 'block', marginBottom: '20px' }}>
                Break in progress
              </Text>
              <Button 
                type="primary" 
                danger 
                size="large"
                icon={<PauseCircleOutlined />}
                onClick={handleEndBreak}
              >
                End Break
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
              .map((breakRecord, index) => (
                <div key={index} style={{ 
                  padding: '12px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px', 
                  marginBottom: '8px',
                  backgroundColor: breakRecord.endTime ? '#f6ffed' : '#fff7e6'
                }}>
                  <Space direction="vertical" size="small">
                    <Text>
                      <strong>Start:</strong> {new Date(breakRecord.startTime).toLocaleTimeString()}
                    </Text>
                    {breakRecord.endTime && (
                      <>
                        <Text>
                          <strong>End:</strong> {new Date(breakRecord.endTime).toLocaleTimeString()}
                        </Text>
                        <Text>
                          <strong>Duration:</strong> {breakRecord.duration ? `${breakRecord.duration.toFixed(1)} minutes` : 'Unknown'}
                        </Text>
                      </>
                    )}
                    {!breakRecord.endTime && (
                      <Text style={{ color: '#faad14' }}>
                        <strong>Status:</strong> Active
                      </Text>
                    )}
                  </Space>
                </div>
              ))}
          </div>
        ) : (
          <Text type="secondary">No breaks taken today</Text>
        )}
      </Card>
    </div>
  );
};

export default BreakTracking; 
import React, { useState } from 'react';
import { Card, Typography, Select, Space, Statistic, Row, Col } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CalendarOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const AccommodationCharts = ({ accommodations = [], studentData }) => {
  const [chartType, setChartType] = useState('assignment');

  // Process accommodation data for charts
  const processAccommodationData = () => {
    if (!accommodations || accommodations.length === 0) return [];

    // Group accommodations by assignment date and last offered date
    const assignmentData = [];
    const lastOfferedData = [];
    
    accommodations.forEach(accommodation => {
      // Assignment data
      if (accommodation.createdAt) {
        try {
          let date;
          if (typeof accommodation.createdAt === 'string') {
            if (/^\d+$/.test(accommodation.createdAt)) {
              const timestamp = parseInt(accommodation.createdAt);
              date = new Date(timestamp);
            } else {
              date = new Date(accommodation.createdAt);
            }
          } else if (typeof accommodation.createdAt === 'number') {
            date = new Date(accommodation.createdAt);
          } else {
            date = new Date(accommodation.createdAt);
          }
          
          if (!isNaN(date.getTime())) {
            const dateString = date.toLocaleDateString();
            const existing = assignmentData.find(item => item.date === dateString);
            if (existing) {
              existing.count++;
            } else {
              assignmentData.push({ date: dateString, count: 1 });
            }
          }
        } catch (error) {
          console.log('Error parsing createdAt date for chart:', accommodation.createdAt, error);
        }
      }
      
      // Last offered data
      if (accommodation.lastOffered) {
        try {
          let date;
          
          // Handle different date formats
          if (typeof accommodation.lastOffered === 'string') {
            // If it's a timestamp string, convert to number first
            if (/^\d+$/.test(accommodation.lastOffered)) {
              const timestamp = parseInt(accommodation.lastOffered);
              date = new Date(timestamp);
            } else {
              date = new Date(accommodation.lastOffered);
            }
          } else if (typeof accommodation.lastOffered === 'number') {
            date = new Date(accommodation.lastOffered);
          } else {
            date = new Date(accommodation.lastOffered);
          }
          
          if (!isNaN(date.getTime())) {
            // If the date is in the future, treat it as "Today" for chart purposes
            const now = new Date();
            if (date > now) {
              date = now;
            }
            
            const dateString = date.toLocaleDateString();
            const existing = lastOfferedData.find(item => item.date === dateString);
            if (existing) {
              existing.count++;
            } else {
              lastOfferedData.push({ date: dateString, count: 1 });
            }
          }
        } catch (error) {
          console.log('Error parsing lastOffered date for chart:', accommodation.lastOffered, error);
        }
      }
    });

    return { assignmentData, lastOfferedData };
  };

  // Process accommodation distribution data
  const processDistributionData = () => {
    if (!accommodations || accommodations.length === 0) return [];

    const distribution = {};
    
    accommodations.forEach(accommodation => {
      const title = accommodation.title;
      if (!distribution[title]) {
        distribution[title] = 0;
      }
      distribution[title]++;
    });

    return Object.entries(distribution)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Process time distribution data
  const processTimeDistributionData = () => {
    if (!accommodations || accommodations.length === 0) return [];

    const timeDistribution = {};
    
    accommodations.forEach(accommodation => {
      if (accommodation.lastOffered) {
        try {
          let date;
          if (typeof accommodation.lastOffered === 'string') {
            if (/^\d+$/.test(accommodation.lastOffered)) {
              const timestamp = parseInt(accommodation.lastOffered);
              date = new Date(timestamp);
            } else {
              date = new Date(accommodation.lastOffered);
            }
          } else if (typeof accommodation.lastOffered === 'number') {
            date = new Date(accommodation.lastOffered);
          } else {
            date = new Date(accommodation.lastOffered);
          }
          
          if (!isNaN(date.getTime())) {
            const hour = date.getHours();
            const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
            timeDistribution[timeSlot] = (timeDistribution[timeSlot] || 0) + 1;
          }
        } catch (error) {
          console.log('Error parsing lastOffered date for time distribution:', accommodation.lastOffered, error);
        }
      }
    });

    return Object.entries(timeDistribution)
      .map(([timeSlot, count]) => ({ timeSlot, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalAccommodations = accommodations.length;
    const uniqueAccommodations = [...new Set(accommodations.map(acc => acc.title))].length;
    const accommodationsWithLastOffered = accommodations.filter(acc => acc.lastOffered).length;
    
    // Calculate average days since last offered with proper date parsing
    let averageDaysSinceLastOffered = 0;
    if (accommodationsWithLastOffered > 0) {
      const totalDays = accommodations.reduce((sum, acc) => {
        if (acc.lastOffered) {
          try {
            let date;
            
            // Handle different date formats
            if (typeof acc.lastOffered === 'string') {
              // If it's a timestamp string, convert to number first
              if (/^\d+$/.test(acc.lastOffered)) {
                const timestamp = parseInt(acc.lastOffered);
                date = new Date(timestamp);
              } else {
                date = new Date(acc.lastOffered);
              }
            } else if (typeof acc.lastOffered === 'number') {
              date = new Date(acc.lastOffered);
            } else {
              date = new Date(acc.lastOffered);
            }
            
            if (!isNaN(date.getTime())) {
              const daysSince = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
              
              // If the date is in the future, show 0 days (just offered)
              if (daysSince < 0) {
                return sum + 0;
              }
              
              return sum + daysSince;
            }
          } catch (error) {
            console.log('Error parsing lastOffered date:', acc.lastOffered, error);
          }
        }
        return sum;
      }, 0);
      
      averageDaysSinceLastOffered = totalDays / accommodationsWithLastOffered;
    }

    // Calculate most frequent time offered
    const timeFrequency = {};
    const timeDetails = {};
    
    accommodations.forEach(acc => {
      if (acc.lastOffered) {
        try {
          let date;
          if (typeof acc.lastOffered === 'string') {
            if (/^\d+$/.test(acc.lastOffered)) {
              const timestamp = parseInt(acc.lastOffered);
              date = new Date(timestamp);
            } else {
              date = new Date(acc.lastOffered);
            }
          } else if (typeof acc.lastOffered === 'number') {
            date = new Date(acc.lastOffered);
          } else {
            date = new Date(acc.lastOffered);
          }
          
          if (!isNaN(date.getTime())) {
            const hour = date.getHours();
            const minute = date.getMinutes();
            const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
            
            // Format the specific time
            const specificTime = date.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            });
            
            // Count by time slot for broad analysis
            timeFrequency[timeSlot] = (timeFrequency[timeSlot] || 0) + 1;
            
            // Store specific time details
            if (!timeDetails[timeSlot]) {
              timeDetails[timeSlot] = [];
            }
            timeDetails[timeSlot].push(specificTime);
          }
        } catch (error) {
          console.log('Error parsing lastOffered date for time analysis:', acc.lastOffered, error);
        }
      }
    });

    // Find the most frequent time slot and get the most common specific time within it
    let mostFrequentTime = 'No data';
    if (Object.keys(timeFrequency).length > 0) {
      const mostFrequentSlot = Object.entries(timeFrequency).reduce((a, b) => 
        timeFrequency[a[0]] > timeFrequency[b[0]] ? a : b
      )[0];
      
      // Find the most common specific time within that slot
      const specificTimesInSlot = timeDetails[mostFrequentSlot] || [];
      if (specificTimesInSlot.length > 0) {
        const timeCounts = {};
        specificTimesInSlot.forEach(time => {
          timeCounts[time] = (timeCounts[time] || 0) + 1;
        });
        
        const mostCommonTime = Object.entries(timeCounts).reduce((a, b) => 
          timeCounts[a[0]] > timeCounts[b[0]] ? a : b
        )[0];
        
        mostFrequentTime = mostCommonTime;
      }
    }

    return {
      totalAccommodations,
      uniqueAccommodations,
      accommodationsWithLastOffered,
      averageDaysSinceLastOffered,
      mostFrequentTime,
      mostFrequentTimeTeacher: null, // TODO: Implement when teacher offering is tracked
      mostFrequentTimeStudent: null  // TODO: Implement when student requesting is tracked
    };
  };

  const { assignmentData, lastOfferedData } = processAccommodationData();
  const distributionData = processDistributionData();
  const timeDistributionData = processTimeDistributionData();
  const stats = calculateStats();

  // Color palette for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

  const renderChart = () => {
    if (chartType === 'assignment') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={assignmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'lastOffered') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lastOfferedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'distribution') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [value, 'Times Assigned']}
              labelFormatter={(label) => `Accommodation: ${label}`}
            />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" name="Times Assigned" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'timeDistribution') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={timeDistributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timeSlot" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" name="Times Assigned" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };

  if (!accommodations || accommodations.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <UserOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Title level={4} type="secondary">No Accommodation Data</Title>
          <Text type="secondary">
            No accommodations have been assigned to this student yet.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={4}>Accommodation Analytics</Title>
          
          {/* Statistics Row */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Statistic
                title="Total Accommodations"
                value={stats.totalAccommodations}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Unique Types"
                value={stats.uniqueAccommodations}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Recently Offered"
                value={stats.accommodationsWithLastOffered}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Avg Days Since Offered"
                value={isNaN(stats.averageDaysSinceLastOffered) ? 0 : Math.round(stats.averageDaysSinceLastOffered)}
                suffix={stats.averageDaysSinceLastOffered === 0 ? " (just offered)" : " days"}
              />
            </Col>
          </Row>

          {/* Time Statistics Row */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Statistic
                title="Most Frequent Time (Overall)"
                value={stats.mostFrequentTime}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Most Frequent Time (Teacher Offered)"
                value={stats.mostFrequentTimeTeacher || "Not implemented"}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Most Frequent Time (Student Requested)"
                value={stats.mostFrequentTimeStudent || "Not implemented"}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
          
          <div style={{ marginBottom: 16 }}>
            <Select
              value={chartType}
              onChange={setChartType}
              style={{ width: 200 }}
            >
              <Option value="assignment">Assignment Trends</Option>
              <Option value="lastOffered">Last Offered Trends</Option>
              <Option value="distribution">Distribution</Option>
              <Option value="timeDistribution">Time Distribution</Option>
            </Select>
          </div>
        </div>

        {renderChart()}

        {chartType === 'distribution' && distributionData.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Accommodation Distribution (Pie Chart)</Title>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ title, percent }) => `${title} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, 'Times Assigned']}
                  labelFormatter={(label) => `Accommodation: ${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartType === 'timeDistribution' && timeDistributionData.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>Time Distribution (Pie Chart)</Title>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ timeSlot, percent }) => `${timeSlot} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#1890ff"
                  dataKey="count"
                >
                  {timeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, 'Times Offered']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            📊 Charts show accommodation assignment patterns and usage distribution
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default AccommodationCharts; 
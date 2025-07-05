import React, { useState } from 'react';
import { Card, Typography, Select, Space, Statistic, Row, Col, Tag } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CalendarOutlined, UserOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const InterventionCharts = ({ interventions = [], studentData }) => {
  const [chartType, setChartType] = useState('assignment');

  // Process intervention data for charts
  const processInterventionData = () => {
    if (!interventions || interventions.length === 0) return [];

    // Group interventions by assignment date
    const assignmentData = {};
    
    interventions.forEach(intervention => {
      if (intervention.createdAt) {
        try {
          let date;
          if (typeof intervention.createdAt === 'string') {
            if (/^\d+$/.test(intervention.createdAt)) {
              const timestamp = parseInt(intervention.createdAt);
              date = new Date(timestamp);
            } else {
              date = new Date(intervention.createdAt);
            }
          } else if (typeof intervention.createdAt === 'number') {
            date = new Date(intervention.createdAt);
          } else {
            date = new Date(intervention.createdAt);
          }
          
          if (!isNaN(date.getTime())) {
            const dateString = date.toLocaleDateString();
            if (!assignmentData[dateString]) {
              assignmentData[dateString] = 0;
            }
            assignmentData[dateString]++;
          }
        } catch (error) {
          console.log('Error parsing createdAt date for chart:', intervention.createdAt, error);
        }
      }
    });

    return Object.entries(assignmentData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Process intervention distribution by function
  const processFunctionData = () => {
    if (!interventions || interventions.length === 0) return [];

    const functionData = {};
    
    interventions.forEach(intervention => {
      const functionType = intervention.function || 'Unknown';
      if (!functionData[functionType]) {
        functionData[functionType] = 0;
      }
      functionData[functionType]++;
    });

    return Object.entries(functionData)
      .map(([functionType, count]) => ({ functionType, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Process intervention distribution by behavior
  const processBehaviorData = () => {
    if (!interventions || interventions.length === 0) return [];

    const behaviorData = {};
    
    interventions.forEach(intervention => {
      const behaviorTitle = intervention.behaviorTitle || intervention.behaviorId?.behaviorTitle || 'Unknown';
      if (!behaviorData[behaviorTitle]) {
        behaviorData[behaviorTitle] = 0;
      }
      behaviorData[behaviorTitle]++;
    });

    return Object.entries(behaviorData)
      .map(([behaviorTitle, count]) => ({ behaviorTitle, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Calculate intervention statistics
  const calculateStats = () => {
    if (!interventions || interventions.length === 0) {
      return {
        totalInterventions: 0,
        uniqueBehaviors: 0,
        averageDuration: 0,
        activeInterventions: 0
      };
    }

    const totalInterventions = interventions.length;
    const allBehaviors = [];
    interventions.forEach(i => {
      // For contracts, behaviorTitle may be a comma-separated string
      let titles = [];
      if (i.behaviorTitle) {
        // Split by comma and trim
        titles = i.behaviorTitle.split(',').map(b => b.trim());
      } else if (i.behaviorId?.behaviorTitle) {
        titles = [i.behaviorId.behaviorTitle];
      }
      allBehaviors.push(...titles);
    });
    const uniqueBehaviors = new Set(allBehaviors.filter(Boolean)).size;
    
    // Calculate average duration (days since assignment) with proper date parsing
    const now = new Date();
    let totalDuration = 0;
    let validInterventions = 0;
    
    interventions.forEach(intervention => {
      if (intervention.createdAt) {
        try {
          let assignmentDate;
          // Handle different date formats
          if (typeof intervention.createdAt === 'string') {
            // If it's a timestamp string, convert to number first
            if (/^\d+$/.test(intervention.createdAt)) {
              const timestamp = parseInt(intervention.createdAt);
              assignmentDate = new Date(timestamp);
            } else {
              assignmentDate = new Date(intervention.createdAt);
            }
          } else if (typeof intervention.createdAt === 'number') {
            assignmentDate = new Date(intervention.createdAt);
          } else {
            assignmentDate = new Date(intervention.createdAt);
          }
          
          if (!isNaN(assignmentDate.getTime())) {
            const daysSinceAssignment = Math.floor((now - assignmentDate) / (1000 * 60 * 60 * 24));
            // If the date is in the future, treat as 0 days
            if (daysSinceAssignment < 0) {
              totalDuration += 0;
            } else {
              totalDuration += daysSinceAssignment;
            }
            validInterventions++;
          }
        } catch (error) {
          console.log('Error parsing createdAt date for intervention:', intervention.createdAt, error);
        }
      }
    });
    
    const averageDuration = validInterventions > 0 ? Math.round(totalDuration / validInterventions) : 0;
    
    // Count active interventions (assuming all are active unless specified otherwise)
    const activeInterventions = interventions.length;

    return {
      totalInterventions,
      uniqueBehaviors,
      averageDuration,
      activeInterventions
    };
  };

  const assignmentData = processInterventionData();
  const functionData = processFunctionData();
  const behaviorData = processBehaviorData();
  const stats = calculateStats();

  // Color palette for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

  if (!interventions || interventions.length === 0) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <UserOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <Title level={4} type="secondary">No Intervention Data</Title>
          <Text type="secondary">
            No interventions have been assigned to this student yet.
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>Intervention Analytics</Title>
        
        {/* Statistics Row */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="Total Interventions"
              value={stats.totalInterventions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Active Interventions"
              value={stats.activeInterventions}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Target Behaviors"
              value={stats.uniqueBehaviors}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Avg. Days Active"
              value={stats.averageDuration}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="days"
            />
          </Col>
        </Row>
        
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 200 }}
          >
            <Option value="assignment">Assignment Trends</Option>
            <Option value="function">Function Distribution</Option>
            <Option value="behavior">Behavior Distribution</Option>
          </Select>
        </Space>
      </div>

      {chartType === 'assignment' && assignmentData.length > 0 && (
        <div>
          <Title level={5}>Intervention Assignment Trends</Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={assignmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, 'Interventions Assigned']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                name="Interventions Assigned"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartType === 'function' && functionData.length > 0 && (
        <div>
          <Title level={5}>Intervention Function Distribution</Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={functionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="functionType" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, 'Interventions']}
                labelFormatter={(label) => `Function: ${label}`}
              />
              <Legend />
              <Bar dataKey="count" fill="#82ca9d" name="Interventions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartType === 'behavior' && behaviorData.length > 0 && (
        <div>
          <Title level={5}>Target Behavior Distribution</Title>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={behaviorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ behaviorTitle, percent }) => `${behaviorTitle} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {behaviorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, 'Interventions']}
                labelFormatter={(label) => `Behavior: ${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Intervention List Summary */}
      <div style={{ marginTop: 24 }}>
        <Title level={5}>Current Interventions Summary</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {interventions.map((intervention, index) => (
            <Tag 
              key={intervention._id || index}
              color={colors[index % colors.length]}
              style={{ marginBottom: 8 }}
            >
              {intervention.title} - {intervention.behaviorTitle || intervention.behaviorId?.behaviorTitle || 'Unknown Behavior'}
            </Tag>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          📊 Charts show intervention assignment patterns, function distribution, and target behavior analysis
        </Text>
      </div>
    </Card>
  );
};

export default InterventionCharts; 
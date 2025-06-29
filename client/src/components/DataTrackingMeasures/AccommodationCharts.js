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

    // Group accommodations by assignment date
    const assignmentData = {};
    
    accommodations.forEach(accommodation => {
      const date = new Date(accommodation.createdAt).toLocaleDateString();
      if (!assignmentData[date]) {
        assignmentData[date] = 0;
      }
      assignmentData[date]++;
    });

    return Object.entries(assignmentData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
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

  // Calculate accommodation statistics
  const calculateStats = () => {
    if (!accommodations || accommodations.length === 0) {
      return {
        totalAccommodations: 0,
        uniqueAccommodations: 0,
        averageDuration: 0
      };
    }

    const totalAccommodations = accommodations.length;
    const uniqueAccommodations = new Set(accommodations.map(a => a.title)).size;
    
    // Calculate average duration (days since assignment)
    const now = new Date();
    const totalDuration = accommodations.reduce((sum, accommodation) => {
      const assignmentDate = new Date(accommodation.createdAt);
      const daysSinceAssignment = Math.floor((now - assignmentDate) / (1000 * 60 * 60 * 24));
      return sum + daysSinceAssignment;
    }, 0);
    
    const averageDuration = Math.round(totalDuration / totalAccommodations);

    return {
      totalAccommodations,
      uniqueAccommodations,
      averageDuration
    };
  };

  const assignmentData = processAccommodationData();
  const distributionData = processDistributionData();
  const stats = calculateStats();

  // Color palette for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

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
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>Accommodation Analytics</Title>
        
        {/* Statistics Row */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Statistic
              title="Total Assignments"
              value={stats.totalAccommodations}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Unique Accommodations"
              value={stats.uniqueAccommodations}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Avg. Days Assigned"
              value={stats.averageDuration}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
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
            <Option value="distribution">Accommodation Distribution</Option>
          </Select>
        </Space>
      </div>

      {chartType === 'assignment' && assignmentData.length > 0 && (
        <div>
          <Title level={5}>Accommodation Assignment Trends</Title>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={assignmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, 'Accommodations Assigned']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                name="Accommodations Assigned"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartType === 'distribution' && distributionData.length > 0 && (
        <div>
          <Title level={5}>Accommodation Distribution</Title>
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
        </div>
      )}

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

      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          📊 Charts show accommodation assignment patterns and usage distribution
        </Text>
      </div>
    </Card>
  );
};

export default AccommodationCharts; 
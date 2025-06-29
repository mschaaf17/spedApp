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
        const date = new Date(accommodation.createdAt).toLocaleDateString();
        const existing = assignmentData.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          assignmentData.push({ date, count: 1 });
        }
      }
      
      // Last offered data
      if (accommodation.lastOffered) {
        const date = new Date(accommodation.lastOffered).toLocaleDateString();
        const existing = lastOfferedData.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          lastOfferedData.push({ date, count: 1 });
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

  // Calculate statistics
  const calculateStats = () => {
    const totalAccommodations = accommodations.length;
    const uniqueAccommodations = [...new Set(accommodations.map(acc => acc.title))].length;
    const accommodationsWithLastOffered = accommodations.filter(acc => acc.lastOffered).length;
    const averageDaysSinceLastOffered = accommodationsWithLastOffered > 0 
      ? accommodations.reduce((sum, acc) => {
          if (acc.lastOffered) {
            const daysSince = Math.floor((new Date() - new Date(acc.lastOffered)) / (1000 * 60 * 60 * 24));
            return sum + daysSince;
          }
          return sum;
        }, 0) / accommodationsWithLastOffered
      : 0;

    return {
      totalAccommodations,
      uniqueAccommodations,
      accommodationsWithLastOffered,
      averageDaysSinceLastOffered
    };
  };

  const { assignmentData, lastOfferedData } = processAccommodationData();
  const distributionData = processDistributionData();
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
            <Col span={6}>
              <Statistic
                title="Total Accommodations"
                value={stats.totalAccommodations}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Unique Types"
                value={stats.uniqueAccommodations}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Recently Offered"
                value={stats.accommodationsWithLastOffered}
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Avg Days Since Offered"
                value={Math.round(stats.averageDaysSinceLastOffered)}
                suffix="days"
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
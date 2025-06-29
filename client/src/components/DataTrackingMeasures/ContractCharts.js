import React from 'react';
import { Card, Typography, Select, Tooltip } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;

const ContractCharts = ({ contract }) => {
  const [selectedBehavior, setSelectedBehavior] = React.useState(null);
  const [chartType, setChartType] = React.useState('line');

  // Process contract data for charting
  const processChartData = () => {
    if (!contract || !contract.chart) return [];

    // Get all unique dates from the contract chart
    const dates = [...new Set(contract.chart.map(day => day.date))].sort();
    
    return dates.map(date => {
      const dayEntry = contract.chart.find(day => day.date === date);
      const dataPoint = { date: new Date(date).toLocaleDateString() };
      
      // For contracts, we need to handle the data differently
      // Each entry has a 'time' field (like "Monday", "Tuesday") and a 'value'
      // We'll create a data point for each time slot
      if (dayEntry?.entries) {
        dayEntry.entries.forEach(entry => {
          const timeKey = entry.time;
          if (timeKey && entry.value) {
            dataPoint[timeKey] = parseInt(entry.value) || 0;
            // Add note data for tooltip
            if (entry.note) {
              dataPoint[`${timeKey}_note`] = entry.note;
            }
          }
        });
      }
      
      return dataPoint;
    });
  };

  const chartData = processChartData();

  // Get all unique time slots from the data for charting
  const getTimeSlots = () => {
    const timeSlots = new Set();
    if (contract?.chart) {
      contract.chart.forEach(day => {
        day.entries?.forEach(entry => {
          if (entry.time) {
            timeSlots.add(entry.time);
          }
        });
      });
    }
    return Array.from(timeSlots).sort();
  };

  const timeSlots = getTimeSlots();

  // Get color for each time slot
  const getTimeSlotColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];
    return colors[index % colors.length];
  };

  // Custom tooltip component to show notes
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
          {payload.map((entry, index) => {
            const timeSlot = entry.dataKey;
            const note = chartData.find(data => data.date === label)?.[`${timeSlot}_note`];
            
            return (
              <div key={index} style={{ marginBottom: '4px' }}>
                <p style={{ 
                  margin: '0', 
                  color: entry.color,
                  fontWeight: 'bold'
                }}>
                  {`${timeSlot}: ${entry.value}`}
                </p>
                {note && (
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '12px', 
                    color: '#666',
                    fontStyle: 'italic',
                    maxWidth: '200px',
                    wordWrap: 'break-word'
                  }}>
                    📝 {note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Calculate total points and percentage for the contract
  const calculateContractStats = () => {
    if (!contract || !contract.chart) return { totalPoints: 0, maxPossiblePoints: 0, percentage: 0, completedDays: 0, totalDays: 0 };

    let totalPoints = 0;
    let completedDays = 0;
    let totalDays = 0;

    // Get all unique dates
    const dates = [...new Set(contract.chart.map(day => day.date))].sort();
    
    dates.forEach(date => {
      const dayEntry = contract.chart.find(day => day.date === date);
      if (dayEntry?.entries && dayEntry.entries.length > 0) {
        const dayPoints = dayEntry.entries.reduce((sum, entry) => {
          return sum + (parseInt(entry.value) || 0);
        }, 0);
        
        totalPoints += dayPoints;
        completedDays++;
      }
      totalDays++;
    });

    // Calculate max possible points based on contract type and times
    let maxPossiblePoints = 0;
    if (contract.type === 'weekly') {
      // For weekly contracts, count the number of days (Monday-Friday)
      const weekDays = contract.times.filter(time => 
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time)
      );
      maxPossiblePoints = weekDays.length * completedDays * (contract.measureType === 'smileys' ? 3 : 5);
    } else {
      // For daily contracts, count the number of time slots per day
      const timeSlots = contract.times.filter(Boolean);
      maxPossiblePoints = timeSlots.length * completedDays * (contract.measureType === 'smileys' ? 3 : 5);
    }

    const percentage = maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;

    return {
      totalPoints,
      maxPossiblePoints,
      percentage,
      completedDays,
      totalDays
    };
  };

  const contractStats = calculateContractStats();

  if (!contract) {
    return (
      <Card>
        <Text>No contract selected for charting.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>Contract Progress Chart</Title>
        
        {/* Contract Stats Display */}
        {contractStats.completedDays > 0 && (
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #dee2e6', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {contractStats.totalPoints}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Total Points
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {contractStats.percentage}%
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Success Rate
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {contractStats.completedDays}/{contractStats.totalDays}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Days Completed
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {contractStats.maxPossiblePoints}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Max Possible
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
              <div style={{ 
                background: '#e9ecef', 
                borderRadius: '10px', 
                height: '8px', 
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: `linear-gradient(90deg, ${
                    contractStats.percentage >= 80 ? '#52c41a' : 
                    contractStats.percentage >= 60 ? '#fa8c16' : '#ff4d4f'
                  } 0%, ${
                    contractStats.percentage >= 80 ? '#73d13d' : 
                    contractStats.percentage >= 60 ? '#ffa940' : '#ff7875'
                  } 100%)`,
                  height: '100%',
                  width: `${contractStats.percentage}%`,
                  borderRadius: '10px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginTop: '4px',
                textAlign: 'center'
              }}>
                {contractStats.percentage >= 80 ? 'Excellent Progress!' :
                 contractStats.percentage >= 60 ? 'Good Progress' :
                 contractStats.percentage >= 40 ? 'Needs Improvement' : 'Requires Attention'}
              </div>
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Select
            placeholder="Select time slot to highlight"
            style={{ width: 200 }}
            allowClear
            value={selectedBehavior}
            onChange={setSelectedBehavior}
          >
            {timeSlots.map(timeSlot => (
              <Option key={timeSlot} value={timeSlot}>
                {timeSlot}
              </Option>
            ))}
          </Select>
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 120 }}
          >
            <Option value="line">Line Chart</Option>
            <Option value="bar">Bar Chart</Option>
          </Select>
        </div>
      </div>

      {chartData.length > 0 && timeSlots.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, contract.measureType === 'smileys' ? 3 : 5]} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              {timeSlots.map((timeSlot, index) => (
                <Line
                  key={timeSlot}
                  type="monotone"
                  dataKey={timeSlot}
                  stroke={getTimeSlotColor(index)}
                  strokeWidth={selectedBehavior === timeSlot ? 3 : 2}
                  opacity={selectedBehavior && selectedBehavior !== timeSlot ? 0.3 : 1}
                  connectNulls={false}
                  dot={{
                    fill: getTimeSlotColor(index),
                    strokeWidth: 2,
                    r: 4,
                    // Add note indicator to dots
                    ...(chartData.some(data => data[`${timeSlot}_note`]) && {
                      fill: '#ff6b6b',
                      r: 6,
                      stroke: '#fff',
                      strokeWidth: 2
                    })
                  }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, contract.measureType === 'smileys' ? 3 : 5]} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              {timeSlots.map((timeSlot, index) => (
                <Bar
                  key={timeSlot}
                  dataKey={timeSlot}
                  fill={getTimeSlotColor(index)}
                  opacity={selectedBehavior && selectedBehavior !== timeSlot ? 0.3 : 1}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">No data available for charting yet.</Text>
          <br />
          <Text type="secondary">Start tracking contract entries to see progress charts.</Text>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          {contract.measureType === 'smileys' 
            ? 'Chart shows: 😞 (1), 😐 (2), 😊 (3)'
            : 'Chart shows: 1-5 scale'
          }
        </Text>
        <br />
        <Text type="secondary">
          📝 Data points with notes are highlighted with a red dot
        </Text>
      </div>
    </Card>
  );
};

export default ContractCharts; 
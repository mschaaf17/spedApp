import React from 'react';
import { Card, Typography, Select, Tooltip } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;

const smileyToNumber = (value) => {
  if (!value) return 0;
  const v = value.trim().toLowerCase();
  if (v === 'smiley' || v === '😊') return 3;
  if (v === 'neutral' || v === '😐') return 2;
  if (v === 'sad' || v === '😞') return 1;
  // fallback for numbers or other values
  const num = parseInt(v);
  return isNaN(num) ? 0 : num;
};

const ContractCharts = ({ contract }) => {
  const [selectedBehavior, setSelectedBehavior] = React.useState(null);
  const [chartType, setChartType] = React.useState('line');

  // Get all unique behaviors
  const getBehaviors = () => {
    const behaviors = new Set();
    if (contract?.rows) {
      contract.rows.forEach(row => behaviors.add(row));
    } else if (contract?.chart) {
      contract.chart.forEach(day => {
        day.entries?.forEach(entry => {
          if (entry.row) behaviors.add(entry.row);
        });
      });
    }
    return Array.from(behaviors);
  };
  const behaviors = getBehaviors();

  // Get all unique time slots
  const getTimeSlots = () => {
    const timeSlots = new Set();
    if (contract?.times) {
      contract.times.forEach(time => timeSlots.add(time));
    } else if (contract?.chart) {
      contract.chart.forEach(day => {
        day.entries?.forEach(entry => {
          if (entry.time) timeSlots.add(entry.time);
        });
      });
    }
    return Array.from(timeSlots).sort();
  };
  const timeSlots = getTimeSlots();

  // Process chart data for all behaviors (sum across all time slots per date)
  const processChartData = () => {
    if (!contract || !contract.chart) return [];
    const dates = [...new Set(contract.chart.map(day => day.date))].sort();
    return dates.map(date => {
      const dayEntry = contract.chart.find(day => day.date === date);
      const dataPoint = { date: new Date(date).toLocaleDateString() };
      if (dayEntry?.entries) {
        behaviors.forEach(behavior => {
          const entries = dayEntry.entries.filter(e => e.row === behavior);
          entries.forEach(e => {
            console.log('Behavior:', behavior, 'Raw value:', e.value);
          });
          const sum = entries.reduce((acc, e) => acc + smileyToNumber(e.value), 0);
          dataPoint[behavior] = sum;
          // If any entry for this behavior has a note, add it
          const noteEntry = dayEntry.entries.find(e => e.row === behavior && e.note);
          if (noteEntry) {
            dataPoint[`${behavior}_note`] = noteEntry.note;
          }
        });
      }
      return dataPoint;
    });
  };
  const chartData = processChartData();
  console.log('Contract chartData:', chartData);

  // Get color for each behavior/time combination
  const getSeriesColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#1890ff', '#fa8c16', '#b37feb'];
    return colors[index % colors.length];
  };

  // Custom tooltip for behaviors
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
            const behavior = entry.dataKey;
            const note = chartData.find(data => data.date === label)?.[`${behavior}_note`];
            return (
              <div key={index} style={{ marginBottom: '4px' }}>
                <p style={{
                  margin: '0',
                  color: entry.color,
                  fontWeight: 'bold'
                }}>
                  {`${behavior}: ${entry.value}`}
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
    const behaviors = contract.rows || [];
    const timeSlots = contract.times || [];
    const maxPointsPerSlot = contract.measureType === 'smileys' ? 3 : 5;
    const totalDays = contract.chart.length;

    contract.chart.forEach(dayEntry => {
      behaviors.forEach(behavior => {
        timeSlots.forEach(time => {
          // Find the entry for this behavior and time
          const entry = dayEntry.entries?.find(e => e.row === behavior && e.time === time);
          if (entry) {
            totalPoints += smileyToNumber(entry.value);
          }
        });
      });
    });

    const maxPossiblePoints = totalDays * behaviors.length * timeSlots.length * maxPointsPerSlot;
    const percentage = maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;

    return {
      totalPoints,
      maxPossiblePoints,
      percentage,
      completedDays: totalDays,
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
            placeholder="Highlight behavior (optional)"
            style={{ width: 220 }}
            allowClear
            value={selectedBehavior}
            onChange={setSelectedBehavior}
          >
            {behaviors.map(behavior => (
              <Option key={behavior} value={behavior}>
                {behavior}
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

      {chartData.length > 0 && behaviors.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, contract.measureType === 'smileys' ? 3 : 5 * timeSlots.length]} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              {behaviors.map((behavior, idx) => (
                <Line
                  key={behavior}
                  type="monotone"
                  dataKey={behavior}
                  stroke={getSeriesColor(idx)}
                  strokeWidth={selectedBehavior === behavior ? 3 : 2}
                  opacity={selectedBehavior && selectedBehavior !== behavior ? 0.3 : 1}
                  connectNulls={false}
                  dot={{
                    fill: getSeriesColor(idx),
                    strokeWidth: 2,
                    r: 4,
                    ...(chartData.some(data => data[`${behavior}_note`]) && {
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
              <YAxis domain={[0, contract.measureType === 'smileys' ? 3 : 5 * timeSlots.length]} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              {behaviors.map((behavior, idx) => (
                <Bar
                  key={behavior}
                  dataKey={behavior}
                  fill={getSeriesColor(idx)}
                  opacity={selectedBehavior && selectedBehavior !== behavior ? 0.3 : 1}
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
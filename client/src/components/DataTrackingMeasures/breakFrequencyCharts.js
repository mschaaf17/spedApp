import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import './breakFrequencyCharts.css';

const BreakFrequencyCharts = ({ breakHistory, breakSettings }) => {
  // Process break history to get daily counts
  const processBreakData = () => {
    if (!breakHistory || breakHistory.length === 0) {
      return [];
    }

    // Group breaks by date
    const dailyBreaks = {};
    
    breakHistory.forEach(breakRecord => {
      let breakDate;
      if (typeof breakRecord === 'string') {
        // Legacy format - timestamp string, convert to Date
        breakDate = new Date(parseInt(breakRecord));
      } else if (breakRecord.startTime) {
        // New format - object with startTime
        breakDate = new Date(breakRecord.startTime);
      } else {
        // Fallback - assume it's a Date object
        breakDate = new Date(breakRecord);
      }
      
      const dateKey = breakDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyBreaks[dateKey]) {
        dailyBreaks[dateKey] = 0;
      }
      dailyBreaks[dateKey]++;
    });

    // Convert to array format for chart
    const chartData = Object.entries(dailyBreaks).map(([date, count]) => ({
      date,
      breaks: count,
      formattedDate: new Date(date).toLocaleDateString()
    }));

    // Sort by date
    return chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = processBreakData();
  const dailyLimit = breakSettings?.dailyLimit || 0;
  const isUnlimited = dailyLimit === 0;

  if (chartData.length === 0) {
    return (
      <div className="break-frequency-chart-container">
        <h3>Break Frequency</h3>
        <p>No break data available yet.</p>
      </div>
    );
  }

  return (
    <div className="break-frequency-chart-container">
      <h3>Break Frequency</h3>
      <p>Number of breaks taken per day</p>
      
      <LineChart
        width={800}
        height={400}
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="formattedDate" 
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis 
          label={{ value: 'Number of Breaks', angle: -90, position: 'insideLeft' }}
          domain={[0, 'dataMax + 1']}
        />
        <Tooltip 
          formatter={(value, name) => [value, 'Breaks']}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="breaks" 
          stroke="#8884d8" 
          strokeWidth={3}
          dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8 }}
        />
        
        {/* Aim line for daily limit (only show if not unlimited) */}
        {!isUnlimited && dailyLimit > 0 && (
          <ReferenceLine 
            y={dailyLimit} 
            stroke="#ff7300" 
            strokeDasharray="5 5"
            label={{ value: `Daily Limit: ${dailyLimit}`, position: 'top' }}
          />
        )}
      </LineChart>
      
      <div className="chart-info">
        <p><strong>Total Breaks:</strong> {breakHistory?.length || 0}</p>
        <p><strong>Daily Limit:</strong> {isUnlimited ? 'Unlimited' : dailyLimit}</p>
        <p><strong>Average Breaks per Day:</strong> {
          chartData.length > 0 
            ? (chartData.reduce((sum, day) => sum + day.breaks, 0) / chartData.length).toFixed(1)
            : 0
        }</p>
      </div>
    </div>
  );
};

export default BreakFrequencyCharts; 
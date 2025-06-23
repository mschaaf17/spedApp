import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import './breakDurationCharts.css';

const BreakDurationCharts = ({ breakHistory, breakSettings }) => {
  // Process break history to get daily total durations
  const processBreakData = () => {
    if (!breakHistory || breakHistory.length === 0) {
      return [];
    }

    // Group breaks by date and calculate total duration
    const dailyBreaks = {};
    
    breakHistory.forEach(breakRecord => {
      let breakDate;
      let actualDuration = 0;
      
      if (typeof breakRecord === 'string') {
        // Legacy format - timestamp string, use configured duration as fallback
        breakDate = new Date(parseInt(breakRecord));
        actualDuration = breakSettings?.duration || 5; // Default 5 minutes
      } else if (breakRecord.startTime) {
        // New format - object with startTime, endTime, and duration
        breakDate = new Date(breakRecord.startTime);
        if (breakRecord.duration) {
          // Use actual recorded duration
          actualDuration = breakRecord.duration;
        } else if (breakRecord.endTime) {
          // Calculate duration from start and end times
          const startTime = new Date(breakRecord.startTime);
          const endTime = new Date(breakRecord.endTime);
          actualDuration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Convert to minutes
        } else {
          // Break hasn't ended yet, use configured duration as estimate
          actualDuration = breakSettings?.duration || 5;
        }
      } else {
        // Fallback - assume it's a Date object
        breakDate = new Date(breakRecord);
        actualDuration = breakSettings?.duration || 5;
      }
      
      const dateKey = breakDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!dailyBreaks[dateKey]) {
        dailyBreaks[dateKey] = {
          count: 0,
          totalMinutes: 0
        };
      }
      dailyBreaks[dateKey].count++;
      dailyBreaks[dateKey].totalMinutes += actualDuration;
    });

    // Convert to array format for chart
    const chartData = Object.entries(dailyBreaks).map(([date, data]) => ({
      date,
      totalMinutes: Math.round(data.totalMinutes * 100) / 100, // Round to 2 decimal places
      count: data.count,
      formattedDate: new Date(date).toLocaleDateString(),
      formattedDuration: `${Math.round(data.totalMinutes * 100) / 100} min`
    }));

    // Sort by date
    return chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const chartData = processBreakData();
  const dailyLimit = breakSettings?.dailyLimit || 0;
  const isUnlimited = dailyLimit === 0;
  const breakDuration = breakSettings?.duration || 5;

  if (chartData.length === 0) {
    return (
      <div className="break-duration-chart-container">
        <h3>Break Duration</h3>
        <p>Total break time per day</p>
        <p>No break data available yet.</p>
      </div>
    );
  }

  // Calculate maximum possible daily duration for aim line
  const maxDailyDuration = isUnlimited ? 0 : dailyLimit * breakDuration;

  return (
    <div className="break-duration-chart-container">
      <h3>Break Duration</h3>
      <p>Total break time per day</p>
      
      <BarChart
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
          label={{ value: 'Total Minutes', angle: -90, position: 'insideLeft' }}
          domain={[0, 'dataMax + 10']}
        />
        <Tooltip 
          formatter={(value, name) => [
            `${value} minutes (${Math.floor(value / breakDuration)} breaks)`, 
            'Total Break Time'
          ]}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Legend />
        <Bar 
          dataKey="totalMinutes" 
          fill="#82ca9d" 
          radius={[4, 4, 0, 0]}
        />
        
        {/* Aim line for maximum daily duration (only show if not unlimited) */}
        {!isUnlimited && maxDailyDuration > 0 && (
          <ReferenceLine 
            y={maxDailyDuration} 
            stroke="#ff7300" 
            strokeDasharray="5 5"
            label={{ value: `Max Daily: ${maxDailyDuration} min`, position: 'top' }}
          />
        )}
      </BarChart>
      
      <div className="chart-info">
        <p><strong>Total Break Time:</strong> {chartData.reduce((sum, day) => sum + day.totalMinutes, 0).toFixed(1)} minutes</p>
        <p><strong>Total Breaks:</strong> {breakHistory?.length || 0}</p>
        <p><strong>Average Break Duration:</strong> {
          breakHistory?.length > 0 
            ? (chartData.reduce((sum, day) => sum + day.totalMinutes, 0) / breakHistory.length).toFixed(1)
            : 0
        } minutes per break</p>
        <p><strong>Configured Duration:</strong> {breakSettings?.duration || 5} minutes per break</p>
        <p><strong>Daily Limit:</strong> {isUnlimited ? 'Unlimited' : `${dailyLimit} breaks (${maxDailyDuration} min max)`}</p>
        <p><strong>Average Daily Break Time:</strong> {
          chartData.length > 0 
            ? (chartData.reduce((sum, day) => sum + day.totalMinutes, 0) / chartData.length).toFixed(1)
            : 0
        } minutes</p>
      </div>
    </div>
  );
};

export default BreakDurationCharts; 
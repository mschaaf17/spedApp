import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Select, Alert } from 'antd';
import { useQuery } from '@apollo/client';
import { QUERY_USER } from '../../utils/queries';

// Color palette for charts
const chartColors = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000',
  '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'
];

const DurationCharts = ({ durations = [] }) => {
  const { username: userParam } = useParams();

  // Defensive: if durations is undefined or not an array, treat as empty array
  const safeDurations = Array.isArray(durations) ? durations : [];

  // Set up selectedIds only after durations are loaded
  const [selectedIds, setSelectedIds] = useState(safeDurations.map(d => d._id));

  const { data: userData, loading: userLoading, error: userError } = useQuery(QUERY_USER, {
    variables: { identifier: userParam, isUsername: true }
  });

  if (!safeDurations.length) return <div>No duration data available for this student.</div>;

  // Filtered durations
  const filtered = safeDurations.filter(d => selectedIds.includes(d._id));

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  return (
    <div className='centerBody'>
      <div className='titleSection'>
        <h1 className="title">Viewing Duration Charts for {userParam}</h1>
      </div>

      <h3>Select behaviors to view</h3>
      <Select
        mode="multiple"
        value={selectedIds}
        onChange={setSelectedIds}
        style={{ width: 300, marginBottom: 16 }}
        options={safeDurations.map(d => ({ value: d._id, label: d.behaviorTitle }))}
      />
      
      {filtered.map(duration => {
        // Process timer data
        const timers = duration.timers || [];
        
        // 1. Calculate daily duration totals
        const dailyDurationMap = {};
        const startTimeCounts = {};
        const endTimeCounts = {};
        let totalDurationMinutes = 0;
        let completedSessions = 0;
        let todayDurationMinutes = 0;
        let lastStartTime = null;

        timers.forEach(timer => {
          // Only include saved timers (completed sessions)
          if (timer.startTime && timer.endTime && timer.status === 'saved') {
            // Convert string timestamps to Date objects
            const startTime = new Date(parseInt(timer.startTime));
            const endTime = new Date(parseInt(timer.endTime));
            
            // Skip invalid dates
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
              console.log('Invalid date found:', { startTime: timer.startTime, endTime: timer.endTime });
              return;
            }
            
            // Calculate duration in minutes
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationMinutes = Math.round(durationMs / (1000 * 60));
            
            // Skip negative durations (shouldn't happen but just in case)
            if (durationMinutes < 0) {
              console.log('Negative duration found:', durationMinutes);
              return;
            }
            
            // Daily duration
            const dateStr = startTime.toISOString().slice(0, 10);
            if (!dailyDurationMap[dateStr]) {
              dailyDurationMap[dateStr] = 0;
            }
            dailyDurationMap[dateStr] += durationMinutes;
            
            // Today's duration
            const today = new Date().toISOString().slice(0, 10);
            if (dateStr === today) {
              todayDurationMinutes += durationMinutes;
            }
            
            // Track last start time
            if (!lastStartTime || startTime > lastStartTime) {
              lastStartTime = startTime;
            }
            
            // Start time frequency
            const startHour = startTime.getHours();
            startTimeCounts[startHour] = (startTimeCounts[startHour] || 0) + 1;
            
            // End time frequency
            const endHour = endTime.getHours();
            endTimeCounts[endHour] = (endTimeCounts[endHour] || 0) + 1;
            
            totalDurationMinutes += durationMinutes;
            completedSessions++;
          }
        });

        // 2. Create bar chart data
        const barChartData = Object.entries(dailyDurationMap)
          .map(([date, minutes]) => ({
            date,
            minutes,
            hours: (minutes / 60).toFixed(2)
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        // 3. Find most frequent start and end times
        const mostFrequentStartHour = Object.entries(startTimeCounts)
          .sort((a, b) => b[1] - a[1])[0];
        const mostFrequentEndHour = Object.entries(endTimeCounts)
          .sort((a, b) => b[1] - a[1])[0];

        // 4. Create pie chart data (duration vs school hours)
        const schoolHoursMinutes = 6 * 60; // 6 hours = 360 minutes
        const pieChartData = [
          {
            name: 'Duration Time',
            value: totalDurationMinutes,
            color: '#8884d8'
          },
          {
            name: 'Remaining School Time',
            value: Math.max(0, schoolHoursMinutes - totalDurationMinutes),
            color: '#82ca9d'
          }
        ];

        // Calculate percentage of school day spent on behavior
        const percentageOfSchoolDay = ((totalDurationMinutes / schoolHoursMinutes) * 100).toFixed(1);

        // Format last start time
        const formatLastStartTime = (date) => {
          if (!date) return 'No sessions yet';
          return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        };

        return (
          <div key={duration._id} style={{ marginBottom: 32 }}>
            <h3>{duration.behaviorTitle}</h3>
            
            {/* Summary Stats */}
            <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
              <div><b>Total Duration:</b> {totalDurationMinutes} minutes ({totalDurationMinutes / 60} hours)</div>
              <div><b>Today's Duration:</b> {todayDurationMinutes} minutes ({todayDurationMinutes / 60} hours)</div>
              <div><b>Total Completed Sessions:</b> {completedSessions}</div>
              <div><b>Percentage of School Day:</b> {percentageOfSchoolDay}%</div>
              <div><b>Last Session Started:</b> {formatLastStartTime(lastStartTime)}</div>
              {mostFrequentStartHour && (
                <div><b>Most Frequent Start Time:</b> {formatHour(mostFrequentStartHour[0])} ({mostFrequentStartHour[1]} times)</div>
              )}
              {mostFrequentEndHour && (
                <div><b>Most Frequent End Time:</b> {formatHour(mostFrequentEndHour[0])} ({mostFrequentEndHour[1]} times)</div>
              )}
            </div>

            {/* Daily Duration Bar Chart */}
            {barChartData.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>Daily Duration (Minutes)</h4>
                <BarChart width={600} height={300} data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} minutes (${(value / 60).toFixed(2)} hours)`, 
                      'Duration'
                    ]}
                  />
                  <Bar dataKey="minutes" fill="#8884d8" />
                </BarChart>
              </div>
            )}

            {/* Duration vs School Hours Pie Chart */}
            {totalDurationMinutes > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>Duration vs School Hours (6 hours = 360 minutes)</h4>
                <PieChart width={400} height={300}>
                  <Pie
                    data={pieChartData}
                    cx={200}
                    cy={150}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [
                      `${value} minutes (${(value / 60).toFixed(2)} hours)`, 
                      name
                    ]}
                  />
                </PieChart>
              </div>
            )}

            {/* Start Time Distribution */}
            {Object.keys(startTimeCounts).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>Start Time Distribution</h4>
                <BarChart width={600} height={300} data={Object.entries(startTimeCounts).map(([hour, count]) => ({
                  hour: formatHour(hour),
                  count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </div>
            )}

            {/* End Time Distribution */}
            {Object.keys(endTimeCounts).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>End Time Distribution</h4>
                <BarChart width={600} height={300} data={Object.entries(endTimeCounts).map(([hour, count]) => ({
                  hour: formatHour(hour),
                  count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </div>
            )}

            {barChartData.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: '#666', backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                <h4>No Completed Timer Sessions</h4>
                <p>This behavior has no completed timer sessions yet. Start and stop timers, then click Save to see duration data.</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

function formatHour(hour) {
  const h = Number(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${ampm}`;
}

export default DurationCharts;
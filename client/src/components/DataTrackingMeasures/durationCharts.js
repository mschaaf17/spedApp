import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Scatter, Circle, BarChart, Bar, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import { Select, Alert } from 'antd';

// Color palette for charts
const chartColors = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000',
  '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'
];

function getInterventionColor(intervention) {
  if (!intervention) return '#8884d8'; // default
  const str = intervention._id ? intervention._id.toString() : '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return chartColors[Math.abs(hash) % chartColors.length];
}

const DurationCharts = ({ durations = [], interventions = [] }) => {
  const { username: userParam } = useParams();

  // Defensive: if durations is undefined or not an array, treat as empty array
  const safeDurations = Array.isArray(durations) ? durations : [];
  const safeInterventions = Array.isArray(interventions) ? interventions : [];

  // Set up selectedIds only after durations are loaded
  const [selectedIds, setSelectedIds] = useState(safeDurations.map(d => d._id));

  // Use interventions passed as props instead of making a separate query
  const userInterventions = safeInterventions;

  if (!safeDurations.length) return <div>No duration data available for this student.</div>;

  // Filtered durations
  const filtered = safeDurations.filter(d => selectedIds.includes(d._id));

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  return (
    <div className='duration-chart-wrapper'>
      
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
            
            // Calculate duration in seconds (more precise for short durations)
            const durationMs = endTime.getTime() - startTime.getTime();
            const durationSeconds = Math.round(durationMs / 1000);
            
            // Skip unrealistic durations (e.g., overnight timers, more than 8 hours)
            const maxReasonableDuration = 8 * 60 * 60; // 8 hours in seconds
            if (durationSeconds > maxReasonableDuration) {
              console.log(`Skipping unrealistic timer duration: ${durationSeconds} seconds (${durationSeconds/3600} hours) for timer ${timer.timerId}`);
              return;
            }
            
            // Skip negative durations (shouldn't happen but just in case)
            if (durationSeconds < 0) {
              console.log('Negative duration found:', durationSeconds);
              return;
            }
            
            // Daily duration (store in seconds)
            const dateStr = startTime.toISOString().slice(0, 10);
            if (!dailyDurationMap[dateStr]) {
              dailyDurationMap[dateStr] = 0;
            }
            dailyDurationMap[dateStr] += durationSeconds;
            
            // Today's duration (store in seconds)
            const today = new Date().toISOString().slice(0, 10);
            if (dateStr === today) {
              todayDurationMinutes += durationSeconds / 60; // Keep this in minutes for display
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
            
            totalDurationMinutes += durationSeconds / 60; // Keep this in minutes for display
            completedSessions++;
          }
        });

        // 2. Get assignment date (createdAt) and fill missing dates
        let startDateStr, endDateStr;
        if (duration.createdAt !== undefined && duration.createdAt !== null) {
          const d = new Date(Number(duration.createdAt));
          if (!isNaN(d.getTime())) {
            startDateStr = d.toISOString().slice(0, 10);
          }
        }
        
        // If no createdAt, use the earliest date from dailyDurationMap
        if (!startDateStr && Object.keys(dailyDurationMap).length > 0) {
          startDateStr = Object.keys(dailyDurationMap).sort()[0];
        }
        
        // Use today as end date
        endDateStr = todayStr;

        // 3. Fill in missing dates with 0 durations
        const filledChartData = fillMissingDatesWithZeros(dailyDurationMap, startDateStr, endDateStr);
        console.log('filledChartData:', filledChartData);
        console.log('dailyDurationMap:', dailyDurationMap);
        console.log('startDateStr:', startDateStr, 'endDateStr:', endDateStr);

        // Convert seconds to minutes for chart display, but keep small values visible
        const chartDataInMinutes = filledChartData.map(dataPoint => ({
          ...dataPoint,
          minutes: dataPoint.minutes > 0 ? dataPoint.minutes / 60 : 0 // Convert seconds to minutes
        }));

        // 4. Add intervention data to the filled chart data
        const chartDataWithInterventions = chartDataInMinutes.map(dataPoint => ({
          ...dataPoint,
          intervention: userInterventions.find(i => {
            if (!i.behaviorId || !i.createdAt) return false;
            let interventionDate;
            if (typeof i.createdAt === "number") {
              interventionDate = new Date(i.createdAt);
            } else if (typeof i.createdAt === "string") {
              if (/^\d+$/.test(i.createdAt)) {
                interventionDate = new Date(Number(i.createdAt));
              } else {
                interventionDate = new Date(i.createdAt);
              }
            } else {
              return false;
            }
            if (!interventionDate || isNaN(interventionDate.getTime())) return false;
            return i.behaviorId?._id === duration._id && interventionDate.toISOString().slice(0, 10) === dataPoint.date;
          })
        }));

        // 5. Calculate aimline for this duration
        const goalValue = 30; // 30 minutes goal (or get from user input/intervention)
        const targetDateStr = chartDataWithInterventions.length ? chartDataWithInterventions[chartDataWithInterventions.length - 1].date : undefined;
        let interventionStartDate = null;
        if (userInterventions.length > 0) {
          // Find the earliest intervention for this behavior
          const interventionsForThisBehavior = userInterventions.filter(i => i.behaviorId?._id === duration._id);
          if (interventionsForThisBehavior.length > 0) {
            // Sort by createdAt to get the earliest one
            const sortedInterventions = interventionsForThisBehavior.sort((a, b) => {
              const aDate = typeof a.createdAt === "number" ? a.createdAt : 
                           typeof a.createdAt === "string" && /^\d+$/.test(a.createdAt) ? Number(a.createdAt) : 
                           new Date(a.createdAt).getTime();
              const bDate = typeof b.createdAt === "number" ? b.createdAt : 
                           typeof b.createdAt === "string" && /^\d+$/.test(b.createdAt) ? Number(b.createdAt) : 
                           new Date(b.createdAt).getTime();
              return aDate - bDate;
            });
            
            const earliestIntervention = sortedInterventions[0];
            if (earliestIntervention && earliestIntervention.createdAt) {
              let d;
              if (typeof earliestIntervention.createdAt === "number") {
                d = new Date(earliestIntervention.createdAt);
              } else if (typeof earliestIntervention.createdAt === "string") {
                if (/^\d+$/.test(earliestIntervention.createdAt)) {
                  d = new Date(Number(earliestIntervention.createdAt));
                } else {
                  d = new Date(earliestIntervention.createdAt);
                }
              }
              if (d && !isNaN(d.getTime())) {
                interventionStartDate = d.toISOString().slice(0, 10);
              } else {
                // Defensive: skip or set to null if invalid
                interventionStartDate = null;
              }
            }
          }
        }
        const aimlinePoints = calculateAimline(chartDataWithInterventions, goalValue, targetDateStr, interventionStartDate, 3);
        console.log('aimlinePoints:', aimlinePoints);
        console.log('interventionStartDate:', interventionStartDate);

        // 5.5. Merge aimline data with chart data
        const chartDataWithAimline = chartDataWithInterventions.map((dataPoint, index) => {
          // Find the corresponding aimline point by date
          const aimlinePoint = aimlinePoints.find(ap => ap.date === dataPoint.date);
          
          // Determine bar color - if this is the intervention start date, use intervention color
          let barColor = '#8884d8'; // default purple
          if (dataPoint.intervention && userInterventions.filter(i => i.behaviorId?._id === duration._id).length > 0) {
            barColor = getInterventionColor(userInterventions.find(i => i.behaviorId?._id === duration._id));
          }
          
          return {
            ...dataPoint,
            aimline: aimlinePoint?.value || 0,
            key: `${duration._id}-${dataPoint.date}`,
            barColor: barColor
          };
        });
        console.log('chartDataWithAimline:', chartDataWithAimline);

        // Debug: Log the chart data to see if aimline values are present
        console.log('aimlinePoints:', aimlinePoints);

        // 6. Check for 3 consecutive points above aimline (duration getting worse)
        // Only check if there's an intervention assigned for this behavior
        let aboveCount = 0, notification = false;
        const assignedInterventionsForThisBehavior = userInterventions.filter(i => i.behaviorId?._id === duration._id);
        const hasIntervention = assignedInterventionsForThisBehavior.length > 0;
        
        if (hasIntervention) {
          // Get the most recent intervention date
          const mostRecentIntervention = assignedInterventionsForThisBehavior.sort((a, b) => {
            const aDate = typeof a.createdAt === "number" ? a.createdAt : 
                         typeof a.createdAt === "string" && /^\d+$/.test(a.createdAt) ? Number(a.createdAt) : 
                         new Date(a.createdAt).getTime();
            const bDate = typeof b.createdAt === "number" ? b.createdAt : 
                         typeof b.createdAt === "string" && /^\d+$/.test(b.createdAt) ? Number(b.createdAt) : 
                         new Date(b.createdAt).getTime();
            return bDate - aDate; // Sort descending to get most recent first
          })[0];
          
          let mostRecentInterventionDate = null;
          if (mostRecentIntervention && mostRecentIntervention.createdAt) {
            let d;
            if (typeof mostRecentIntervention.createdAt === "number") {
              d = new Date(mostRecentIntervention.createdAt);
            } else if (typeof mostRecentIntervention.createdAt === "string") {
              if (/^\d+$/.test(mostRecentIntervention.createdAt)) {
                d = new Date(Number(mostRecentIntervention.createdAt));
              } else {
                d = new Date(mostRecentIntervention.createdAt);
              }
            }
            if (d && !isNaN(d.getTime())) {
              mostRecentInterventionDate = d.toISOString().slice(0, 10);
            }
          }
          
          // Only check for consecutive days above aimline AFTER the most recent intervention
          if (mostRecentInterventionDate) {
            const dataAfterIntervention = chartDataWithAimline.filter(d => d.date >= mostRecentInterventionDate);
            
            for (let i = 0; i < dataAfterIntervention.length; i++) {
              const aimlineValueForDay = dataAfterIntervention[i].aimline;
              if (dataAfterIntervention[i].minutes > aimlineValueForDay) {
                aboveCount++;
                if (aboveCount === 3) {
                  notification = true;
                  break;
                }
              } else {
                aboveCount = 0;
              }
            }
          }
        }

        // 7. Find most frequent start and end times
        const mostFrequentStartHour = Object.entries(startTimeCounts)
          .sort((a, b) => b[1] - a[1])[0];
        const mostFrequentEndHour = Object.entries(endTimeCounts)
          .sort((a, b) => b[1] - a[1])[0];

        // 8. Create pie chart data (duration vs school hours)
        const schoolHoursMinutes = 6 * 60; // 6 hours = 360 minutes
        const pieChartData = [
          {
            name: 'Duration Time',
            value: totalDurationMinutes,
            color: '#8884d8',
            key: `${duration._id}-duration`
          },
          {
            name: 'Remaining School Time',
            value: Math.max(0, schoolHoursMinutes - totalDurationMinutes),
            color: '#82ca9d',
            key: `${duration._id}-remaining`
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

        // Debug logging for interventions
        console.log('All user interventions:', userInterventions);
        console.log('Duration ID:', duration._id);
        console.log('Duration ID type:', typeof duration._id);
        console.log('Assigned interventions for this behavior:', assignedInterventionsForThisBehavior);
        console.log('Intervention behavior IDs:', userInterventions.map(i => i.behaviorId?._id));
        console.log('Intervention behavior ID types:', userInterventions.map(i => typeof i.behaviorId?._id));
        console.log('Intervention behavior titles:', userInterventions.map(i => i.behaviorTitle));

        const interventionDateMap = {};
        assignedInterventionsForThisBehavior.forEach(intervention => {
          let d;
          if (typeof intervention.createdAt === "number") {
            d = new Date(intervention.createdAt);
          } else if (typeof intervention.createdAt === "string") {
            if (/^\d+$/.test(intervention.createdAt)) {
              d = new Date(Number(intervention.createdAt));
            } else {
              d = new Date(intervention.createdAt);
            }
          }
          if (d && !isNaN(d.getTime())) {
            const dateStr = d.getFullYear() + '-' +
              String(d.getMonth() + 1).padStart(2, '0') + '-' +
              String(d.getDate()).padStart(2, '0');
            interventionDateMap[dateStr] = intervention;
          }
        });

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

            {/* Intervention Alert */}
            {notification && (
              <Alert message="Change your intervention: 3 consecutive days above aimline" type="warning" showIcon style={{ marginBottom: 16 }} />
            )}

            {/* Daily Duration Bar Chart with Aimline */}
            {chartDataWithAimline.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>Daily Duration (Minutes) with Aimline</h4>
                <BarChart width={800} height={300} data={chartDataWithAimline} key={`duration-chart-${duration._id}`}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis 
                    domain={[0, dataMax => {
                      const maxValue = Math.max(dataMax, 1); // Ensure at least 1 minute is shown
                      return Math.max(maxValue, 60); // But don't go below 60 minutes for the scale
                    }]}
                    tickFormatter={(value) => {
                      if (value < 1) {
                        return `${Math.round(value * 60)}s`; // Show seconds for small values
                      }
                      return `${value}m`; // Show minutes for larger values
                    }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Duration') {
                        const seconds = Math.round(value * 60); // Convert back to seconds for precision
                        if (value < 1) {
                          return [`${seconds} seconds`, name];
                        } else {
                          return [`${value.toFixed(2)} minutes (${seconds} seconds)`, name];
                        }
                      }
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="minutes" name="Duration" key={`bar-${duration._id}`}>
                    {chartDataWithAimline.map((entry, index) => (
                      <Cell key={`cell-${duration._id}-${index}`} fill={entry.barColor} />
                    ))}
                  </Bar>
                  {/* Add aimline at goal value */}
                  <ReferenceLine
                    y={30}
                    stroke="red"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    label="Aimline (30 min)"
                  />
                </BarChart>
                
                {/* Show intervention date separately */}
                {assignedInterventionsForThisBehavior.length > 0 && (
                  <div style={{ marginTop: 10, fontSize: '14px', color: '#666' }}>
                    <p>
                      <span style={{ 
                        color: getInterventionColor(assignedInterventionsForThisBehavior[0]),
                        fontWeight: 'bold'
                      }}>
                        ●
                      </span> 
                      Intervention started: {assignedInterventionsForThisBehavior[0].title} on {
                        (() => {
                          const intervention = assignedInterventionsForThisBehavior[0];
                          let interventionDate;
                          if (typeof intervention.createdAt === "number") {
                            interventionDate = new Date(intervention.createdAt);
                          } else if (typeof intervention.createdAt === "string") {
                            if (/^\d+$/.test(intervention.createdAt)) {
                              interventionDate = new Date(Number(intervention.createdAt));
                            } else {
                              interventionDate = new Date(intervention.createdAt);
                            }
                          } else {
                            interventionDate = new Date(intervention.createdAt);
                          }
                          return interventionDate && !isNaN(interventionDate.getTime()) 
                            ? interventionDate.toLocaleDateString() 
                            : 'Unknown date';
                        })()
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Duration vs School Hours Pie Chart */}
            {totalDurationMinutes > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>Duration vs School Hours (6 hours = 360 minutes)</h4>
                <PieChart width={400} height={300} key={`pie-${duration._id}`}>
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
                      <Cell key={`cell-${duration._id}-${index}`} fill={entry.color} />
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
                <BarChart width={600} height={300} data={Object.entries(startTimeCounts).map(([hour, count], index) => ({
                  hour: formatHour(hour),
                  count,
                  key: `${duration._id}-start-${hour}`
                }))} key={`start-time-${duration._id}`}>
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
                <BarChart width={600} height={300} data={Object.entries(endTimeCounts).map(([hour, count], index) => ({
                  hour: formatHour(hour),
                  count,
                  key: `${duration._id}-end-${hour}`
                }))} key={`end-time-${duration._id}`}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ffc658" />
                </BarChart>
              </div>
            )}

            {/* Assigned Interventions */}
            <div>
              <h4>Assigned Interventions</h4>
              {assignedInterventionsForThisBehavior.length > 0 ? (
                <ul>
                  {assignedInterventionsForThisBehavior.map(intervention => (
                    <li key={intervention._id}>
                      <b style={{ color: getInterventionColor(intervention) }}>
                        {intervention.title}
                      </b>: {intervention.summary}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No interventions assigned to this behavior.</p>
              )}
            </div>

            {chartDataWithAimline.length === 0 && (
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

function calculateAimline(durationData, goalValue, targetDateStr, interventionStartDate, baselineDays = 3) {
  if (!durationData.length) return [];

  // Sort by date
  const sorted = [...durationData].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // If there's an intervention start date, filter data to only include points after that date
  let relevantData = sorted;
  if (interventionStartDate) {
    relevantData = sorted.filter(d => d.date >= interventionStartDate);
  }
  
  if (relevantData.length === 0) return [];

  // Get the highest value from the first N (baseline) days after intervention starts
  const baseline = relevantData.slice(0, baselineDays);
  const startValue = Math.max(...baseline.map(d => d.minutes));

  // Calculate aimline for each data point in the chart data
  const aimlinePoints = [];
  for (let i = 0; i < sorted.length; i++) {
    const currentDate = new Date(sorted[i].date);
    const startDate = new Date(relevantData[0].date);
    const daysFromStart = Math.round((currentDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Calculate aimline value for this day
    const aimlineValue = startValue + ((goalValue - startValue) / (relevantData.length - 1)) * daysFromStart;
    
    aimlinePoints.push({
      date: sorted[i].date,
      value: Math.max(0, aimlineValue), // Ensure non-negative
    });
  }
  
  return aimlinePoints;
}

function fillMissingDatesWithZeros(dailyDurationMap, startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) {
    console.warn('Missing start or end date:', startDateStr, endDateStr);
    // Fallback: return data points for dates that exist
    return Object.entries(dailyDurationMap).map(([date, minutes]) => ({
      date,
      minutes
    }));
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid start or end date:', start, end);
    // Fallback: return data points for dates that exist
    return Object.entries(dailyDurationMap).map(([date, minutes]) => ({
      date,
      minutes
    }));
  }

  const result = [];
  let current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      minutes: dailyDurationMap[dateStr] || 0
    });
    current.setDate(current.getDate() + 1);
  }
  
  console.log('fillMissingDatesWithZeros result:', result);
  return result;
}

function CustomDot(props) {
  const { cx, cy, payload, interventionDateMap } = props;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  if (payload.date <= todayStr) {
    const intervention = interventionDateMap[payload.date];
    if (intervention) {
      const interventionColor = getInterventionColor(intervention);
      return (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={10}
            stroke={interventionColor}
            strokeWidth={4}
            fill="none"
          />
          <circle
            cx={cx}
            cy={cy}
            r={5}
            stroke="black"
            strokeWidth={2}
            fill="black"
          />
        </>
      );
    }
    // Default black dot
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        stroke="black"
        strokeWidth={2}
        fill="black"
      />
    );
  }
  return null;
}

function formatHour(hour) {
  const h = Number(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${ampm}`;
}

export default DurationCharts;
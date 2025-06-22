import React, {useState, useEffect} from 'react'
// import MenuSideBar from '../../../components/MenuSideBar/MenuSideBar';
import { Link, useParams } from 'react-router-dom'
// import Duration from '../../../components/DataTrackingMeasures/duration'
// import ABC from '../../../components/DataTrackingMeasures/ABC'
// import Frequency from '../../../components/DataTrackingMeasures/frequency'
// import Observation from '../../../components/DataTrackingMeasures/observation'
// import Contracts from '../../../components/DataTrackingMeasures/Contracts'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Scatter, Circle } from 'recharts';
import { Select, Alert } from 'antd';

const data = [
  { name: 'Date', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Frequency', uv: 3000, pv: 1398, amt: 2210 },
  // more data
];

// Example color palette
const interventionColors = [
  '#e6194b', // red
  '#3cb44b', // green
  '#ffe119', // yellow
  '#4363d8', // blue
  '#f58231', // orange
  '#911eb4', // purple
  '#46f0f0', // cyan
  '#f032e6', // magenta
  '#bcf60c', // lime
  '#fabebe', // pink
];

function getInterventionColor(intervention) {
  if (!intervention) return '#8884d8'; // default
  const str = intervention._id ? intervention._id.toString() : '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return interventionColors[Math.abs(hash) % interventionColors.length];
}

// Student Charts for frequency, duration?? eloping/aggression/other?, observation form, abc data   
const FrequencyCharts = ({ frequencies = [], interventions = [], aimline }) => {
  const { username: userParam } = useParams();

  // Defensive: if frequencies is undefined or not an array, treat as empty array
  const safeFrequencies = Array.isArray(frequencies) ? frequencies : [];
  const safeInterventions = Array.isArray(interventions) ? interventions : [];

  // Set up selectedIds only after frequencies are loaded
  const [selectedIds, setSelectedIds] = useState(safeFrequencies.map(f => f._id));

  // Use interventions passed as props instead of making a separate query
  const userInterventions = safeInterventions;

  if (!safeFrequencies.length) return <div>Loading or no frequency data available.</div>;

  // Filtered frequencies
  const filtered = safeFrequencies.filter(f => selectedIds.includes(f._id));

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  return (
    <div className='centerBody'>
      <div className='titleSection'>
        <h1 className="title"> Viewing Charts for {userParam}</h1>
      </div>

      <h3>Select a behavior to view</h3>
      <Select
        mode="multiple"
        value={selectedIds}
        onChange={setSelectedIds}
        style={{ width: 300, marginBottom: 16 }}
        options={safeFrequencies.map(f => ({ value: f._id, label: f.behaviorTitle }))}
      />
      {filtered.map(freq => {
        // 1. Group and sum counts by date
        const dateCountMap = {};
        (freq.dailyCounts || []).forEach(dc => {
          let dateString = '';
          if (dc.date !== undefined && dc.date !== null && dc.date !== '') {
            let d;
            if (typeof dc.date === "number") {
              d = new Date(dc.date);
            } else if (typeof dc.date === "string") {
              // If it's a numeric string, treat as timestamp
              if (/^\d+$/.test(dc.date)) {
                d = new Date(Number(dc.date));
              } else {
                d = new Date(dc.date);
              }
            }
            console.log('dc.date:', dc.date, 'typeof:', typeof dc.date, 'parsed:', d, 'isNaN:', d && isNaN(d.getTime()));
            if (d && !isNaN(d.getTime())) {
              dateString = d.getUTCFullYear() + '-' +
              String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
              String(d.getUTCDate()).padStart(2, '0');
            }
          }
          if (!dateString) {
            console.warn('Skipping invalid date:', dc.date);
            return;
          }
          if (!dateCountMap[dateString]) {
            dateCountMap[dateString] = 0;
          }
          dateCountMap[dateString] += dc.count;
        });

        // 2. Find the date range for this frequency
        let startDateStr, endDateStr;
        if (freq.createdAt !== undefined && freq.createdAt !== null) {
          const d = new Date(Number(freq.createdAt));
          if (!isNaN(d.getTime())) {
            startDateStr = d.toISOString().slice(0, 10);
          }
        }
        
        // If no createdAt, use the earliest date from dailyCounts
        if (!startDateStr && Object.keys(dateCountMap).length > 0) {
          startDateStr = Object.keys(dateCountMap).sort()[0];
        }
        
        // Use the latest date from dailyCounts as end date, or today if no data
        if (Object.keys(dateCountMap).length > 0) {
          endDateStr = Object.keys(dateCountMap).sort().pop();
        } else {
          endDateStr = todayStr;
        }

        // 3. Fill in missing dates with 0 counts
        const filledChartData = fillMissingDatesWithZeros(dateCountMap, startDateStr, endDateStr);

        // 4. Add intervention data to the filled chart data
        const chartDataWithInterventions = filledChartData.map(dataPoint => ({
          ...dataPoint,
          intervention: safeInterventions.find(i =>
            i.frequencyId === freq._id &&
            i.startDate &&
            new Date(i.startDate).toISOString().slice(0, 10) === dataPoint.date
          )
        }));

        // Calculate aimline points for this frequency
        const goalValue = 1; // or get from user input/intervention
        const targetDateStr = chartDataWithInterventions.length ? chartDataWithInterventions[chartDataWithInterventions.length - 1].date : undefined;
        let interventionStartDate = null;
        if (userInterventions.length > 0) {
          const intervention = userInterventions.find(i => i.behaviorId?._id === freq._id);
          if (intervention && intervention.createdAt) {
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
              interventionStartDate = d.toISOString().slice(0, 10);
            }
          }
        }
        const aimlinePoints = calculateAimline(chartDataWithInterventions, goalValue, targetDateStr, interventionStartDate, 3);

        console.log('aimlinePoints:', aimlinePoints);

        // Check for 3 consecutive points above aimline (behavior getting worse)
        let aboveCount = 0, notification = false;
        const assignedInterventionsForThisBehavior = userInterventions.filter(i => i.behaviorId?._id === freq._id);
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
            const dataAfterIntervention = chartDataWithInterventions.filter(d => d.date >= mostRecentInterventionDate);
            
            for (let i = 0; i < dataAfterIntervention.length; i++) {
              const aimlineValueForDay = aimlinePoints.find(ap => ap.date === dataAfterIntervention[i].date)?.value ?? 0;
              if (dataAfterIntervention[i].count > aimlineValueForDay) {
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

        const validChartData = chartDataWithInterventions; // for debugging

        console.log('chartData:', chartDataWithInterventions);
        console.log('validChartData:', validChartData);
        

      

        const hourCount = {};
        (freq.dailyCounts || []).forEach(dc => {
          let d;
          if (typeof dc.date === "number" || (/^\d+$/.test(dc.date))) {
            d = new Date(Number(dc.date));
          } else if (typeof dc.date === "string") {
            d = new Date(dc.date);
          }
          if (d && !isNaN(d.getTime())) {
            const hour = d.getHours();
            hourCount[hour] = (hourCount[hour] || 0) + 1;
          }
        });
        const mostFrequentHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
        if (mostFrequentHour) {
          console.log('Most frequent hour:', formatHour(mostFrequentHour[0]), 'with', mostFrequentHour[1], 'occurrences');
        } else {
          console.log('No data for most frequent hour');
        }

        // Extend end date by 5 days for better chart visualization
        let extendedEndDateStr = endDateStr;
        if (endDateStr) {
          const end = new Date(endDateStr);
          end.setDate(end.getDate() + 5);
          extendedEndDateStr = end.toISOString().slice(0, 10);
        }

        // Use the filled chart data for the final chart
        const finalChartData = chartDataWithInterventions;

        console.log('finalChartData:', finalChartData);
        console.log('finalChartData for chart:', finalChartData);
        console.log('Types:', finalChartData.map(d => typeof d.count));

        // Use finalChartData for chart and aimline
        const aimlinePointsFilled = calculateAimline(finalChartData, goalValue, extendedEndDateStr, interventionStartDate, 3);

        console.log('Result from fillMissingDates:', finalChartData);

        const interventionDates = assignedInterventionsForThisBehavior.map(intervention => {
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
          return d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null;
        }).filter(Boolean);

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

        // Calculate total count from dailyCounts
        const totalCount = (freq.dailyCounts || []).reduce((sum, dc) => sum + (dc.count || 0), 0);

        return (
          <div key={freq._id} style={{ marginBottom: 32 }}>
            <h3>{freq.behaviorTitle}</h3>
            <div>
              <b>Total count:</b> {totalCount}
            </div>
            {mostFrequentHour && (
              <div>
                <b>Most frequent time:</b> {formatHour(mostFrequentHour[0])} ({mostFrequentHour[1]} times)
              </div>
            )}
            {notification && (
              <Alert message="Change your intervention: 3 consecutive days above aimline" type="warning" showIcon />
            )}
            <LineChart width={600} height={300} data={finalChartData}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, dataMax => Math.ceil(dataMax * 1.1)]} />
              <YAxis yAxisId="right" orientation="right" hide={true} />
              <Tooltip />
              
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                dot={props => (
                  <CustomDot
                    {...props}
                    interventionDateMap={interventionDateMap}
                  />
                )}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                data={aimlinePointsFilled}
                stroke="red"
                dot={false}
                name="Aimline"
                yAxisId="right"
              />
              {/* If you want to highlight intervention days, keep this: */}
              <Scatter data={finalChartData.filter(d => d.intervention)} fill={interventionDates.length > 0 ? getInterventionColor(assignedInterventionsForThisBehavior[0]) : '#8884d8'} />
            </LineChart>
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
          </div>
        );
      })}
      
    </div>
  );
};

function calculateAimline(frequencyData, goalValue, targetDateStr, interventionStartDate, baselineDays = 3) {
  if (!frequencyData.length) return [];

  // Sort by date
  const sorted = [...frequencyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // If there's an intervention start date, filter data to only include points after that date
  let relevantData = sorted;
  if (interventionStartDate) {
    relevantData = sorted.filter(d => d.date >= interventionStartDate);
  }
  
  if (relevantData.length === 0) return [];

  // Get the highest value from the first N (baseline) days after intervention starts
  const baseline = relevantData.slice(0, baselineDays);
  const startValue = Math.max(...baseline.map(d => d.count));

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

function formatHour(hour) {
  const h = Number(hour);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  
  return `${hour12}:00 ${ampm}`;
  
}

function fillMissingDates(chartData, startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) {
    console.warn('Missing start or end date:', startDateStr, endDateStr);
    return chartData; // fallback
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid start or end date:', start, end);
    return chartData; // fallback
  }

  const dateMap = {};
  chartData.forEach(d => { dateMap[d.date] = d.count; });

  const result = [];
  let current = new Date(start);
  while (current <= end) {
    if (isNaN(current.getTime())) {
      console.warn('Invalid current date in loop:', current);
      break; // Prevent infinite loop
    }
    const dateStr = current.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      count: dateMap[dateStr] || 0
    });
    current.setDate(current.getDate() + 1);
  }
  console.log('Result from fillMissingDates:', result);
  return result;
}

function fillMissingDatesWithZeros(dateCountMap, startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) {
    console.warn('Missing start or end date:', startDateStr, endDateStr);
    // Fallback: return data points for dates that exist
    return Object.entries(dateCountMap).map(([date, count]) => ({
      date,
      count
    }));
  }

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn('Invalid start or end date:', start, end);
    // Fallback: return data points for dates that exist
    return Object.entries(dateCountMap).map(([date, count]) => ({
      date,
      count
    }));
  }

  const result = [];
  let current = new Date(start);
  
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    result.push({
      date: dateStr,
      count: dateCountMap[dateStr] || 0
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

export default FrequencyCharts;

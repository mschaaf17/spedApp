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
import { useQuery } from '@apollo/client';
import { QUERY_USER } from '../../utils/queries';

const data = [
  { name: 'Date', uv: 4000, pv: 2400, amt: 2400 },
  { name: 'Frequency', uv: 3000, pv: 1398, amt: 2210 },
  // more data
];

// Student Charts for frequency, duration?? eloping/aggression/other?, observation form, abc data   
const FrequencyCharts = ({ frequencies = [], interventions = [], aimline }) => {
  const { username: userParam } = useParams();

  // Defensive: if frequencies is undefined or not an array, treat as empty array
  const safeFrequencies = Array.isArray(frequencies) ? frequencies : [];
  const safeInterventions = Array.isArray(interventions) ? interventions : [];

  // Set up selectedIds only after frequencies are loaded
  const [selectedIds, setSelectedIds] = useState(safeFrequencies.map(f => f._id));

  const { data: userData, loading: userLoading, error: userError } = useQuery(QUERY_USER, {
    variables: { identifier: userParam, isUsername: true }
  });

  if (!safeFrequencies.length) return <div>Loading or no frequency data available.</div>;

  // Filtered frequencies
  const filtered = safeFrequencies.filter(f => selectedIds.includes(f._id));

  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  const userInterventions = userData?.user?.interventions || [];

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

  // Hash function to pick a color based on intervention title or id
  function getInterventionColor(intervention) {
    if (!intervention) return '#8884d8'; // default
    const str = intervention.title || intervention._id || '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return interventionColors[Math.abs(hash) % interventionColors.length];
  }

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
              dateString = d.toISOString().slice(0, 10);
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

        // 2. Build chartData from the grouped/summed map
        const chartData = Object.entries(dateCountMap).map(([date, count]) => ({
          date,
          count,
          intervention: safeInterventions.find(i =>
            i.frequencyId === freq._id &&
            i.startDate &&
            new Date(i.startDate).toISOString().slice(0, 10) === date
          )
        }));

        // Calculate aimline points for this frequency
        const goalValue = 1; // or get from user input/intervention
        const targetDateStr = chartData.length ? chartData[chartData.length - 1].date : undefined;
        const interventionStartDate = "2024-06-10"; // or get from intervention data
        const aimlinePoints = calculateAimline(chartData, goalValue, targetDateStr, interventionStartDate);

        console.log('aimlinePoints:', aimlinePoints);

        // Check for 3 consecutive points below aimline (using the aimline value for each date)
        let belowCount = 0, notification = false;
        for (let i = 0; i < chartData.length; i++) {
          const aimlineValueForDay = aimlinePoints[i]?.value ?? 0;
          if (chartData[i].count < aimlineValueForDay) {
            belowCount++;
            if (belowCount === 3) {
              notification = true;
              break;
            }
          } else {
            belowCount = 0;
          }
        }

        const validChartData = chartData; // for debugging

        console.log('chartData:', chartData);
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

        let startDateStr;
        if (freq.createdAt !== undefined && freq.createdAt !== null) {
          // Accept both string and number
          const d = new Date(Number(freq.createdAt));
          if (!isNaN(d.getTime())) {
            startDateStr = d.toISOString().slice(0, 10);
          } else {
            console.warn('Invalid freq.createdAt:', freq.createdAt, freq);
            startDateStr = undefined;
          }
        } else {
          startDateStr = undefined;
        }

        const endDateStr = chartData.length ? chartData[chartData.length - 1].date : startDateStr;

        // Extend end date by 5 days
        let extendedEndDateStr = endDateStr;
        if (endDateStr) {
          const end = new Date(endDateStr);
          end.setDate(end.getDate() + 5);
          extendedEndDateStr = end.toISOString().slice(0, 10);
        }

        let filledChartData = chartData;
        if (
          startDateStr &&
          extendedEndDateStr &&
          !isNaN(new Date(startDateStr).getTime()) &&
          !isNaN(new Date(extendedEndDateStr).getTime())
        ) {
          console.log('Calling fillMissingDates with:', { startDateStr, extendedEndDateStr, chartData });
          filledChartData = fillMissingDates(chartData, startDateStr, extendedEndDateStr);
        }

        console.log('filledChartData:', filledChartData);
        console.log('filledChartData for chart:', filledChartData);
        console.log('Types:', filledChartData.map(d => typeof d.count));

        // Use filledChartData for chart and aimline
        const aimlinePointsFilled = calculateAimline(filledChartData, goalValue, extendedEndDateStr, startDateStr);

        console.log('Result from fillMissingDates:', filledChartData);

        const assignedInterventionsForThisBehavior = userInterventions.filter(
          i => i.behaviorId?._id === freq._id
        );
        let interventionDate = null;
        let interventionColor = '#8884d8'; // default
        if (assignedInterventionsForThisBehavior.length > 0) {
          const intervention = assignedInterventionsForThisBehavior[0];
          if (intervention.createdAt) {
            let d;
            if (typeof intervention.createdAt === "number") {
              d = new Date(intervention.createdAt);
            } else if (typeof intervention.createdAt === "string") {
              // If it's a numeric string, treat as timestamp
              if (/^\d+$/.test(intervention.createdAt)) {
                d = new Date(Number(intervention.createdAt));
              } else {
                d = new Date(intervention.createdAt);
              }
            }
            if (d && !isNaN(d.getTime())) {
              interventionDate = d.toISOString().slice(0, 10);
              interventionColor = getInterventionColor(intervention);
            } else {
              console.warn('Invalid assignedIntervention.createdAt:', intervention.createdAt, intervention);
              interventionDate = null;
            }
          }
        }
        console.log('Intervention assignedInterventionsForThisBehavior:', assignedInterventionsForThisBehavior);
        console.log('Intervention createdAt:', assignedInterventionsForThisBehavior?.createdAt, 'Parsed:', interventionDate);

        return (
          <div key={freq._id} style={{ marginBottom: 32 }}>
            <h3>{freq.behaviorTitle}</h3>
            <div>
              <b>Total count:</b> {freq.count}
            </div>
            {mostFrequentHour && (
              <div>
                <b>Most frequent time:</b> {formatHour(mostFrequentHour[0])} ({mostFrequentHour[1]} times)
              </div>
            )}
            {notification && (
              <Alert message="Change your intervention: 3 consecutive days below aimline" type="warning" showIcon />
            )}
            <LineChart width={600} height={300} data={filledChartData}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, dataMax => Math.ceil(dataMax * 1.1)]} />
              <YAxis yAxisId="right" orientation="right" hide={true} />
              <Tooltip />
              
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                dot={props => <CustomDot {...props} interventionDate={interventionDate} interventionColor={interventionColor} />}
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
              <Scatter data={filledChartData.filter(d => d.intervention)} fill={interventionColor} />
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

function calculateAimline(frequencyData, goalValue, targetDateStr, startDateStr) {
  if (!frequencyData.length) return [];

  // Sort by date
  const sorted = [...frequencyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const startDate = startDateStr ? new Date(startDateStr) : new Date(sorted[0].date);
  const endDate = targetDateStr ? new Date(targetDateStr) : new Date(sorted[sorted.length - 1].date);

  const startValue = sorted.find(d => d.date === startDateStr)?.count ?? sorted[0].count;
  const days = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  const slope = (goalValue - startValue) / days;

  // Generate aimline points for each date in the range
  const aimlinePoints = [];
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    aimlinePoints.push({
      date: date.toISOString().slice(0, 10),
      value: startValue + slope * i,
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

function CustomDot(props) {
  const { cx, cy, payload, interventionDate, interventionColor } = props;
  const today = new Date();
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  if (payload.date <= todayStr) {
    if (interventionDate && payload.date === interventionDate) {
      // Use the interventionColor for the ring
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

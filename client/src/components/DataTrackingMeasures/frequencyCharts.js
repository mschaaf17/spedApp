import React, {useState, useEffect} from 'react'
// import MenuSideBar from '../../../components/MenuSideBar/MenuSideBar';
import { Link, useParams } from 'react-router-dom'
// import Duration from '../../../components/DataTrackingMeasures/duration'
// import ABC from '../../../components/DataTrackingMeasures/ABC'
// import Frequency from '../../../components/DataTrackingMeasures/frequency'
// import Observation from '../../../components/DataTrackingMeasures/observation'
// import Contracts from '../../../components/DataTrackingMeasures/Contracts'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Scatter } from 'recharts';
import { Select, Alert } from 'antd';



// import NavigationLinks from '../../../components/SideNavigationLinks'
// import { useQuery, useMutation } from '@apollo/client';
// import WeeklyData from '../../../components/StudentData/weekly'
// import {QUERY_USER, QUERY_INTERVENTION_LIST, QUERY_ME} from '../../../utils/queries'
// import { ADD_ACCOMMODATION_FOR_STUDENT, ADD_INTERVENTION_TO_STUDENT, REMOVE_INTERVENTION_FROM_STUDENT } from '../../../utils/mutations';
// import './index.css'
// import moment from 'moment';
// import { Modal, Button } from 'react-bootstrap';
// import OutOfSeatData from '../../../components/StudentData/outOfSeatData';
// import AddIcon from '@mui/icons-material/Add';
// import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
// import SearchIcon from '@mui/icons-material/Search';
// import DeleteForeverIcon from '@mui/icons-material/DeleteForever';




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

  // If frequencies are not loaded yet, show loading
  if (!safeFrequencies.length) return <div>Loading or no frequency data available.</div>;

  // Filtered frequencies
  const filtered = safeFrequencies.filter(f => selectedIds.includes(f._id));

  return (
    <div className='centerBody'>
      <div className='titleSection'>
        <h1 className="title"> Viewing Charts for {userParam}</h1>
      </div>

      <h3>Frequency for insert behavior title here</h3>
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
        

        const studentInterventions = [
          {
            frequencyId: freq._id,
            name: "Intervention 1",
            startDate: "2024-06-10" // or a date matching one in your chartData
          }
        ];

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
            <LineChart width={600} height={300} data={validChartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
              {/* Plot the aimline as a line */}
              <Line type="monotone" dataKey="value" data={aimlinePoints} stroke="red" dot={false} name="Aimline" />
              <Scatter data={validChartData.filter(d => d.intervention)} fill="orange" />
            </LineChart>
          </div>
        );
      })}
      <div>
        <button>Show dates/times</button>
      </div>
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

export default FrequencyCharts;

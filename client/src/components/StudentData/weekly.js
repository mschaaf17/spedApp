import React, { Component, useEffect, useState } from 'react';
import ReactEcharts from 'echarts-for-react';
import './index.css'
import { ResponsiveLine } from "@nivo/line";
import { parse } from "date-fns";


//need to format date correctly in order to display the chart based on how many breaks were taken in a day


const user = {
  breakCount: 14,
  breaks: [
    {
      _id: "63965acda4d3bfd8b2d01bd0",
      breakCount: 5,
      breakDate: "1670798029482",
      createdAt: "Dec 11th, 2022 at 2:13 pm",
      username: "kev@test.com"
    },
    {
      _id: "63965ad1a4d3bfd8b2d01bd5",
      breakCount: 4,
      breakDate: "1670798033574",
      createdAt: "Dec 18th, 2022 at 3:33 pm",
      username: "kev@test.com"
    },
    {
      _id: "639a0e9248f030e8d1e1ccb3",
      breakCount: 8,
      breakDate: "1671040658403",
      createdAt: "Dec 24th, 2022 at 10:57 am",
      username: "kev@test.com"
    },
    {
      _id: "63d304a64be0f88b25fa72ae",
      breakCount: 10,
      breakDate: "1674773670030",
      createdAt: "Dec 25th, 2022 at 3:54 pm",
      username: "kev@test.com"
    }
  ]
};

export default function WeeklyData({ totalBreaks, userBreaks, breakDates}) {
  console.log(totalBreaks)
  console.log(userBreaks)
  console.log(breakDates)
console.log(user.breaks)
//aimline needs to be how many breaks were taken on the second day or secocnd time using breaks??? 
  const formatString = "MMM do, yyyy 'at' h:mm aa";

  // const data = [
  //   {
  //     id: "breakCount",
  //     data: Array.isArray(userBreaks) // Check if userBreaks is an array
  //       ? userBreaks.map((b) => ({
  //           x: parse(b.createdAt, formatString, new Date()),
  //           y: b.breakCount
  //         }))
  //       : [] // Provide a fallback value if userBreaks is not an array
  //   }
  // ];
  // const data = [
  //   {
  //     id: "breakCount",
  //     data: Object.values(userBreaks && userBreaks).map((b) => ({
  //       x: parse(b.createdAt, formatString, new Date()),
  //       y: b.breakCount
  //     }))
  //   }
  // ];
  const data = [
    {
      id: "breakCount",
      data: user.breaks.map((b) => ({
        x: parse(b.createdAt, formatString, new Date()),
        y: b.breakCount
      }))
    },
    {
      id: "aimline",
      data: [
        {
          x: new Date(),
          y: 5 // Adjust the y value according to your aimline target
        },
      ],
    },
  ];
  
  const chartMargin = { top: 50, right: 110, bottom: 70, left: 60 }; // Adjust the margins as needed
  
  const tickValues = data[0].data
  //try 1.5% for more dates
    .filter((entry, index) => index % 10 === 0) // Display ticks for every other data point (adjust the condition as needed)
    .map((entry) => entry.x);
  
  return (
    <>
      <div className="App" style={{ width: "100%", height: 500 }}>
        <ResponsiveLine
          animate
          isInteractive
          pointSize={10}
          data={data}
          margin={chartMargin}
          xScale={{
            format: "%Y-%m-%d",
            precision: "day",
            type: "time"
          }}
          yScale={{
            type: "linear"
          }}
          axisBottom={{
            format: "%b %d",
            tickValues: tickValues
          }}
          enableSlices="x"
        />
      </div>
  

    <div className='break_table'>
            <div className='break_table'>
            <h4>Break information:</h4>
            {Object.values(userBreaks &&
        userBreaks).map((breaks, index) => (
          <div key={index}>
            <p>
              {breaks.createdAt}
               
            </p>

          </div>
        ))}
              
              </div>
            </div>
    
    </>

  );
}




// const WeeklyData = ({ totalBreaks, dateOfBreaks }) => {
//   const [showDates, setShowDates] = useState(false);
//   const [maxBreaks, setMaxBreaks] = useState(0);

//   useEffect(() => {
//     const calculateMaxBreaks = () => {
//       const breaks = [totalBreaks];
//       const max = Math.max(...breaks);
//       setMaxBreaks(max);
//     };
//     calculateMaxBreaks();
//   }, [totalBreaks]);


//   const handleClick = () => {
//     setShowDates(!showDates);
//   };

//   let breakDate = Object.values(dateOfBreaks);
//   let breakArr = breakDate.map((el) => el.createdAt);

//   return (
//     <>
//       <h4>Daily Break Count</h4>
//       <button onClick={handleClick}>Toggle Dates</button>
//       <ReactEcharts 
//       style={{width: '100%', height: '400px'}}
//         option={{
//           grid: {
//             left: '20%',
//             right: '20%'
//           },
//           xAxis: [
//             {
//               axisLabel: {
//                 interval: "auto",
//                 rotate: 10,
//                 overflow: 'truncate',
//                 textStyle: {
//                   baseline: 'top',
//                   color: '#333',
//                   fontSize: 8,
//                   fontWeight: 'bold',
//                 },
//               },
//               type: 'category',
//               data: showDates ? breakArr : [], // Use breakArr if showDates is true
//             },
//           ],
//           yAxis: [
//             {
//               type: 'value',
//               axisLabel: {
//                 formatter: '{value}', // Display numbers on the y-axis
//                 textStyle: { fontSize: 10, color: '#333' },
//               },
//               axisLine: { show: false },
//               axisTick: { show: false },
//               name: 'Break Count',
//               splitLine: {
//                 lineStyle: {
//                   type: 'dotted',
//                 },
//               },
//               max: maxBreaks,
//             },
//           ],
//           series: [
//             {
//               data: [totalBreaks],
//               type: 'line',
//             },
//           ],
//         }}
//       />


// <div className='break_table'>
//             <div className='break_table'>
//             <h4>Break information</h4>
//             {Object.values(dateOfBreaks &&
//         dateOfBreaks).map((breaks, index) => (
//           <div key={index}>
//             <p>
//               {breaks.createdAt}
               
//             </p>

//           </div>
//         ))}
              
//               </div>
//             </div>




        
            
//       </>
//     );
//   }

// export default WeeklyData;
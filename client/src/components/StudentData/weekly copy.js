import React, { Component, useEffect, useState } from 'react';
import ReactEcharts from 'echarts-for-react';
import './index.css'

//need to format date correctly in order to display the chart based on how many breaks were taken in a day


const WeeklyDataCopy = ({ totalBreaks, dateOfBreaks }) => {
  const [showDates, setShowDates] = useState(false);
  const [maxBreaks, setMaxBreaks] = useState(0);

  useEffect(() => {
    const calculateMaxBreaks = () => {
      const breaks = [totalBreaks];
      const max = Math.max(...breaks);
      setMaxBreaks(max);
    };
    calculateMaxBreaks();
  }, [totalBreaks]);


  const handleClick = () => {
    setShowDates(!showDates);
  };

  let breakDate = Object.values(dateOfBreaks);
  let breakArr = breakDate.map((el) => el.createdAt);

  return (
    <>
      <h4>Daily Break Count</h4>
      <button onClick={handleClick}>Toggle Dates</button>
      <ReactEcharts 
      style={{width: '100%', height: '400px'}}
        option={{
          grid: {
            left: '20%',
            right: '20%'
          },
          xAxis: [
            {
              axisLabel: {
                interval: "auto",
                rotate: 10,
                overflow: 'truncate',
                textStyle: {
                  baseline: 'top',
                  color: '#333',
                  fontSize: 8,
                  fontWeight: 'bold',
                },
              },
              type: 'category',
              data: showDates ? breakArr : [], // Use breakArr if showDates is true
            },
          ],
          yAxis: [
            {
              type: 'value',
              axisLabel: {
                formatter: '{value}', // Display numbers on the y-axis
                textStyle: { fontSize: 10, color: '#333' },
              },
              axisLine: { show: false },
              axisTick: { show: false },
              name: 'Break Count',
              splitLine: {
                lineStyle: {
                  type: 'dotted',
                },
              },
              max: maxBreaks,
            },
          ],
          series: [
            {
              data: [totalBreaks],
              type: 'line',
            },
          ],
        }}
      />


<div className='break_table'>
            <div className='break_table'>
            <h4>Break information</h4>
            {Object.values(dateOfBreaks &&
        dateOfBreaks).map((breaks, index) => (
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

export default WeeklyDataCopy;
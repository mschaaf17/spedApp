import React, { Component, useEffect, useState } from 'react';
import ReactEcharts from 'echarts-for-react';
import './index.css'
import { ResponsiveLine } from "@nivo/line";
import { parse } from "date-fns";
import moment from 'moment';


//need to format date correctly in order to display the chart based on how many breaks were taken in a day


export default function OutOfSeatData({outOfSeatByDay}) {
 
//aimline needs to be how many breaks were taken on the second day or secocnd time using breaks??? 
  const formatString = "MMM do, yyyy 'at' h:mm aa";
  //'MMMM Do YYYY, h:mm:ss a'
  const formattedDate = moment(outOfSeatByDay.createdAt).format('MM DD, YYYY [at] h:mma');
console.log(formattedDate)
const formattedDates = outOfSeatByDay.map((b) =>
  moment(b.createdAt).format('MM DD, YYYY [at] h:mma')
);


  const data = [
    {
      id: "breakCount",
      data: outOfSeatByDay.map((b) => ({
        x: parse(b.createdAt, formattedDate, new Date()),
        y: b.count
      }))
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
  

  
    
    </>

  );
}





import { useQuery } from '@apollo/client';
import WeeklyData from '../../components/StudentData/weekly'
import {QUERY_ME, QUERY_BREAKS} from '../../utils/queries'


import React, {useEffect} from 'react';
import ReactEcharts from 'echarts-for-react';
// import WeeklyData from '../../components/StudentData/weekly';
const StudentData = () => {
  
  const {loading, data} = useQuery(QUERY_ME)
  const breakCount = data?.me.breakCount || {}
  const breaks = data?.me.breaks || {}
  const breakDates = breaks.createdAt || []
  console.log(breaks)
  console.log([breakDates])


    //students graphs?
    // const {loading, data} = useQuery(QUERY_ME)
    // const breakCount = data?.me.breakCount || {}
    // const createdBreak = data?.me.breaks.breakDate || {}
    // let breakCountArr;
    // if (data)
    return (
      <>
      <h2>Weekly Data</h2>
      <WeeklyData 
      totalBreaks = {breakCount}
      userBreaks = {breaks}
      breakDates= {breakDates}
      />
      </>
      )
  }

export default StudentData;
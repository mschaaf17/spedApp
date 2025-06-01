 import React, {useState, useEffect} from 'react'
// import MenuSideBar from '../../../components/MenuSideBar/MenuSideBar';
 import { Link, useParams } from 'react-router-dom'
// import Duration from '../../../components/DataTrackingMeasures/duration'
// import ABC from '../../../components/DataTrackingMeasures/ABC'
// import Frequency from '../../../components/DataTrackingMeasures/frequency'
// import Observation from '../../../components/DataTrackingMeasures/observation'
// import Contracts from '../../../components/DataTrackingMeasures/Contracts'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';



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
const FrequencyCharts = () =>  {
  const { username: userParam } = useParams()


  return (
    <>

      <div className='centerBody'>
        <div className='titleSection'>
      <h1 className ="title"> Viewing Charts for {userParam}</h1>
      </div>

<h3>Frequency for insert behavior title here</h3>
        <LineChart width={600} height={300} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="Frequency for insert behavior title here" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="pv" stroke="#8884d8" />
    <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
  </LineChart>

  <div>
    <button>Show dates/times</button>
  </div>

      </div>
  
    </>
  )
}

export default FrequencyCharts;

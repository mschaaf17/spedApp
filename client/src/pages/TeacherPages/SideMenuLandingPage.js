//Side menu

import React, {useEffect, useState} from 'react'
import { Link, useParams } from 'react-router-dom'
import {useQuery} from '@apollo/client'
import {QUERY_USER, QUERY_ME} from '../../utils/queries.js'
import Duration from '../../components/DataTrackingMeasures/duration.js'
import ABC from '../../components/DataTrackingMeasures/ABC.js'
import Frequency from '../../components/DataTrackingMeasures/frequency.js'
import Observation from '../../components/DataTrackingMeasures/observation.js'
import Contracts from '../../components/DataTrackingMeasures/Contracts.js'
import MenuSideBar from '../../components/MenuSideBar/MenuSideBar.js'
import FrequencyCharts from '../../components/DataTrackingMeasures/frequencyCharts.js'
import useSelectedCharts from '../../hooks/useSelectCharts.js'
import StudentInterventions from './Interventions/StudentInterventions.js';
import StudentAccommodations from './Accommodations/StudentAccommodations.js';
export default function SideMenuLandingPage() {

  const { username: userParam } = useParams();
  
  const { loading, data } = useQuery(QUERY_USER, {
    variables: { identifier: userParam, isUsername: true },
  });
  
  const user = data?.user || {};

  const { selectedForm, selectCharts, setSelectedForm } = useSelectedCharts();

  //const [selectedForm, setSelectedForm] = useState(null)

    // use effect for on click display frequency
    if (loading || !user) return <div>Loading...</div>;

    const studentInterventions = []; // TODO: Replace with real data or query
    const aimlineValue = 5;         // TODO: Replace with real value or query

   

    let frequencies = [];
    if (userParam) {
      // Viewing a specific student
      frequencies = user?.behaviorFrequencies || [];
    } else {
      // Viewing as teacher/admin, pick a student (e.g., the first one)
      const selectedStudent = user.students?.[0];
      frequencies = selectedStudent?.behaviorFrequencies || [];
    }

    console.log('student:', user?.username);
    console.log('user:', user);
    console.log('frequencies:', frequencies);
    console.log('studentInterventions:', studentInterventions);
    console.log('aimlineValue:', aimlineValue);
    console.log('userParam:', userParam);

    const forms = {
      '1': <Frequency />,
      '2': <Duration />,
      '3': (
        <FrequencyCharts
          frequencies={frequencies}
          interventions={studentInterventions}
          aimline={aimlineValue}
        />
      ),
      '4': <StudentInterventions/>,
      '5': <StudentAccommodations/>,
      abc: <ABC/>,
      observation: <Observation/>,
      contracts: <Contracts/>
    }

  


      const handleMenuItemClick = (formName) => {
        setSelectedForm(formName);
      }


  
    if (loading) {
      return <div className='loader'>Loading...</div>;
    }

  return (
    <div className='container'>
      {/* menu side bar */}
      <MenuSideBar userParam = {userParam} onItemClick={handleMenuItemClick}/>
     

      {/* will render all specific components based on what is clicked on the left side for the stuent */}
      
      
        {/* possibly default to whatever has at least one data measure */}
        <div>
          {selectedForm ? (
            forms[selectedForm]
          ) : (
            <div className='secondHeading'>Select Data type from menu side bar</div>
          )}
        </div>
        {/* <Frequency/> */}
  
      

      </div>


    
  )
}

function calculateAimline(frequencyData, goalValue, targetDateStr) {
  if (!frequencyData.length) return [];

  // Sort by date
  const sorted = [...frequencyData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const startDate = new Date(sorted[0].date);
  const endDate = targetDateStr ? new Date(targetDateStr) : new Date(sorted[sorted.length - 1].date);

  const startValue = sorted[0].count;
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

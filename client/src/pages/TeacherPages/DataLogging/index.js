import React, {useEffect, useState} from 'react'
import { Link, useParams } from 'react-router-dom'
import {useQuery} from '@apollo/client'
import {QUERY_USER, QUERY_ME} from '../../../utils/queries'
import Duration from '../../../components/DataTrackingMeasures/duration'
import ABC from '../../../components/DataTrackingMeasures/ABC'
import Frequency from '../../../components/DataTrackingMeasures/frequency'
import Observation from '../../../components/DataTrackingMeasures/observation'
import Contracts from '../../../components/DataTrackingMeasures/Contracts'


export default function DataLogging() {

  const { username: userParam } = useParams()
  // const {loading, data} = useQuery(QUERY_USER, {
  //   variables: {username: userParam}
  // })
  
  const { loading, data } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam },
  });
  
  const user = data?.me || data?.user || {};


    // use effect for on click display frequency
    const forms = {
      frequency: <Frequency/>,
      duration: <Duration />,
      abc: <ABC/>,
      observation: <Observation/>,
      contracts: <Contracts/>
    }

  
      let initalState = {
        frequency: false,
        duration: false,
        abc: false,
        observation: false,
        contracts: false
      }
      const [state, setState] = useState(initalState)

    const toggleElement = (el) => {
      setState((prevState)=> ({
        ...prevState,
        [el]:!prevState[el]
      }))
    }
  
    if (loading) {
      return <div className='loader'>Loading...</div>;
    }

  return (
    <div>
      <h2>Logging for {userParam}</h2>
      
      <div className="data-to-click">
        {Object.keys(state).map((el) => (
          <div key={el}>
            <button
              className="logout"
              onClick={() => toggleElement(el)}
            >
              {el.toUpperCase()}
            </button>
            {state[el] ? forms[el] : null}
          </div>
        ))}
      </div>
      
      <div className="view-other-pages">
        <div> <Link className="link-to-page logout" to ={`/teacherdata/${userParam}`}> ← Back to Student List</Link></div>
        <div ><Link  className="link-to-page logout" to ={`/studentProfile/${userParam}/studentCharts`}>Student Charts → </Link></div>
      </div>


    </div>

    
  )
}

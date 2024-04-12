import React, {useEffect, useState} from 'react'
import { Link, useParams } from 'react-router-dom'
import {useQuery} from '@apollo/client'
import {QUERY_USER, QUERY_ME} from '../../../utils/queries'
import Duration from '../../../components/DataTrackingMeasures/duration'
import ABC from '../../../components/DataTrackingMeasures/ABC'
import Frequency from '../../../components/DataTrackingMeasures/frequency'
import Observation from '../../../components/DataTrackingMeasures/observation'
import Contracts from '../../../components/DataTrackingMeasures/Contracts'
import MenuSideBar from '../../../components/MenuSideBar/MenuSideBar'


export default function DataLogging() {

  const { username: userParam } = useParams()
  
  const { loading, data } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam },
  });
  
  const user = data?.me || data?.user || {};
  
  const [selectedForm, setSelectedForm] = useState(null)

    // use effect for on click display frequency
    const forms = {
      '1': <Frequency/>,
      '2': <Duration />,
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
     

      const handleMenuItemClick = (formName) => {
        setSelectedForm(formName);
      }

    const toggleElement = (el) => {
      setSelectedForm((prevState)=> ({
        ...prevState,
        [el]:!prevState[el]
      }))
    }
  
    if (loading) {
      return <div className='loader'>Loading...</div>;
    }

  return (
    <div className='container'>
      {/* menu side bar */}
      <MenuSideBar userParam = {userParam} onItemClick={handleMenuItemClick}/>
      <div className='centerBody'>
        <div className='titleSection'>
      <h1 className ="title"> Logging for {userParam}</h1>
      </div>

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
    </div>

    
  )
}

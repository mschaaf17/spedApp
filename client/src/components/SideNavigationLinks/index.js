import React from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import {QUERY_ME} from '../../utils/queries'
import './index.css'

export default function NavigationLinks() {
    const { username: userParam } = useParams()
    const {loading, data} = useQuery(QUERY_ME)
  return (
    <div className=''>

        <div className="buttons nav-logged-in">
          <button className='profile-options logout'><Link className=" link-to-page" to ={`/studentProfile/${userParam}/addAccommodations`}> Add Accommodations</Link></button>
        <button className = "profile-options logout"><Link className=" link-to-page" to ={`/studentProfile/${userParam}/dataLogging`}>Log Data</Link></button>
        <button className = "profile-options logout"><Link className=" link-to-page" to ={`/studentProfile/${userParam}/studentCharts`}>Charts</Link></button>
        {/* <button className = "profile-options logout"><Link className=" link-to-page" to ={`/studentProfile/${userParam}/interventions`}>Interventions</Link></button> */}
        </div>
        
        
        <div className="student-list-link"> <Link className="link-to-page logout" to ={`/studentList/${data?.me.username}`}> ← Back to Student List</Link></div> 
  

    </div>
  )
}
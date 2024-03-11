
import React from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import {useQuery} from '@apollo/client'
import {QUERY_USER, QUERY_ME} from '../../../utils/queries'
import Auth from '../../../utils/auth'
import NavigationLinks from '../../../components/NavigationLinks'
import './index.css'

//props was taken out in StudentProfile(props)
export default function AdditionalStudentInfo() {
    const { username: userParam } = useParams()
  return (
    <div>

          <h1 className='profile-name'>{`${userParam}'s Additional Info `}</h1>
        <div>FBA Questionairre and should be printable after filling out--should have a button that says share with another? email to parent?</div>
        <form>
        <div className='fba_form'>
              <input
                className="form-input"
                placeholder="How many hours in your school day"
                name=""
                type=""
                id="behavior-concern"
              />
              <input
                className="form-input"
                placeholder="How many 15 minute recesses per day"
                name=""
                type=""
                id="abc-date"
              />
               <input
                className="form-input"
                placeholder="How long is the lunch with recess break"
                name=""
                type=""
                id="location"
              />
               <input
                className="form-input"
                placeholder="Length of any additional downtime"
                name=""
                type=""
                id="location"
              />

        </div>
        </form>

        <NavigationLinks/>    
      
    </div>
  )
}

//only person accessing student profile will be the teacher
import React from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import {useQuery} from '@apollo/client'
import {QUERY_USER, QUERY_ME} from '../../../utils/queries'
import Auth from '../../../utils/auth'
import './index.css'
import NavigationLinks from '../../../components/NavigationLinks'

//props was taken out in StudentProfile(props)
export default function StudentProfile() {

  const { username: userParam } = useParams()
// const {loading, data} = useQuery(QUERY_USER, {
//   variables: {username: userParam}
// })

const { loading, data } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
  variables: { username: userParam },
});

const user = data?.me || data?.user || {};

// if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
//   return <Navigate to={`/studentProfile:${user.username}`} />;
// }

if (loading) {
  return <div className='loader'>Loading...</div>;
}

// if (!user?.username) {
//   return (
//     <h4>
//       You need to be logged in to see this. Use the navigation links above to
//       sign up or log in!
//     </h4>
//   );
// }

  return (
    <div>
        {/* student profile page */}
      

      {/* need to get ride of extra : in userparam */}
          <h2 className='profile-name'>{` Viewing ${userParam}'s Profile `}</h2>
        
        {/* log data link to = log data page */}
        
         <div className='center'>
      <NavigationLinks/>
        </div>
    </div>
  )
}

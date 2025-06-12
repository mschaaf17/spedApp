import React from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import './index.css';
import AccommodationList from '../../../components/AccommodationList/studentAccommodationView';
import Auth from '../../../utils/auth';
import { useQuery } from '@apollo/client';
import { QUERY_ME, QUERY_USER } from '../../../utils/queries';

const StudentAccommodations = (props) => {
  const { username: userParam } = useParams();

  const { loading, data } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam }
  });

  const user = data?.me || data?.user || {};
  console.log(data?.user?.username)
  console.log(data?.me.username)

  if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/studentAccommodations" />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Accommodation page</h2>
      <p>Username: {user.username}</p>
      {/* <AccommodationList accommodations={user.accommodations} title={user.username} /> */}
    </div>
  );
};

export default StudentAccommodations;

import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { QUERY_ME } from '../../utils/queries';
import Auth from '../../utils/auth';
import { Link, useParams } from 'react-router-dom';
import './index.css';

export default function LoadingPage() {
  const { loading, data, error } = useQuery(QUERY_ME);
  const admin = data?.me.isAdmin;

  useEffect(() => {
    if (loading) return;
    if (error) {
      console.error('GraphQL error:', error);
      // Optionally show an error message or redirect to login
      return;
    }
    if (!Auth.loggedIn()) return;
    if (!data?.me) return;

    if (data.me.isAdmin) {
      window.location.href = `/studentList/${data.me.username}`;
    } else {
      window.location.href = "/studentAccommodations";
    }
  }, [loading, data, error]);
  

  // useEffect(() => {
  //   const redirect = async () => {
  //     if (!loading && Auth.loggedIn() && admin !== true) {
  //       window.location.href = "/studentAccommodations";
  //     } else if (data?.me.username) {
  //       window.location.href = `/studentList/${data.me.username}`;
  //     }
  //   };

  //   redirect();
  // }, [loading, data]);

  console.log('loading:', loading, 'data:', data, 'error:', error);

  if (loading || !data?.me) {
    return <div className='loader'>Loading...</div>;
  }

  return <div className='loader'>Loading...</div>;
  //need to remove the header and everything else while loading
}

import React, { useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';
import './index.css';
import AccommodationList from '../../../components/AccommodationList/studentAccommodationView';
import Auth from '../../../utils/auth';
import { useQuery } from '@apollo/client';
import { QUERY_ME, QUERY_USER } from '../../../utils/queries';

const StudentAccommodations = (props) => {
  const { username: userParam } = useParams();
  const [clickedImageId, setClickedImageId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  const { loading, data } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam }
  });

  const user = data?.me || data?.user || {};

  // Debug logging
  console.log('User data:', user);
  console.log('Accommodations:', user.accommodations);

  if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/studentAccommodations" />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleImageError = (accommodationId, imagePath) => {
    console.log('Image failed to load:', imagePath);
    setImageErrors(prev => ({
      ...prev,
      [accommodationId]: true
    }));
  };

  return (
    <div className="accommodations-container">
      <h2>Accommodations for {user.username}</h2>
      
      <div className="accommodations-grid">
        {user.accommodations?.map(accommodation => {
          console.log('Accommodation:', accommodation);
          const imagePath = accommodation.image.startsWith('http')
            ? accommodation.image
            : (accommodation.image.startsWith('/') ? accommodation.image : `/${accommodation.image}`);
          console.log('Image path:', imagePath);
          
          return (
            <div 
              key={accommodation._id}
              className={`accommodation-card ${clickedImageId === accommodation._id ? 'highlighted' : ''}`}
              onClick={() => {
                setClickedImageId(accommodation._id);
                setTimeout(() => setClickedImageId(null), 1000);
              }}
            >
              {imageErrors[accommodation._id] ? (
                <div className="fallback-image">
                  <span>No Image Available</span>
                </div>
              ) : (
                <img 
                  src={imagePath}
                  alt={accommodation.title}
                  onError={() => handleImageError(accommodation._id, imagePath)}
                />
              )}
              <div className="accommodation-info">
                <h3>{accommodation.title}</h3>
                <p>{accommodation.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .accommodations-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .accommodations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          padding: 20px 0;
        }

        .accommodation-card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .accommodation-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .fallback-image {
          width: 100%;
          height: 200px;
          background-color: #f0f0f0;
          border-radius: 4px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 0.9em;
        }

        .accommodation-info {
          text-align: center;
        }

        .accommodation-info h3 {
          margin: 10px 0;
          color: #333;
        }

        .accommodation-info p {
          color: #666;
          font-size: 0.9em;
        }

        .accommodation-card.highlighted {
          animation: highlight 1s ease-out;
        }

        @keyframes highlight {
          0% {
            box-shadow: 0 0 0 0 rgba(138, 43, 226, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(138, 43, 226, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(138, 43, 226, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default StudentAccommodations; 
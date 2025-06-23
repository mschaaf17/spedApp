import React, { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Select } from 'antd';
import { QUERY_ME, QUERY_USER } from '../../../utils/queries';
import Auth from '../../../utils/auth';
import FrequencyCharts from '../../../components/DataTrackingMeasures/frequencyCharts';
import DurationCharts from '../../../components/DataTrackingMeasures/durationCharts';
import './index.css';

const { Option } = Select;

const StudentAccommodations = ({
  accommodations: propAccommodations,
  behaviorFrequencies: propFrequencies,
  behaviorDurations: propDurations,
  studentViewConfig: propConfig,
  previewMode = false
}) => {
  const { username: userParam } = useParams();
  const [clickedImageId, setClickedImageId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedChart, setSelectedChart] = useState(null);

  // Only fetch if not in preview mode and no props provided
  const shouldFetch = !previewMode && !propAccommodations && !propFrequencies && !propDurations && !propConfig;
  const query = userParam ? QUERY_USER : QUERY_ME;
  const variables = userParam ? { identifier: userParam, isUsername: true } : {};
  const { loading, data, error } = useQuery(query, { variables, skip: !shouldFetch });

  // Log any errors to the console
  useEffect(() => {
    if (error) {
      console.error('GraphQL Query Error:', error);
    }
  }, [error]);

  // Use props if provided, otherwise use fetched data
  const user = shouldFetch ? (data?.me || data?.user || {}) : {};
  const accommodations = propAccommodations ?? user.accommodations ?? [];
  const behaviorFrequencies = propFrequencies ?? user.behaviorFrequencies ?? [];
  const behaviorDurations = propDurations ?? user.behaviorDurations ?? [];
  const studentViewConfig = propConfig ?? user.studentViewConfig ?? {};

  // Set the default selected chart if charts are available
  useEffect(() => {
    if (studentViewConfig?.selectedCharts?.length > 0) {
      const firstChart = studentViewConfig.selectedCharts[0];
      setSelectedChart(`${firstChart.type}-${firstChart.id}`);
    } else {
      setSelectedChart(null); // Reset if no charts are available
    }
  }, [studentViewConfig]);

  if (!previewMode && Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/studentAccommodations" />;
  }

  if (!previewMode && loading) {
    return <div>Loading...</div>;
  }

  const handleImageError = (accommodationId) => {
    setImageErrors(prev => ({
      ...prev,
      [accommodationId]: true
    }));
  };

  const renderSelectedChart = () => {
    if (!selectedChart) return null;
    const [type, id] = selectedChart.split('-');
    if (type === 'frequency') {
      const frequency = behaviorFrequencies?.find(f => f._id === id || f.id === id);
      if (frequency) {
        return (
          <div className="frequency-chart-container">
            <FrequencyCharts frequencies={[frequency]} interventions={[]} />
          </div>
        );
      }
    } else if (type === 'duration') {
      const duration = behaviorDurations?.find(d => d._id === id || d.id === id);
      if (duration) {
        return (
          <div className="duration-chart-container">
            <DurationCharts durations={[duration]} interventions={[]} />
          </div>
        );
      }
    }
    return null;
  };

  const hasVisibleCharts = studentViewConfig?.selectedCharts?.length > 0;
  
  return (
    <div className={`student-dashboard-container ${previewMode ? 'preview-mode' : ''}`}>
      <h2 className="dashboard-title">Welcome, {user.firstName || user.username || ''}</h2>
      <div className={`main-content-grid ${hasVisibleCharts ? 'charts-visible' : 'no-charts'}`}>
        {/* Accommodations Section */}
        {studentViewConfig?.showAccommodations && (
          <div className="accommodations-section">
            <h3 className="section-title">Your Accommodations</h3>
            <div className="accommodations-grid">
              {accommodations?.map(accommodation => {
                const imagePath = accommodation.image?.startsWith('http')
                  ? accommodation.image
                  : (accommodation.image?.startsWith('/') ? accommodation.image : `/${accommodation.image}`);
                return (
                  <div 
                    key={accommodation._id || accommodation.id}
                    className={`accommodation-card ${clickedImageId === (accommodation._id || accommodation.id) ? 'highlighted' : ''}`}
                    onClick={() => {
                      setClickedImageId(accommodation._id || accommodation.id);
                      setTimeout(() => setClickedImageId(null), 1000);
                    }}
                  >
                    {!imagePath || imageErrors[accommodation._id || accommodation.id] ? (
                      <div className="fallback-image">
                        <span>No Image</span>
                      </div>
                    ) : (
                      <img 
                        src={imagePath}
                        alt={accommodation.title}
                        onError={() => handleImageError(accommodation._id || accommodation.id)}
                      />
                    )}
                    <div className="accommodation-info">
                      <h4>{accommodation.title}</h4>
                      <p>{accommodation.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Charts Section */}
        {hasVisibleCharts && (
          <div className="charts-section">
            <h3 className="section-title">Your Progress</h3>
            <Select
              value={selectedChart}
              style={{ width: '100%', marginBottom: '20px' }}
              onChange={value => setSelectedChart(value)}
              placeholder="Select a chart to view"
            >
              {studentViewConfig.selectedCharts.map(chart => (
                <Option key={`${chart.type}-${chart.id}`} value={`${chart.type}-${chart.id}`}>
                  {chart.title} ({chart.type})
                </Option>
              ))}
            </Select>
            <div className="chart-display-area">
              {renderSelectedChart()}
            </div>
          </div>
        )}
      </div>
      {/* Message when nothing is configured to be shown */}
      {!studentViewConfig?.showAccommodations && !hasVisibleCharts && (
        <div className="empty-dashboard-message">
          <p>Your dashboard is not yet configured.</p>
          <p>Please contact your teacher for access to your accommodations and charts.</p>
        </div>
      )}
    </div>
  );
};

export default StudentAccommodations; 
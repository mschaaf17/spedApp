
import React, { useState, useEffect } from 'react';

import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Button } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import frequencyCharts from '../components/DataTrackingMeasures/frequencyCharts';
import durationCharts from '../components/DataTrackingMeasures/durationCharts';
import FrequencyHistoryModal from '../components/DataTrackingMeasures/FrequencyHistoryModal';
// import accommodationCharts from '../components/DataTrackingMeasures/accommodationCharts';
import AccommodationLogsModal from '../components/AccommodationLogs/AccommodationLogsModal';
import breakFrequencyCharts from '../components/DataTrackingMeasures/breakFrequencyCharts';
import { useQuery } from '@apollo/client';
import { QUERY_USER } from '../utils/queries';
import FrequencyCharts from '../components/DataTrackingMeasures/frequencyCharts';
import DurationCharts from '../components/DataTrackingMeasures/durationCharts';
import BreakFrequencyCharts from '../components/DataTrackingMeasures/breakFrequencyCharts';
import ContractCharts from '../components/DataTrackingMeasures/ContractCharts';
import AccommodationCharts from '../components/DataTrackingMeasures/AccommodationCharts';
import StudentDataAccordion from '../components/MainAnalyzeData/StudentDataAccordion';


export default function MainAnalyzeDataHomePage({ studentId }) {
  const [openHistoryFor, setOpenHistoryFor] = useState(null); // Track which data type's history is open
  const { data, loading, error } = useQuery(QUERY_USER, {
    variables: { identifier: studentId, isUsername: false },
    skip: !studentId,
  });

  if (loading) return <div>Loading...</div>;
  if (error || !data?.user) return <div>Error loading student data.</div>;

  const user = data.user;
  const interventions = user.interventions || [];

  // Build the dataTypes array dynamically
  const dataTypes = [
    ...user.behaviorFrequencies.map(f => ({
      id: f._id,
      label: f.behaviorTitle,
      content: (
        <div>
          <FrequencyCharts frequencies={[f]} interventions={interventions} />
          <Button onClick={() => setOpenHistoryFor({ type: 'frequency', data: f })}>
            History
          </Button>
        </div>
      )
    })),
    ...user.behaviorDurations.map(d => ({
      id: d._id,
      label: d.behaviorTitle,
      content: <DurationCharts durations={[d]} />
    })),
    ...(user.breakSettings?.isEnabled ? [{
      id: 'breaks',
      label: 'Breaks',
      content: <BreakFrequencyCharts breakHistory={user.breakHistory} breakSettings={user.breakSettings} />
    }] : []),
    ...(user.contracts?.length ? user.contracts.map(contract => ({
      id: contract._id,
      label: contract.title,
      content: <ContractCharts contract={contract} />
    })) : []),
    ...(user.accommodations?.length ? [{
      id: 'accommodations',
      label: 'Accommodations',
      content: <AccommodationCharts accommodations={user.accommodations} />
    }] : []),
  ];

  return (
    <div>
        {/* calling out would have intervnetion dates, when calling out was assigned, 
        i think there will just need ot be a trash can nect to assigned intervention to remove it 
        
        will just need to figure out where I want to remove accomodations or add them?
        
        */}
        <button>History for each dropdown so I can have interventions in with each data measure?</button>
{/*         
        <AccommodationLogsModal
        visible={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        accommodation={selectedAccommodation}
      /> */}
        <StudentDataAccordion dataTypes={dataTypes} />
    
    {/* History Modal */}
    {openHistoryFor && (
      <FrequencyHistoryModal
        open={openHistoryFor?.type === 'frequency'}
        onClose={() => setOpenHistoryFor(null)}
        behavior={openHistoryFor?.data}
        interventions={interventions}
        data={openHistoryFor?.data?.dailyCounts}
      />
    )}
    </div>
  );
}
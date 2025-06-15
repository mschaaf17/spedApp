// import React from 'react';
// import { useQuery } from '@apollo/client';
// import { QUERY_DURATIONS_FOR_STUDENT } from '../../../utils/queries';
// import DurationTimers from '../../../components/DataTrackingMeasures/durationTimers'; // import the child

// export default function StudentDurations({ studentId }) {
//   const { data, loading, error } = useQuery(QUERY_DURATIONS_FOR_STUDENT, {
//     variables: { studentId }
//   });

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error loading durations: {error.message}</div>;

//   const durations = data?.duration || [];

//   return (
//     <div>
//       <h2>Duration Behaviors</h2>
//       {durations.length === 0 && <div>No durations found for this student.</div>}
//       <ul>
//         {durations.map(duration => (
//           <li key={duration._id}>
//             <DurationTimers durationId={duration._id} behaviorTitle={duration.behaviorTitle} />
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

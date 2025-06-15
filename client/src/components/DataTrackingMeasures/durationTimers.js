// //TODO: fix the modal issues when more than duration is opened


// import React, {useState, useEffect} from 'react'
// import { Modal, Button } from "react-bootstrap"
// import "./index.css"
// import { useQuery, useMutation } from '@apollo/client';
// import {
//   QUERY_TIMERS_FOR_DURATION,
//   QUERY_DURATIONS_FOR_STUDENT
// } from '../../utils/queries'; // adjust pa
// import {
//   START_DURATION_TIMER,
//   END_DURATION_TIMER,
//   RESUME_DURATION_TIMER,
//   RESET_DURATION_TIMER,
//   SAVE_DURATION_TIMER
// } from '../../utils/mutations';
// export default function DurationTimers({ durationId, studentId }) {
//   const [showModal, setShow] = useState(false)
//   const handleClose = ()=> setShow(false)
//   const handleShow =() =>setShow(true)

//   const [time, setTime] = useState(0)
//   const [timerOn, setTimerOn] = useState(false)

//   const handleClickStop = () => {
//       setTimerOn(false)
//   }

//   useEffect(()=> {
//       let interval = null

//       if(timerOn) {
//           interval = setInterval(() => {
//               setTime(prevTime => prevTime + 1000)
//           }, 1000)
//       } else {
//           clearInterval(interval)
//       }
//       return () => clearInterval(interval)
//   }, [timerOn])

//   // Fetch all timers for this duration
//   const { data: durationData, loading: durationLoading, refetch: durationRefetch } = useQuery(QUERY_DURATIONS_FOR_STUDENT, {
//     variables: { studentId }
//   });

//   const { data: timersData, loading: timersLoading, refetch: timersRefetch } = useQuery(QUERY_TIMERS_FOR_DURATION, {
//     variables: { durationId, studentId }
//   });

//   const [startTimer] = useMutation(START_DURATION_TIMER, {
//     variables: { durationId },
//     onCompleted: () => durationRefetch()
//   });
//   const [endTimer] = useMutation(END_DURATION_TIMER, { onCompleted: () => timersRefetch() });
//   const [resumeTimer] = useMutation(RESUME_DURATION_TIMER, { onCompleted: () => timersRefetch() });
//   const [resetTimer] = useMutation(RESET_DURATION_TIMER, { onCompleted: () => timersRefetch() });
//   const [saveTimer] = useMutation(SAVE_DURATION_TIMER, { onCompleted: () => timersRefetch() });

//   if (durationLoading || timersLoading) return <div>Loading...</div>;
//   const timers = timersData?.duration?.timers || [];

//   const durations = durationData?.behaviorTitle || [];

//   return (
//     <div className="data-logging-container">
//       <h2>Duration Data</h2>
//       <p>
//       <div>
//        <h2>Duration Behaviors</h2>
//        {durations.length === 0 && <div>No durations found for this student.</div>}
//        <ul>
//          {durations.map(duration => (
//            <li key={duration._id}>
//              <DurationTimers durationId={duration._id} behaviorTitle={duration.behaviorTitle} />
//            </li>
//        ))}
//       </ul>
//      </div>
//       </p>
//       <p>Start timer when behavior occurs/Stop when behavior is over</p>
//       <div className="timer">  
//             <span>{('0' + Math.floor((time / 3600000) % 60)).slice(-2)}:</span>
//               <span>{('0' + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
//               <span>{('0' + Math.floor((time / 1000) % 60)).slice(-2)}</span>
//               {/* <span>{("0" + ((time / 10) % 100)).slice(-2)}</span> */}

//               <div className="timer-button-container">
//               {!timerOn && time === 0 && (
//                 <button className="green time-btn" onClick={()=> setTimerOn(true)}>
//                   Start
//                 </button>
//               )}
//               {timerOn && (
//                 <button className="red time-btn" onClick={handleClickStop}>
//                   Stop
//                 </button>
//               )}

//               {!timerOn && time !== 0 && (
//                 <button className="green time-btn" onClick={() => setTimerOn(true)}>
//                   Resume
//                 </button>
//               )}

//               {!timerOn && time > 0 && (
//                 <button className="yellow time-btn" onClick={() => setTime(0)}>
//                   Reset
//                 </button>
//               )}

// {!timerOn && time !== 0 && (
//                 <button className="blue time-btn" onClick={()=>{handleClickStop(); handleShow()}}>
//                   Save
//                 </button>
//               )}
//               <div className="entire-modal">
//               <Modal show={showModal} onHide={handleClose}>
//         <Modal.Header closeButton>
//           <Modal.Title className="modal-title">Type of Behavior</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//                <form>
//                 <input list="typelist" type="text" name="behavior" autoComplete="off" placeholder="Add/Select Behavior"
//                 />
//                 <datalist>
//                   <option>elopement</option>
//                 </datalist>

//                </form>
//               </Modal.Body>
//         <Modal.Footer>
//           <button className="modal-btn-close" variant="secondary" onClick={handleClose}>
//             Close
//           </button>
//           {/*  handle submit function for form*/}
//           <button className="modal-btn-save" variant="primary" onClick={handleClose}>
//             Save Changes
//           </button>
//         </Modal.Footer>
//       </Modal>
//       </div>
//               {/* <button onClick = {submitTime}>Save</button> */}
//   {/*need to be able to save type of behavior for duration quickly  */}
              
//             </div>
//       </div>

//       <h2>Duration Timers</h2>
//       <button onClick={() => startTimer()}>Start New Timer</button>
//       <ul>
//         {timers.map(timer => (
//           <li key={timer.timerId}>
//             <div>
//               <b>Status:</b> {timer.status} <br />
//               <b>Start:</b> {timer.startTime ? new Date(timer.startTime).toLocaleTimeString() : 'N/A'} <br />
//               <b>End:</b> {timer.endTime ? new Date(timer.endTime).toLocaleTimeString() : 'N/A'}
//             </div>
//             {timer.status === 'running' && (
//               <button onClick={() => endTimer({ variables: { durationId, timerId: timer.timerId } })}>Stop</button>
//             )}
//             {timer.status === 'stopped' && (
//               <>
//                 <button onClick={() => resumeTimer({ variables: { durationId, timerId: timer.timerId } })}>Resume</button>
//                 <button onClick={() => resetTimer({ variables: { durationId, timerId: timer.timerId } })}>Reset</button>
//                 <button onClick={() => saveTimer({ variables: { durationId, timerId: timer.timerId } })}>Save</button>
//               </>
//             )}
//           </li>
//         ))}
//       </ul>

//     </div>
//   )
// }

// export function StudentDurations({ studentId }) {
//   const { data, loading, error } = useQuery(QUERY_DURATIONS_FOR_STUDENT, {
//     variables: { studentId }
//   });

//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error loading durations</div>;

//   const durations = data?.duration || [];

//   return (
//     <div>
//       <h2>Duration Behaviors</h2>
//       {durations.length === 0 && <div>No durations found for this student.</div>}
//       <ul>
//         {durations.map(duration => (
//           <li key={duration._id}>
//             <b>{duration.behaviorTitle}</b>
//             {/* You can also show operationalDefinition or other info */}
//             {/* Pass duration._id to your DurationTimers component */}
//             <DurationTimers durationId={duration._id} behaviorTitle={duration.behaviorTitle} />
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

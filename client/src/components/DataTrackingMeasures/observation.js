import React, {useState, useEffect}  from 'react'

export default function Observation() {
// const handleClose = ()=> setShow(false)
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

const [time, setTime] = useState(0)

  return (
    <div>
      {/* diplay a timer, allow teacher to enter class activity, whole group/small/or individual--
       backend should take time started and stopped, date, student name, and the teacher logged who observed
       --during observation teacher starts timer and then needs to be able to click student behavior and peer behavior,
       should possible be able to make any final edits at the end before submitting for a pdf
       --timer should only be 15 minutes but have a are you sure you are ready to start button then a 5 second countdown 
       teacher should be able to pause the timer if necessary*/}
       <button>Start Observation</button>
       {/* once clicked modal opens timer at top with buttons, and below are behavior to click */}
     <div>
     Before starting observation:
       <ol>
        <li>
        Verify your 15 minute window will not be disrupted
        </li>
        <li>
        Every 10 seconds click on the behavior for both your target student and peer as well as teacher interaction
        </li>
        <li>
       When alert notifies you switch peer student to another student of same sex
        </li>
        </ol>
      </div> 
      {/* countdown timer */}
        <div className="timer">
          <span>{('0' + Math.floor((time / 3600000) % 60)).slice(-2)}:</span>
          <span>{('0' + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
          <span>{('0' + Math.floor((time / 1000) % 60)).slice(-2)}</span>
        </div>
      <div>
        <section>
        15:00
        </section>
        <section className='frequency-button-section data-logging-container'>
          <div className='frequency-button-section'>
            <h3>Target Student</h3>
            <button>On Task</button>
            <button>Out of Seat</button>
            <button>Talking Out</button>
            <button>Off Task</button>
            <button>Teacher Engagement??</button>
          </div>
          <div className='frequency-button-section'>
            <h3>Peer Student(i)</h3>
            <button>On Task</button>
            <button>Out of Seat</button>
            <button>Talking Out</button>
            <button>Off Task</button>
            <button>Teacher Engagement??</button>
          </div>
        </section>
      </div>
    </div>
  )
}

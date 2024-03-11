import React, { useEffect, useState } from 'react'
import './index.css'
import { useQuery, useMutation } from '@apollo/client'
import { QUERY_USER } from '../../utils/queries'
import { ADD_OUT_OF_SEAT } from '../../utils/mutations'
import { useParams } from 'react-router-dom'

const Frequency = ()=> {
   const {username: usernameFromUrl} = useParams();
   
   const [addOutOfSeat] = useMutation(ADD_OUT_OF_SEAT, {
    refetchQueries: [{ query: QUERY_USER, variables: { username: usernameFromUrl } }],
  });

  const {data} = useQuery(QUERY_USER, {
    variables: {username: usernameFromUrl}
  });
  const user = data?.user || {};
  const outOfSeatByDay = data?.user?.outOfSeatCountByDayVirtual


const getTodayCount = () => {
  const today = new Date().toISOString().split('T')[0]; 

  const todayData = outOfSeatByDay.find((data) => {
    const dataDate = new Date(data.createdAt).toISOString().split('T')[0]; 

    return dataDate === today; 
  });

  console.log(todayData ? todayData.count : 0);
  return todayData ? todayData.count : 0;
};


   const [frequencyCount, setFrequencyCount] = useState(getTodayCount());

  const reset = () => {
    setFrequencyCount(0);
  }

  useEffect(()=> {
  }, [frequencyCount]);
  
    const outOfSeatClicked = async (e) => {
      try {
        await addOutOfSeat({
          variables: {username: user.username},
        });
        setFrequencyCount(frequencyCount + 1);
       
      } catch (e)
      {
        console.log(e);
      }
      console.log('Out of seat has been clicked')
   };
    return (
      <div className="data-logging-container">
        <h2>Click each button as behavior occurs</h2>
        <div className="frequency-button-section">
          {usernameFromUrl && (
          <button onClick={outOfSeatClicked}>
            {/* {`Out Of Seat ${frequencyCount === 0 ? '' : `: ${frequencyCount}`}`} */}
            {`Out Of Seat ${frequencyCount === 0 ? '' : `: ${frequencyCount}`}`}
            {/* front end should reset after 12 hours -- not sure how it will work if the frequency count is coming from backend? */}
          </button>
        )}
        <button>Talk Outs/Noises</button>
        <button>Aggression Towards Others</button>
        <button>Aggression Towards Self</button>
        <button>Throwing items</button>
        <button>Refusing Command</button>
        <button>Other</button>
        {/* <button>Reset Frequencies Before 12 hours?</button> */}
        </div>
        <button className = "red-button" onClick={reset}> Reset Frequency</button>
        
      </div>
    )
}

export default Frequency


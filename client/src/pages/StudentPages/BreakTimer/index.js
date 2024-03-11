import React, { useState, useEffect} from 'react'
import { Link } from 'react-router-dom'
import './index.css'
import Auth from '../../../utils/auth'


import {useQuery} from '@apollo/client'
import {QUERY_USER} from '../../../utils/queries'

const BreakTimer= (breakCount) => {
// query break amount length
// const data = useQuery(QUERY_USER)
// const user = data?.user || {}
// if (Auth.loggedIn()) {}
// may not need amount of breaks on this page! but check to see if the timer needs auth because of echarts later!


    const [time, setTime] = useState(0)
    const [timerOn, setTimerOn] = useState(false)

    const handleClickStop = () => {
        setTimerOn(false)
    }

    useEffect(()=> {
        let interval = null

        if(timerOn) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 1000)
            }, 1000)
        } else {
            clearInterval(interval)
        }
        return () => clearInterval(interval)
    }, [timerOn])

        return ( 
          <div>
                    {/* <h3>{user.breakCount} {user.breakCount === 1 ? 'break' : 'breaks'}</h3> */}

            <div className="timer">  
            <span>
                {('0' + Math.floor((time / 3600000) % 60)).slice(-2)}:
              </span>
              <span>{('0' + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
              <span>{('0' + Math.floor((time / 1000) % 60)).slice(-2)}</span>
              {/* <span>{("0" + ((time / 10) % 100)).slice(-2)}</span> */}

              <div className="timer-button-container">
              {!timerOn && time === 0 && (
                <button className="green time-btn" onLoadStart={ setTimerOn(true)}>
                  {' '}
                </button>
              )}
              {timerOn && (
                <button className="red time-btn" onClick={handleClickStop}>
                  Stop
                </button>
              )}

              {!timerOn && time !== 0 && (
                <button className="green time-btn" onClick={() => setTimerOn(true)}>
                  Resume
                </button>
              )}

              {/* {!timerOn && time > 0 && (
                <button className="yellow time-btn" onClick={() => setTime(0)}>
                  Reset
                </button>
              )} */}
              {/* <button onClick = {submitTime}>Save</button> */}
            </div>
      </div>
      <button className ="logout accommodation-btn" onClick={handleClickStop}> <Link className= "link-to-page" to ={'/studentAccommodations'}>Back to Accommodations</Link></button>

        </div>
        )
 
}

export default BreakTimer
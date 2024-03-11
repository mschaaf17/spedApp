//TODO: fix the modal issues when more than duration is opened


import React, {useState, useEffect} from 'react'
import { Modal, Button } from "react-bootstrap"
import "./index.css"

export default function Duration() {
  const [showModal, setShow] = useState(false)
  const handleClose = ()=> setShow(false)
  const handleShow =() =>setShow(true)

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
    <div className="data-logging-container">
      <h2 >Duration Data</h2>
      <p>Start timer when behavior occurs/Stop when behavior is over</p>
      <div className="timer">  
            <span>{('0' + Math.floor((time / 3600000) % 60)).slice(-2)}:</span>
              <span>{('0' + Math.floor((time / 60000) % 60)).slice(-2)}:</span>
              <span>{('0' + Math.floor((time / 1000) % 60)).slice(-2)}</span>
              {/* <span>{("0" + ((time / 10) % 100)).slice(-2)}</span> */}

              <div className="timer-button-container">
              {!timerOn && time === 0 && (
                <button className="green time-btn" onClick={()=> setTimerOn(true)}>
                  Start
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

              {!timerOn && time > 0 && (
                <button className="yellow time-btn" onClick={() => setTime(0)}>
                  Reset
                </button>
              )}

{!timerOn && time !== 0 && (
                <button className="blue time-btn" onClick={()=>{handleClickStop(); handleShow()}}>
                  Save
                </button>
              )}
              <div className="entire-modal">
              <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title">Type of Behavior</Modal.Title>
        </Modal.Header>
        <Modal.Body>
               <form>
                <input list="typelist" type="text" name="behavior" autoComplete="off" placeholder="Add/Select Behavior"
                />
                <datalist>
                  <option>elopement</option>
                </datalist>

               </form>
              </Modal.Body>
        <Modal.Footer>
          <button className="modal-btn-close" variant="secondary" onClick={handleClose}>
            Close
          </button>
          {/*  handle submit function for form*/}
          <button className="modal-btn-save" variant="primary" onClick={handleClose}>
            Save Changes
          </button>
        </Modal.Footer>
      </Modal>
      </div>
              {/* <button onClick = {submitTime}>Save</button> */}
  {/*need to be able to save type of behavior for duration quickly  */}
              
            </div>
      </div>


    
    </div>
  )
}

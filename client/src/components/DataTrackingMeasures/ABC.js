import React, {useState} from 'react'
import './index.css'

export default function ABC() {

// if clicked add new block display the entire form

const [displayForm, setDisplayForm] = useState(false)

const toggleForm = () => {
  setDisplayForm((prevState) => !prevState)
  }



  return (
    <div>
      Functional Assessment Observation Form-- enter a start time for each block-- this will then display an end time based on the new block
      enter an actvity, enter behaviors, predictors, perceived functions, consequences
      ABC Checklist
      <div>
        <h2>ABC Checklist</h2>
          <div className='new_block_btn'>
              <button className="submit-btn new_block_btn" onClick = {toggleForm}>
               {displayForm ? 'Remove Block' : 'Add New Block'}
              </button>
          </div>
        {/* be able to add a new block with below info  before submit? on each click it should grab a timestamp
        need to make a model that counts this */}
        
        {displayForm && ( 
        <form className="user-input">
          {/* dropdown */}

          <div className='abc_setup'>
              <input
                className="form-input"
                placeholder="Behavior of Concern"
                name=""
                type=""
                id="behavior-concern"
              />
              <input
                className="form-input"
                placeholder="Date"
                name=""
                type=""
                id="abc-date"
              />
               <input
                className="form-input"
                placeholder="Location/Setting"
                name=""
                type=""
                id="location"
              />

        </div>    
              <div className='abc_block'>
                <h3>Antecendent (before behavior)</h3>
                <div className='abc_checklist'>
                <label>
                  Given Direction/Task/Activity
                <input type= "checkbox"></input>
                </label>
                <label>
                  Asked to Wait
                <input type= "checkbox"></input>
                </label>
                <label>
                  New Task/Activity
                <input type= "checkbox"></input>
                </label>
                <label>
                  Difficult Task/Activity
                <input type= "checkbox"></input>
                </label>
                <label>
                  Loud, noisy enviornment
                <input type= "checkbox"></input>
                </label>
                <label>
                  Given Assistance/correction
                <input type= "checkbox"></input>
                </label>
                <label>
                  Transition Between  Location/Activities
                <input type= "checkbox"></input>
                </label>
                <label>
                  Attention given to others
                <input type= "checkbox"></input>
                </label>
                <label>
                  Presence of specific person
                <input type= "checkbox"></input>
                </label>
                <label>
                  Attention not given when wanted
                <input type= "checkbox"></input>
                </label>
                <label>
                  Left alone (No indiv. attention)
                <input type= "checkbox"></input>
                </label>
                <label>
                  Left alone (no approp. activity)
                <input type= "checkbox"></input>
                </label>
                <label >
                  Other:
                <input className='underline' type= ""></input>
                </label>
              </div>
              </div>

              <div className='abc_block'>
                <h3>Behavior</h3>
                <div className='abc_checklist'>
                <label>
                  Refusing to follow directions
                <input type= "checkbox"></input>
                </label>
                <label>
                  Making verbal threats
                <input type= "checkbox"></input>
                </label>
                <label>
                  Distrupting class
                <input type= "checkbox"></input>
                </label>
                <label>
                  Crying/whining
                <input type= "checkbox"></input>
                </label>
                <label>
                  Screaming/yelling
                <input type= "checkbox"></input>
                </label>
                <label>
                  Scratching
                <input type= "checkbox"></input>
                </label>
                <label>
                  Biting
                <input type= "checkbox"></input>
                </label>
                <label>
                  Spitting
                <input type= "checkbox"></input>
                </label>
                <label>
                  Kicking
                <input type= "checkbox"></input>
                </label>
                <label>
                  Flopping
                <input type= "checkbox"></input>
                </label>
                <label>
                  Running Away/Bolting
                <input type= "checkbox"></input>
                </label>
                <label>
                  Destroying Property
                <input type= "checkbox"></input>
                </label>
                <label>
                  Flipping Furniture
                <input type= "checkbox"></input>
                </label>
                <label>
                  Hitting Self
                <input type= "checkbox"></input>
                </label>
                <label>
                  Hitting Others
                <input type= "checkbox"></input>
                </label>
                <label>
                  Verbal Refusal
                <input type= "checkbox"></input>
                </label>
                <label >
                  Other:
                <input className='underline' type= ""></input>
                </label>
              </div>
              </div>


              <div className='abc_block'>
                <h3>Consequences (after behavior)</h3>
                <div className='abc_checklist'>
                <label>
                  Verbal Redirection
                <input type= "checkbox"></input>
                </label>
                <label>
                  Physical assist/prompt
                <input type= "checkbox"></input>
                </label>
                <label>
                  Ignored problem behavior
                <input type= "checkbox"></input>
                </label>
                <label>
                  Kept demand on
                <input type= "checkbox"></input>
                </label>
                <label>
                  Used proximity control
                <input type= "checkbox"></input>
                </label>
                <label>
                  Verbal reprimand
                <input type= "checkbox"></input>
                </label>
                <label>
                  Removed from activity/location
                <input type= "checkbox"></input>
                </label>
                <label>
                  Given another taks/activity
                <input type= "checkbox"></input>
                </label>
                <label>
                  Interrupted/blocked and redirected
                <input type= "checkbox"></input>
                </label>
                <label>
                  Left alone
                <input type= "checkbox"></input>
                </label>
                <label>
                  Isolated within class
                <input type= "checkbox"></input>
                </label>
                <label>
                  Loss of privilege
                <input type= "checkbox"></input>
                </label>
                <label>
                  Calming/soothing: verbal/physical/both
                <input type= "checkbox"></input>
                </label>
                <label>
                  Peer remarks/laughter
                <input type= "checkbox"></input>
                </label>
                <label>
                  Hitting Others
                <input type= "checkbox"></input>
                </label>
                {/* allow timer */}
                <label >
                  Time-out: (duration)
                <input className='underline' type= ""></input>
                </label>
                <label >
                  Other:
                <input className='underline' type= ""></input>
                </label>
              </div>
              </div>

              <div className='abc_block'>
                <h3>Duration</h3>
                <div className='abc_checklist'>
                <label>
                  Less than 1 minute
                <input type= "checkbox"></input>
                </label>
                <label>
                  1-5 minutes
                <input type= "checkbox"></input>
                </label>
                <label>
                  5-10 minutes
                <input type= "checkbox"></input>
                </label>
                <label>
                  10-30 minutes
                <input type= "checkbox"></input>
                </label>   
              
    
                <label >
                  Other:
                <input className='underline' type= ""></input>
                </label>
              </div>
              </div>
              {/* a sliding scale that take 1-10? */}
              <div className='abc_block'>
                <h3 className=''>Intensity</h3>
                <div className='abc_checklist'>
                <label>
                  Low
                <input type= "checkbox"></input>
                </label>
                <label>
                  Medium
                <input type= "checkbox"></input>
                </label>
                <label>
                  high
                <input type= "checkbox"></input>
                </label>
               
              </div>
              </div>
              <label >
                  Additional Notes:
                <input className='underline' type= ""></input>
                </label>
              <button className="submit-btn" type="submit">
                Submit
              </button>
              </form>
              )}
            
      </div>
      
    </div>
  )
}

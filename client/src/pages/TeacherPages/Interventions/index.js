//only person accessing student profile will be the teacher
import React, {useState} from 'react'
import { Navigate, useParams, Link } from 'react-router-dom'
import {useQuery, useMutation} from '@apollo/client'
import {ADD_INTERVENTION, REMOVE_INTERVENTION} from '../../../utils/mutations'
import {QUERY_USER, QUERY_ME, QUERY_INTERVENTION_LIST} from '../../../utils/queries'
import Auth from '../../../utils/auth'
import NavigationLinks from '../../../components/NavigationLinks'
import './index.css'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Modal, Button } from 'react-bootstrap';

export default function Interventions() {

  const { username: userParam } = useParams()
// const {loading, data} = useQuery(QUERY_USER, {
//   variables: {username: userParam}
// })
const [formError, setFormError] = useState("");
const [selectedIntervention, setSelectedIntervention] = useState("");
const [showConfirmationModal, setShowConfirmationModal] = useState(false);
const [showSummaryModal, setShowSummaryModal] = useState(false);
const [selectedSummary, setSelectedSummary] = useState('');
const [selectedHardcodedIntervention, setSelectedHardcodedIntervention] = useState(null);

const [addedIntervention, setAddedIntervention] = useState([]);

const { loading, data } = useQuery(QUERY_ME)



const user = data?.me || data?.user || {};


const { loading: interventionsLoading, data: interventions } = useQuery(QUERY_INTERVENTION_LIST, {
  variables: { username: user.username },
});
const interventionList = interventions?.interventionList || []
console.log(interventionList)

console.log(user.username)
const [addInterventionToList, {error}] = useMutation(
  ADD_INTERVENTION
);

const [removeInterventionFromList] = useMutation(
  REMOVE_INTERVENTION
);


const removeIntervention = async (interventionId) => {
  setSelectedIntervention(interventionId)
  setShowConfirmationModal(true);

}


const handleDeleteConfirmation = async () => {
  try {
      await removeInterventionFromList({
          variables: { id: selectedIntervention},
          refetchQueries: [
              {query: QUERY_INTERVENTION_LIST, variables: {username: user.username}},
              {query: QUERY_ME, variables: {username: user.username}}
          ]
      })
      
  } catch (e) {
      console.log(e)
  }
  setShowConfirmationModal(false)
  setSelectedIntervention(null)
  console.log('Intervention has been removed')
}

const handleCancelConfirmation = () => {
  setShowConfirmationModal(false)
  setSelectedIntervention(null)
}

const handleShowSummaryModal = summary => {
  setSelectedSummary(summary)
  setShowSummaryModal(true)
}

const handleHideSummaryModal = () => {
  setShowSummaryModal(false)
}

const addIntervention = async (event) => {
  event.preventDefault();
  const title = event.target.elements.title.value;
  const summary = event.target.elements.summary.value;

  if (!selectedIntervention || !title || !summary) {
    setFormError("Please fill in all the fields.");
    return;
  }

  try {
    await addInterventionToList({
      variables: {
        username: user.username,
        functions: selectedIntervention,
        title: title,
        summary: summary,
      },
      refetchQueries: [
        { query: QUERY_INTERVENTION_LIST, variables: { username: user.username}},
        { query: QUERY_ME, variables: { username: user.username } },
      ],
    });
    const newIntervention = {
      type: selectedIntervention,
      title: title,
      summary: summary,
    };
    setAddedIntervention((prevAddedInterventions) => [...prevAddedInterventions, newIntervention]);
  } catch (e) {
    console.log(e);
  }

  event.target.reset();
  setSelectedIntervention('');
  setFormError("");
  console.log('Intervention has been added');
};


const isInterventionAdded = (title) => {
  const isAdded = addedIntervention[title] || interventionList.some((intervention) => intervention.functions === title);
  console.log(`Intervention title: ${title}, Is Added: ${isAdded}`);
  return isAdded;
};
const getHardcodedInterventionSummary = (intervention) => {
  switch (intervention) {
    case 'Scheduled Breaks':
      return 'Summary explaining about the scheduled breaks';
    // Add more cases for other hardcoded interventions
    default:
      return '';
  }
};


if (loading) {
  return <div className='loader'>Loading...</div>;
}

  return (
    <div>
          <h2 className='profile-name'>Intervention Ideas</h2>
          {/* find a way to provide teacher with function of behavior based on additional studnet info */}
          <div className='flex_left'>
            {/* Need a search bar and possible make this page large so you can click on the 
            intervention regardless of if the teacher added it so that it more informaton 
            can be provided --teacher much add a detail and a summary of the intervention*/}
            {/* thoughts if I add an intervention for a specific student will tha tbe annoying?
            should their be an add intervention but it adds to the entire list not for a particular student */}       
            <div className='border_solid margin_right'>
                <h3 className='center_only'>Add Intervention</h3>
                <form className='flex_column' onSubmit={(e) => addIntervention(e)}>
                  {/* this form will be in the user schema,, otherwise 
                  i will seed in intervention ideas  */}
                <label htmlFor="Functions">Pick a Function:</label>
                        <select name="" id="functions" value={selectedIntervention || ""} onChange={(e) => setSelectedIntervention(e.target.value)}>
                        <option value="">Select</option>
                        <option value="Escape">Escape</option>
                        <option value="Attention">Attention</option>
                        <option value="Sensory">Sensory</option>
                        <option value="Tangible">Tangible</option>
                        <option value="Other">Other</option>
                        </select>
                    <label>Title: <input className='title' name ='title'></input></label>
                    <label>Summary: <input className='summary' name = 'summary'></input></label>
                    <button className="submit-btn" type="submit">
                Submit
              </button>
              {formError && <p className="form-error">{formError}</p>}
                </form>
            </div>
            
            <div className=' flex_right'>
            
            <div className='border_solid'>
          <h4 className = 'center_only'>Intervention Ideas for Escape</h4>
          {/* if escape was selected then it needs to appear here */}
          <ol className='flex_column ordered_list'>
       
        {isInterventionAdded('Escape') ? (
              interventionList
                .filter((intervention) => intervention.functions === 'Escape')
                .map((intervention) => (
                  <li className='flex' key={intervention._id}>
                    <button className='list_buttons' onClick={() => handleShowSummaryModal(intervention.summary)}>
                    {intervention.title.charAt(0).toUpperCase() + intervention.title.slice(1)}
                    </button>
                    <p className='center'><DeleteForeverIcon className = 'delete' onClick={() => removeIntervention(intervention._id)}  />
         </p>      
                  </li>                
                ))
            ) : (
              ""
            )}
            <li className= 'ideas_center' onClick={() => setSelectedHardcodedIntervention('Scheduled Breaks')}>
             <button className='list_buttons'> Scheduled Breaks</button>
            </li>

          </ol>
     
          </div>
          {showConfirmationModal && (
        <Modal show={showConfirmationModal} onHide={handleCancelConfirmation}>
          <Modal.Header closeButton>
            <Modal.Title >Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this intervention?</Modal.Body>
          <Modal.Footer>
            <Button className='modal-cancel' variant='secondary' onClick={handleCancelConfirmation}>
              Cancel
            </Button>
            <Button className = 'modal-delete' variant='danger' onClick={handleDeleteConfirmation}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}

          <div className='border_solid'>
          <h4 className ='center_only'>Intervention Ideas for Access to Attention</h4>
          <ol className='flex_column ordered_list'>
        {/* possible links to articles for these interventions or instead just a module that gives a description? */}
  
        {isInterventionAdded('Attention') ? (
              interventionList
                .filter((intervention) => intervention.functions === 'Attention')
                .map((intervention) => (
                  <li className = 'flex' key={intervention._id}>
                    <button className='list_buttons' onClick={() => handleShowSummaryModal(intervention.summary)}>
                    {intervention.title.charAt(0).toUpperCase() + intervention.title.slice(1)}
                    </button>
                    <p><DeleteForeverIcon className = 'delete' onClick={() => removeIntervention(intervention._id)}  />
         </p>     
                      </li>
                ))
            ) : (
              ""
            )}
            {/* teacher helper not in switch yet */}
            <li className= 'ideas_center' onClick={() => setSelectedHardcodedIntervention('Teacher Helper')}>
             <button className='list_buttons'>Teacher Helper</button>
            </li>
          </ol>
          </div>

      

          <div className='border_solid'>
          <h4 className='center_only'>Intervention Ideas for Sensory Stimulation</h4>
          <ol className='flex_column ordered_list'>
              
        {isInterventionAdded('Sensory') ? (
              interventionList
                .filter((intervention) => intervention.functions === 'Sensory')
                .map((intervention) => (
                  <li className = 'flex' key={intervention._id}>
                    <button className='list_buttons' onClick={() => handleShowSummaryModal(intervention.summary)}>
                    {intervention.title.charAt(0).toUpperCase() + intervention.title.slice(1)}
                    </button>
                    <p className='center'><DeleteForeverIcon className = 'delete' onClick={() => removeIntervention(intervention._id)}  />
         </p>
                  </li>
                ))
            ) : (
              ""
            )}
            <li className= 'ideas_center' onClick={() => setSelectedHardcodedIntervention('Velcro')}>
             <button className='list_buttons'> Velcro</button>
            </li>
          </ol>
          </div>

          <div className='border_solid'>
          <h4 className='center_only'>Intervention Ideas for Access to Tangible</h4>
          <ol className='flex_column ordered_list'>
        {/* possible links to articles for these interventions? */}
        {isInterventionAdded('Tangible') ? (
              interventionList
                .filter((intervention) => intervention.functions === 'Tangible')
                .map((intervention) => (
                  <li className = 'flex' key={intervention._id}>
                    <button className='list_buttons' onClick={() => handleShowSummaryModal(intervention.summary)}>
                    {intervention.title.charAt(0).toUpperCase() + intervention.title.slice(1)}
                    </button>
                    <p className='center'><DeleteForeverIcon className = 'delete' onClick={() => removeIntervention(intervention._id)}  />
         </p>
                  </li>
                ))
            ) : (
              ""
            )}
             <li className= 'ideas_center' onClick={() => setSelectedHardcodedIntervention('Token Economy')}>
             <button className='list_buttons'>Token Economy</button>
            </li>
          </ol>
          </div>

          {interventionList.map((intervention) => {
  if (intervention.functions === 'Other') {
    return (
      <div className='border_solid' key={intervention._id}>
        <h4 className='center_only'>Other Intervention Ideas</h4>
        <ol className='flex_column ordered_list'>
          {/* possible links to articles for these interventions? */}
          <li className='flex'>
          <button className='list_buttons' onClick={() => handleShowSummaryModal(intervention.summary)}>
            {intervention.title.charAt(0).toUpperCase() + intervention.title.slice(1)}
            </button>
            <p className='center'><DeleteForeverIcon className = 'delete' onClick={() => removeIntervention(intervention._id)}  />
         </p> </li>
        </ol>
      </div>
    );
  }
  return null; // Return nothing if the intervention is not of the "Other" function
})}
{showSummaryModal && (
            <Modal show={showSummaryModal} onHide={handleHideSummaryModal}>
              <Modal.Header closeButton>
                <Modal.Title>Intervention Summary</Modal.Title>
              </Modal.Header>
              <Modal.Body>Summary: {selectedSummary}</Modal.Body>
              <Modal.Footer>
                <Button variant='secondary' onClick={handleHideSummaryModal}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          )}

{selectedHardcodedIntervention && (
  <Modal show={true} onHide={() => setSelectedHardcodedIntervention(null)}>
    <Modal.Header closeButton>
      <Modal.Title>Intervention Summary</Modal.Title>
    </Modal.Header>
    <Modal.Body>{getHardcodedInterventionSummary(selectedHardcodedIntervention)}</Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setSelectedHardcodedIntervention(null)}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
)}




          </div>
          </div>
          
        
         
    </div>
  )
}

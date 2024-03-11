import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ACCOMMODATION_CARDS, QUERY_USER } from '../../../utils/queries';
import { ADD_ACCOMMODATION_FOR_STUDENT, REMOVE_ACCOMMODATION_FROM_STUDENT } from '../../../utils/mutations';
import AllAccommodationCards from '../../../components/AllAccommodationCards';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Modal, Button } from 'react-bootstrap';
import './index.css'


export default function TeacherAddAccommodations() {
  const { username: userParam } = useParams();
  const [updateStudentAccommodations, setUpdateStudentAccommodations] = useState([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [addedAccommodation, setAddedAccommodation] = useState({});
  const { loading, data } = useQuery(userParam ? QUERY_USER : {}, {
    variables: { username: userParam },
  });
  const user = data?.user || {};
  const studentAccommodations = user.accommodations || [];
  const [addAccommodationForStudent, { error }] = useMutation(
    ADD_ACCOMMODATION_FOR_STUDENT
  );

  const [removeAccommodationFromStudent] = useMutation(
    REMOVE_ACCOMMODATION_FROM_STUDENT
  );

const removeAccommodation = async (accommodationId) => {
    setSelectedAccommodation(accommodationId)
    setShowConfirmationModal(true);

}

const handleDeleteConfirmation = async () => {
    try {
        await removeAccommodationFromStudent({
            variables: {username: userParam, accommodationId: selectedAccommodation},
            refetchQueries: [
                {query: QUERY_ACCOMMODATION_CARDS},
                {query: QUERY_USER, variables: {username: userParam}}
            ]
        })
        
    } catch (e) {
        console.log(e)
    }
    setShowConfirmationModal(false)
    setSelectedAccommodation(null)
    console.log('accommodation has been removed')
}

const handleCancelConfirmation = () => {
    setShowConfirmationModal(false)
    setSelectedAccommodation(null)
}

const addAccommodation = async (id, title, image) => {
    try {
        await addAccommodationForStudent({
            variables: { username: userParam, title: title, image: image },
            refetchQueries: [
              {query: QUERY_ACCOMMODATION_CARDS},
              {query: QUERY_USER, variables: {username: userParam}}
          ]
    })
    setAddedAccommodation((prevAddedAccommodations) => ({
        ...prevAddedAccommodations,
        [id]: !prevAddedAccommodations[id],
    }))
    } catch (e) {
        console.log(e)
    }
    console.log('students accommodation has been added')
}

const isAccommodationAdded = (title) => {
  if (!data || !data.user || !data.user.accommodations) {
      return false; // Return false if data is not available
  }
  const isAdded = addedAccommodation[title] || data.user.accommodations.some((accommodation) => accommodation.title === title);
  console.log(`Accommodation title: ${title}, Is Added: ${isAdded}`);
  return isAdded;
};



  if (loading) {
    return <div className='loader'>Loading...</div>;
  }

  console.log("studentAccommodations.length:", studentAccommodations.length);

  return (
      <div>
          <button className='submit-btn'>Add Accommodation</button>
          {/* a modal displays with name and description... -- save or cancel once saved it populates in the list below-- i don't want it for ever teacher just for the teacher who added it*/}
      <h2>Which accommodations does {userParam} need?</h2>

      <div className='flex_accomm '>

    
        <div className=''>
        {studentAccommodations.length > 0 && ( 
      <h3 className='center_only'>{userParam}'s Selected Accommodations</h3>
      )}
      <div className=''>
        {studentAccommodations.map((accommodation, index) => (
          <div className='center_only'>
          <div className='each_student' key={index}>
              <div className='center_only' >
                {accommodation.title}
              </div>
              <p onClick={() => removeAccommodation(accommodation._id)} className='center'>
                <DeleteForeverIcon />
              </p>
          </div>
          </div>
        ))}
      </div>
      </div>

      <AllAccommodationCards
        addAccommodation={addAccommodation}
        isAccommodationAdded = {isAccommodationAdded}
        addedAccommodation = {addedAccommodation}
        />



      </div>

      {showConfirmationModal && (
        <Modal show={showConfirmationModal} onHide={handleCancelConfirmation}>
          <Modal.Header closeButton>
            <Modal.Title >Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this student?</Modal.Body>
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




      {/* if added checkmark shows -- if clicked twice the accommodation is taken off */}
      <div className="buttons">
        <button className="profile-options logout">
          <Link className="link-to-page" to={`/studentProfile/${userParam}/dataLogging`}>
            Log Data
          </Link>
        </button>
        <button className="profile-options logout">
          <Link className="link-to-page" to={`/studentProfile/${userParam}/studentCharts`}>
            Charts
          </Link>
        </button>
      </div>

      <div className="student-list-link">
        <Link className="link-to-page logout" to={`/teacherdata/${userParam}`}>
          ← Back to Student List
        </Link>
      </div>
      <div>
    
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_USERS, QUERY_ME, QUERY_USER } from '../../../utils/queries';
import { Link } from 'react-router-dom';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Modal, Button } from 'react-bootstrap';
import { REMOVE_STUDENT_FROM_LIST } from '../../../utils/mutations';
import './index.css'
import SearchBar from '../../../components/SearchBar';
import AddIcon from '@mui/icons-material/Add';

import { ADD_STUDENT_TO_LIST } from '../../../utils/mutations';


export default function TeacherDataTracking() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [addedStudents, setAddedStudents] = useState({});
  
  const { loading, data } = useQuery(QUERY_USERS);
  const { data: user } = useQuery(QUERY_USER);
  const getAllUsers = data?.users || {};

  const { data: dataMe } = useQuery(QUERY_ME);
  const getMyStudentList = dataMe?.me.students || [];

  const [removeStudentFromList, { error }] = useMutation(REMOVE_STUDENT_FROM_LIST);

  const removeStudent = async (userId) => {
    setSelectedStudent(userId);
    setShowConfirmationModal(true);
  };

  const handleDeleteConfirmation = async () => {
    try {
      await removeStudentFromList({
        variables: { studentId: selectedStudent },
        refetchQueries: [
          { query: QUERY_ME },
          { query: QUERY_USERS },
        ],
      });
      setAddedStudents((prevAddedStudents) => {
        const updatedStudents = { ...prevAddedStudents };
        delete updatedStudents[selectedStudent];
        return updatedStudents;
      });
    } catch (e) {
      console.log(e);
    }
    setShowConfirmationModal(false);
    setSelectedStudent(null);
    console.log('Student has been removed from the list');
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setSelectedStudent(null);
  };
  const [addStudentToList, { errors }] = useMutation(ADD_STUDENT_TO_LIST);
  const addStudent = async (userId) => {
    try {
      await addStudentToList({
        variables: { studentId: userId },
      });
      setAddedStudents((prevAddedStudents) => ({
        ...prevAddedStudents,
        [userId]: !prevAddedStudents[userId],
      }));
    } catch (e) {
      console.log(e);
    }
    console.log('Student has been added to the list');
  };

  const isStudentAdded = (userId) => {
    return addedStudents[userId] || dataMe?.me.students?.some(
      (student) => student._id === userId
    );
  };

  return (
    <div>
      {/* <Link className='link-to-page logout center' to={`/addstudent/${dataMe?.me.username}`}>
        Add a Student
      </Link> */}
      <SearchBar placeholder={'Search Student Name'} 
      addStudent = {addStudent}
      isStudentAdded = {isStudentAdded}
      addedStudents={addedStudents}/>

      <h2>Pick a student to start logging data</h2>

      <div className='user_list'>
        {Object.values(getMyStudentList && getMyStudentList).map((student, index) => (
          <div className='each_student' key={index}>
            <div>
              <Link className='link-to-page logout center' to={`/studentProfile/${student.username}`}>
                {student.username}
              </Link>
              <p onClick={() => removeStudent(student._id)} className='center'>
                <DeleteForeverIcon />
              </p>
            </div>
          </div>
        ))}
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
    </div>
  );
}

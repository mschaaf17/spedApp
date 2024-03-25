import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_STUDENT_LIST, QUERY_ME } from '../../../utils/queries';
import { Modal, Button } from 'react-bootstrap';
import { REMOVE_STUDENT_FROM_LIST } from '../../../utils/mutations';
import StudentTable from '../../../components/Tables/studentTable.js';
import { ADD_STUDENT_TO_LIST } from '../../../utils/mutations';
import { AccommodationListTable } from '../../../components/Tables/GeneralTables/accommodationListTable.js';

export default function StudentList() {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [addedStudents, setAddedStudents] = useState({});

  const { loading: studentListLoading, data: studentListData } = useQuery(QUERY_STUDENT_LIST);
  //const { data: userData } = useQuery(QUERY_USER);
  const getAllStudents = studentListData?.students || [];

  const { data: meData, refetch: refetchMe } = useQuery(QUERY_ME);
  const getMyStudentList = meData?.me.students || [];

  const [removeStudentFromList, { error: removeError }] = useMutation(REMOVE_STUDENT_FROM_LIST);
  const [addStudentToList, { error: addError }] = useMutation(ADD_STUDENT_TO_LIST);

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
          { query: QUERY_STUDENT_LIST },
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
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setSelectedStudent(null);
  };

  const addStudent = async (userId) => {
    try {
      await addStudentToList({
        variables: { studentId: userId },
      });
      setAddedStudents((prevAddedStudents) => ({
        ...prevAddedStudents,
        [userId]: true,
      }));
      await refetchMe();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div>
      <div className='titleSection'>
        <h1 className="title">Students</h1>
      </div>

      <StudentTable
        placeholder={'Search Student Name'}
        isStudentAdded={(userId) => !!addedStudents[userId]}
        getAllStudents={getAllStudents}
        getMyStudentList={getMyStudentList}
        removeStudent={removeStudent}
        addStudent={addStudent}
      />
     

      {showConfirmationModal && (
        <Modal show={showConfirmationModal} onHide={handleCancelConfirmation}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete this student?</Modal.Body>
          <Modal.Footer>
            <Button className='modal-cancel' variant='secondary' onClick={handleCancelConfirmation}>
              Cancel
            </Button>
            <Button className='modal-delete' variant='danger' onClick={handleDeleteConfirmation}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

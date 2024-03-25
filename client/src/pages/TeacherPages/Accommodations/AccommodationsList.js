import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ACCOMMODATION_CARDS, QUERY_ME } from '../../../utils/queries';
import { AccommodationListTable } from '../../../components/Tables/GeneralTables/accommodationListTable';
import AddNewAccommodation from '../../../components/AddNewAccommodation';
import { ADD_ACCOMMODATION_FOR_STUDENT } from '../../../utils/mutations';
import { Button } from 'antd';
import AddAccommodationsForStudent from './AddAccommodationsForStudent';
const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

export default function AccommodationsList() {
  const { loading: accommodationLoading, data: accommodationData } = useQuery(QUERY_ACCOMMODATION_CARDS);
  const accommodationCards = accommodationData?.accommodationCards || [];

  const { loading: meLoading, data: meData } = useQuery(QUERY_ME);
  const [addAccommodationForStudent, {error: removeAccommodationError}] = useMutation(ADD_ACCOMMODATION_FOR_STUDENT)
  
  const me = meData?.me || null;
  

  
  const [isAccommodationModalOpen, setAccommodationModalOpen] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [addedStudents, setAddedStudents] = useState({});


  const handleAccommodationSelect = (accommodationId) => {
    setSelectedAccommodationId(accommodationId);
  };
  const handleAccommodationClick = (accommodationId) => {
    setSelectedAccommodationId(accommodationId);
  };

  const submitAccommodationForStudent = async(selectedAccommodationId, selectedStudentId) => {
    if(!selectedStudent) return;
    try{
      await addAccommodationForStudent({
        variables: {studentId: selectedStudentId, accommodationCardId: selectedAccommodationId}
      })
      setAddedStudents(prevAddedStudents => ({
        ...prevAddedStudents,
        [selectedStudent]: true,
      }))
    } catch (error) {
      console.error('Error saving accommodation: ', error)
    }
  }

  const openAccommodationModal = () => {
    console.log("Opening Accommodation Modal");
    setAccommodationModalOpen(true);
  }
  

  const closeAddAccommodationModal = () => {
    setAccommodationModalOpen(false);
    
  }

  return (
    <div>
      <div className='titleSection'>
        <h1 className="title">Accommodations</h1>
      </div>
      {!isAccommodationModalOpen && (
        <Button className='generalButton' onClick={openAccommodationModal}>Add Accommodation</Button>
      )}

      {isAccommodationModalOpen && <AddNewAccommodation onClose={closeAddAccommodationModal} />}


      <AccommodationListTable
       selectedAccommodationId={selectedAccommodationId}
       accommodationCards={accommodationCards}
       meData={me}
       accommodationLoading={accommodationLoading}
       onAccommodationClick={handleAccommodationClick} 
       submitAccommodationForStudent= {submitAccommodationForStudent}
       selectedStudent = {selectedStudent}
       setSelectedStudent={setSelectedStudent}
      />
    </div>
  );
}

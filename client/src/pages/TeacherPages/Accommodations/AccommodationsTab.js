import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ACCOMMODATION_TEMPLATES, QUERY_ME } from '../../../utils/queries';
import { AccommodationListTable } from '../../../components/Tables/GeneralTables/accommodationListTable';
import AddNewAccommodation from '../../../components/AddNewAccommodation/AddNewAccommodation';
import { ADD_ACCOMMODATION_FOR_STUDENT } from '../../../utils/mutations';
import { Button } from 'antd';
import AddAccommodationsForStudent from './AddAccommodationsForStudent';
const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

export default function AccommodationsTab() {
  const { data: accommodationsData, loading: accommodationsLoading } = useQuery(QUERY_ACCOMMODATION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const { data: meData, loading: meLoading } = useQuery(QUERY_ME);
  const [addAccommodationForStudent] = useMutation(ADD_ACCOMMODATION_FOR_STUDENT);

  const handleAssignAccommodation = async (accommodationId, studentId) => {
    await addAccommodationForStudent({
      variables: { accommodationCardId: accommodationId, studentId },
      refetchQueries: [{ query: QUERY_ME }]
    });
  };

  const [isAccommodationModalOpen, setAccommodationModalOpen] = useState(false);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
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

  const accommodationCards = accommodationsData?.accommodationList || [];

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
        accommodationCards={accommodationCards}
        meData={meData?.me || null}
        accommodationLoading={accommodationsLoading || meLoading}
        submitAccommodationForStudent={handleAssignAccommodation}
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
      />
    </div>
  );
}

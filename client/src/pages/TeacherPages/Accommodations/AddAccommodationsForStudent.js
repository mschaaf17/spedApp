// import React, { useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { useQuery, useMutation } from '@apollo/client';
// import { QUERY_ACCOMMODATION_CARDS, QUERY_USER } from '../../../utils/queries';
// import { REMOVE_ACCOMMODATION_FROM_STUDENT } from '../../../utils/mutations';
// import MenuSideBar from '../../../components/MenuSideBar/MenuSideBar';
// import { Modal, Button } from 'react-bootstrap';
// import AccommodationTable from '../../../components/Tables/StudentSpecificTables/accommodationTable';
// import './index.css';

// export default function AddAccommodationsForStudent() {
//   const { username: userParam } = useParams();
//   const [selectedAccommodation, setSelectedAccommodation] = useState(null);
//   const [showConfirmationModal, setShowConfirmationModal] = useState(false);
//   const {data: accommodationCards} = useQuery(QUERY_ACCOMMODATION_CARDS)
//   const { loading, data: userData } = useQuery(userParam ? QUERY_USER : {}, {
//     variables: { username: userParam },
//   });


//   //need to query users accommodation to display and if the user has the same accommodations then a delete forever icon needs to display in actions
//   //if the user does not yet have that accommodation an add icon needs to display in actions
//   console.log("accommodation cards " + accommodationCards)
//   console.log("query user: " + userData)
//   const [removeAccommodationFromStudent] = useMutation(
//     REMOVE_ACCOMMODATION_FROM_STUDENT
//   );

//   const removeAccommodation = async (accommodationId) => {
//     setSelectedAccommodation(accommodationId);
//     setShowConfirmationModal(true);
//   }; 

//   const handleDeleteConfirmation = async () => {
//     try {
//       await removeAccommodationFromStudent({
//         variables: { username: userParam, accommodationId: selectedAccommodation },
//         refetchQueries: [
//           { query: QUERY_ACCOMMODATION_CARDS },
//           { query: QUERY_USER, variables: { username: userParam } }
//         ]
//       });
//     } catch (e) {
//       console.log(e);
//     }
//     setShowConfirmationModal(false);
//     setSelectedAccommodation(null);
//     console.log('accommodation has been removed');
//   };

//   const handleCancelConfirmation = () => {
//     setShowConfirmationModal(false);
//     setSelectedAccommodation(null);
//   };

//   const handleMenuItemClick = (formName) => {
//     // Implement functionality here if needed
//   };

//   if (loading) {
//     return <div className='loader'>Loading...</div>;
//   }

//   return (
//     <div>
//       <h2>Select accommodations for {userParam}</h2>
      
//       <AccommodationTable
//         accommodationCards={accommodationCards?.accommodations || []}
//         selectedAccommodationId={selectedAccommodation}
//         userData={userData}
//         accommodationLoading={loading}
//         onAccommodationClick={removeAccommodation}
//         submitAccommodationForStudent={() => {}}
//         selectedStudent={null}
//         setSelectedStudent={() => {}}
//       />

//       {showConfirmationModal && (
//         <Modal show={showConfirmationModal} onHide={handleCancelConfirmation}>
//           <Modal.Header closeButton>
//             <Modal.Title >Confirmation</Modal.Title>
//           </Modal.Header>
//           <Modal.Body>Are you sure you want to delete this student?</Modal.Body>
//           <Modal.Footer>
//             <Button className='modal-cancel' variant='secondary' onClick={handleCancelConfirmation}>
//               Cancel
//             </Button>
//             <Button className='modal-delete' variant='danger' onClick={handleDeleteConfirmation}>
//               Delete
//             </Button>
//           </Modal.Footer>
//         </Modal>
//       )}
//     </div>
//   );
// }

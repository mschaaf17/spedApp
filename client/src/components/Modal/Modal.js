import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

//I need to be able to pass in the show confirmation modal state
//I have to be able to use show confirmation modal across the page
//use props to change the body text
const ConfirmationModal = ({ showConfirmationModal, onHideConfirmationModal, onConfirmDelete, bodyText }) => {
  return (
        <Modal showConfirmationModal={showConfirmationModal} onHideConfirmationModal={onHideConfirmationModal}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Body>{bodyText}</Modal.Body>
          <Modal.Footer>
            <Button className='modal-cancel' variant='secondary' onClick={onHideConfirmationModal}>
              Cancel
            </Button>
            <Button className='modal-delete' variant='danger' onClick={onConfirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
  );
};

export default ConfirmationModal;

import React, { useState } from 'react';
import { Modal, Button, Radio, Space, message } from 'antd';
import { useMutation } from '@apollo/client';
import { LOG_ACCOMMODATION_OFFERED } from '../../utils/mutations';
import { QUERY_USER } from '../../utils/queries';

const AccommodationOfferModal = ({ 
  visible, 
  onCancel, 
  accommodation, 
  studentId, 
  username 
}) => {
  const [accepted, setAccepted] = useState(null);
  const [loading, setLoading] = useState(false);

  const [logAccommodationOffered] = useMutation(LOG_ACCOMMODATION_OFFERED, {
    refetchQueries: [
      { query: QUERY_USER, variables: { identifier: username, isUsername: true } }
    ]
  });

  const handleSubmit = async () => {
    if (accepted === null) {
      message.error('Please select whether the accommodation was accepted');
      return;
    }

    setLoading(true);
    try {
      await logAccommodationOffered({
        variables: {
          accommodationId: accommodation._id,
          studentId,
          accepted,
          time: new Date().toISOString()
        }
      });

      message.success(`Accommodation ${accepted ? 'accepted' : 'declined'} successfully`);
      onCancel();
      setAccepted(null);
    } catch (error) {
      console.error('Error logging accommodation offer:', error);
      message.error('Failed to log accommodation offer');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAccepted(null);
    onCancel();
  };

  return (
    <Modal
      title={`Offer Accommodation: ${accommodation?.title}`}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          disabled={accepted === null}
          onClick={handleSubmit}
        >
          Log Offer
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <p><strong>Accommodation:</strong> {accommodation?.title}</p>
        <p><strong>Description:</strong> {accommodation?.description}</p>
        <p><strong>Student:</strong> {username}</p>
      </div>
      
      <div>
        <p><strong>Was this accommodation accepted by the student?</strong></p>
        <Radio.Group 
          value={accepted} 
          onChange={(e) => setAccepted(e.target.value)}
        >
          <Space direction="vertical">
            <Radio value={true}>Yes, the student accepted this accommodation</Radio>
            <Radio value={false}>No, the student declined this accommodation</Radio>
          </Space>
        </Radio.Group>
      </div>
    </Modal>
  );
};

export default AccommodationOfferModal; 
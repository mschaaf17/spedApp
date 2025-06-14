import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Table, Button, Popconfirm, Select } from 'antd';
import { QUERY_USER, QUERY_ACCOMMODATION_TEMPLATES } from '../../../utils/queries';
import { ADD_ACCOMMODATION_FOR_STUDENT, REMOVE_ACCOMMODATION_FROM_STUDENT } from '../../../utils/mutations';
import StudentAccommodationsTable from '../../../components/Tables/StudentSpecificTables/accommodationTable';

export default function StudentAccommodations() {
  const { username: userParam } = useParams();
  const { data, loading } = useQuery(QUERY_USER, {
    variables: { identifier: userParam, isUsername: true }
  });
  const user = data?.user;
  const accommodations = user?.accommodations || [];

  const [addAccommodationForStudent] = useMutation(ADD_ACCOMMODATION_FOR_STUDENT);
  const [removeAccommodationFromStudent] = useMutation(REMOVE_ACCOMMODATION_FROM_STUDENT);

  const { data: allAccommodationsData } = useQuery(QUERY_ACCOMMODATION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const allAccommodations = allAccommodationsData?.accommodationList || [];

  const [selectedAccommodation, setSelectedAccommodation] = useState(null);

  // Only show accommodations not already assigned
  const assignedIds = new Set(accommodations.map(a => a._id));
  const unassignedAccommodations = allAccommodations.filter(a => !assignedIds.has(a._id));

  console.log(unassignedAccommodations);

  const handleAddAccommodation = async (accommodationId) => {
    await addAccommodationForStudent({
      variables: { accommodationId, studentId: user._id },
      refetchQueries: [{ query: QUERY_USER, variables: { identifier: userParam, isUsername: true } }]
    });
    setSelectedAccommodation(null);
  };

  const handleRemoveAccommodation = async (accommodationId) => {
    await removeAccommodationFromStudent({
      variables: { accommodationId, studentId: user._id },
      refetchQueries: [{ query: QUERY_USER, variables: { identifier: userParam, isUsername: true } }]
    });
  };

  return (
    <div>
      <p> need to fix the created at for when a student is assigned an accommodations similar to intervventions</p>
      <h2>{user?.username} assigned accommodations</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Select
          style={{ width: 200 }}
          placeholder="Select accommodation"
          value={selectedAccommodation}
          onChange={setSelectedAccommodation}
          options={unassignedAccommodations.map(a => ({
            value: a._id,
            label: a.title,
          }))}
        />
        <Button
          type="primary"
          disabled={!selectedAccommodation}
          onClick={() => handleAddAccommodation(selectedAccommodation)}
        >
          Assign
        </Button>
      </div>
      <StudentAccommodationsTable
        accommodations={accommodations}
        loading={loading}
        onRemoveAccommodation={handleRemoveAccommodation}
      />
    </div>
  );
}

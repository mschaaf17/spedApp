import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Table, Button, Popconfirm, Select } from 'antd';
import { QUERY_USER, QUERY_INTERVENTION_TEMPLATES } from '../../../utils/queries';
import { REMOVE_INTERVENTION_FROM_STUDENT, ADD_INTERVENTION_FOR_STUDENT } from '../../../utils/mutations';
import StudentInterventionsTable from '../../../components/Tables/StudentSpecificTables/interventionsTable';


//will need to stop users from adding an intervention on the same day!!! they will need to be notified an intervention was already assigned for that date!!!



export default function StudentInterventions() {
  const { username: userParam } = useParams();
  const { data, loading } = useQuery(QUERY_USER, {
    variables: { identifier: userParam, isUsername: true }
  });
  const user = data?.user;
  const interventions = user?.interventions || [];
  const behaviors = user?.behaviorFrequencies || [];

  const [removeInterventionForStudent] = useMutation(REMOVE_INTERVENTION_FROM_STUDENT);
  const [addInterventionForStudent] = useMutation(ADD_INTERVENTION_FOR_STUDENT);

  const { data: allInterventionsData } = useQuery(QUERY_INTERVENTION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const allInterventions = allInterventionsData?.interventionList || [];

  const [selectedBehavior, setSelectedBehavior] = useState(null);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  // Set of assigned intervention titles for the selected behavior
  const assignedTitlesForBehavior = new Set(
    interventions
      .filter(i => i.behaviorId?._id === selectedBehavior)
      .map(i => i.title)
  );

  // Only show interventions not already assigned to this behavior
  const unassignedInterventions = allInterventions.filter(
    i => !assignedTitlesForBehavior.has(i.title)
  );

  const handleRemoveIntervention = async (interventionId) => {
    await removeInterventionForStudent({
      variables: { interventionId, studentId: user._id },
      refetchQueries: [{ query: QUERY_USER, variables: { identifier: userParam, isUsername: true } }]
    });
  };

  const handleAddIntervention = async (interventionId, behaviorId) => {
    await addInterventionForStudent({
      variables: { interventionId, studentId: user._id, behaviorId },
      refetchQueries: [{ query: QUERY_USER, variables: { identifier: userParam, isUsername: true } }]
    });
  };

  return (
    <div>
        <h2>{user?.username} assigned interventions</h2>
         <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Select
          style={{ width: 200 }}
          placeholder="Select behavior"
          value={selectedBehavior}
          onChange={value => {
            setSelectedBehavior(value);
            setSelectedIntervention(null); // reset intervention when behavior changes
          }}
          options={behaviors.map(b => ({
            value: b._id,
            label: b.behaviorTitle,
          }))}
        />
        <Select
          style={{ width: 200 }}
          placeholder="Select intervention"
          value={selectedIntervention}
          onChange={setSelectedIntervention}
          disabled={!selectedBehavior}
          options={unassignedInterventions.map(i => ({
            value: i._id,
            label: i.title,
          }))}
        />
        <Button
          type="primary"
          disabled={!selectedBehavior || !selectedIntervention}
          onClick={() => {
            handleAddIntervention(selectedIntervention, selectedBehavior);
            setSelectedIntervention(null);
          }}
        >
          Assign
        </Button>
      </div>
     
      <StudentInterventionsTable
        user={user}
        interventions={interventions}
        allInterventions={allInterventions}
        loading={loading}
        onRemoveIntervention={handleRemoveIntervention}
        onAddIntervention={handleAddIntervention}
      />
    </div>
  );
}
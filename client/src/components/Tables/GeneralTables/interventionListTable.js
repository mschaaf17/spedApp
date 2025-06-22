import React, { useState } from 'react';
import { Table, Select, Space, Button, Modal } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME, QUERY_INTERVENTION_TEMPLATES, QUERY_ASSIGNED_INTERVENTIONS } from '../../../utils/queries';
import { ADD_INTERVENTION_FOR_STUDENT } from '../../../utils/mutations';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

const InterventionDataTable = ({ 
  submitInterventionForStudent,
  meData,
  interventionLoading,
  onRemoveIntervention
}) => {
  const { loading, data } = useQuery(QUERY_ME);
  const { loading: interventionsLoading, data: interventionsData } = useQuery(QUERY_INTERVENTION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const [addInterventionForStudent] = useMutation(ADD_INTERVENTION_FOR_STUDENT);
  const { data: assignedData } = useQuery(QUERY_ASSIGNED_INTERVENTIONS, {
    variables: { isTemplate: false, isActive: true }
  });

  const user = data?.me || meData || {};
  const students = user.students || [];
  const interventionList = interventionsData?.interventionList?.filter(intervention => intervention.isTemplate) || [];
  const assignedInterventions = assignedData?.interventionList || [];
  
  const [visibleSelectRowId, setVisibleSelectRowId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);

  const handleAddIntervention = async (interventionId, studentId, behaviorId) => {
    try {
      if (submitInterventionForStudent) {
        await submitInterventionForStudent(interventionId, studentId, behaviorId);
      } else {
        await addInterventionForStudent({
          variables: {
            interventionId,
            studentId,
            behaviorId,
          },
          refetchQueries: [{ query: QUERY_ME }]
        });
      }
      setVisibleSelectRowId(null);
      setSelectedStudent(null);
      setSelectedBehavior(null);
    } catch (error) {
      console.error('Error adding intervention:', error);
    }
  };

  const handleRemoveIntervention = (interventionId, interventionTitle) => {
    Modal.confirm({
      title: 'Confirm Deletion',
      content: `Are you sure you want to delete "${interventionTitle}"? This action cannot be undone and will permanently remove this intervention template.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        onRemoveIntervention(interventionId);
      },
    });
  };

  // For each row, show a multi-step select for student, then behavior
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Function',
      dataIndex: 'function',
      key: 'function',
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt) =>
        createdAt
          ? new Date(
              typeof createdAt === "number"
                ? createdAt
                : /^\d+$/.test(createdAt)
                ? Number(createdAt)
                : createdAt
            ).toLocaleDateString()
          : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        // Check if any students have this intervention assigned
        const studentsWithIntervention = assignedInterventions.filter(ai => 
          ai.title === record.title
        );

        return (
          <Space>
            {visibleSelectRowId !== record._id ? (
              <Button
                icon={<PersonAddAlt1Icon />}
                onClick={() => setVisibleSelectRowId(record._id)}
              >
                Add to student
              </Button>
            ) : (
              <>
                <Select
                  placeholder="Select student"
                  style={{ width: 180 }}
                  value={selectedStudent}
                  onChange={value => {
                    setSelectedStudent(value);
                    setSelectedBehavior(null);
                  }}
                  options={students
                    .filter(s => {
                      // Filter out students who already have this intervention assigned
                      return !assignedInterventions.some(ai =>
                        ai.studentId?._id === s._id &&
                        ai.title === record.title
                      );
                    })
                    .map(s => ({
                      value: s._id,
                      label: `${s.lastName}, ${s.firstName} (${s.studentSchoolId})`
                    }))
                  }
                />
                {selectedStudent && (
                  <Select
                    placeholder="Select behavior"
                    style={{ width: 180 }}
                    value={selectedBehavior}
                    onChange={setSelectedBehavior}
                    options={
                      students.find(s => s._id === selectedStudent)?.behaviorFrequencies
                        // Only show behaviors NOT already assigned this intervention
                        .filter(b => !assignedInterventions.some(ai =>
                          ai.studentId?._id === selectedStudent &&
                          ai.title === record.title &&
                          ai.behaviorId?._id === b._id
                        ))
                        .map(b => ({
                          value: b._id,
                          label: b.behaviorTitle
                        })) || []
                    }
                  />
                )}
                <Button
                  type="primary"
                  disabled={!selectedStudent || !selectedBehavior}
                  onClick={() => handleAddIntervention(record._id, selectedStudent, selectedBehavior)}
                >
                  Confirm
                </Button>
                <Button onClick={() => {
                  setVisibleSelectRowId(null);
                  setSelectedStudent(null);
                  setSelectedBehavior(null);
                }}>
                  Cancel
                </Button>
              </>
            )}
            
            {/* Remove button - only show if no students have this intervention */}
            {studentsWithIntervention.length === 0 && onRemoveIntervention && (
              <Button
                danger
                icon={<DeleteForeverIcon />}
                onClick={() => handleRemoveIntervention(record._id, record.title)}
                title="Remove intervention (only available if no students have it assigned)"
              >
                Remove
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={interventionList}
      rowKey="_id"
      loading={loading || interventionsLoading || interventionLoading}
    />
  );
};

export default InterventionDataTable;

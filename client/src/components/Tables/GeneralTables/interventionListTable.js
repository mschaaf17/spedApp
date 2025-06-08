import React, { useState } from 'react';
import { Table, Select, Space, Button, Modal } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME, QUERY_INTERVENTION_TEMPLATES } from '../../../utils/queries';
import { ADD_INTERVENTION_TO_STUDENT } from '../../../utils/mutations';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

const InterventionDataTable = () => {
  const { loading, data } = useQuery(QUERY_ME);
  const { loading: interventionsLoading, data: interventionsData } = useQuery(QUERY_INTERVENTION_TEMPLATES, {
    variables: { isTemplate: true, isActive: true }
  });
  const [addInterventionToStudent] = useMutation(ADD_INTERVENTION_TO_STUDENT);

  const user = data?.me || {};
  const students = user.students || [];
  const interventionList = interventionsData?.interventionList?.filter(intervention => intervention.isTemplate) || [];
  console.log(interventionList + "interventionList")
  const [visibleSelectRowId, setVisibleSelectRowId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBehavior, setSelectedBehavior] = useState(null);

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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
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
                  setSelectedBehavior(null); // Reset behavior when student changes
                }}
                options={students.map(s => ({
                  value: s._id,
                  label: `${s.lastName}, ${s.firstName} (${s.studentSchoolId})`
                }))}
              />
              {selectedStudent && (
                <Select
                  placeholder="Select behavior"
                  style={{ width: 180 }}
                  value={selectedBehavior}
                  onChange={setSelectedBehavior}
                  options={
                    students.find(s => s._id === selectedStudent)?.behaviorFrequencies?.map(b => ({
                      value: b._id,
                      label: b.behaviorTitle
                    })) || []
                  }
                />
              )}
              <Button
                type="primary"
                disabled={!selectedStudent || !selectedBehavior}
                onClick={async () => {
                  // Call your mutation here
                  await addInterventionToStudent({
                    variables: {
                      interventionId: record._id,
                      studentId: selectedStudent,
                      behaviorId: selectedBehavior,
                    },
                    // refetchQueries: [...]
                  });
                  setVisibleSelectRowId(null);
                  setSelectedStudent(null);
                  setSelectedBehavior(null);
                }}
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
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={interventionList}
      rowKey="_id"
      loading={loading || interventionsLoading}
    />
  );
};

export default InterventionDataTable;

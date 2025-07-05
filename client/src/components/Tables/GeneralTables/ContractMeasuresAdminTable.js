import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { useMutation, useQuery } from '@apollo/client';
import { ADD_CONTRACT_MEASURE, DELETE_CONTRACT_MEASURE } from '../../../utils/mutations';
import { QUERY_STUDENT_LIST } from '../../../utils/queries';

const { Option } = Select;

const ContractMeasuresAdminTable = ({ contractMeasures = [], refetchContractMeasures, contracts = [] }) => {
  const [deleteContractMeasure] = useMutation(DELETE_CONTRACT_MEASURE);
  
  // Query all students to check if they have contract measures assigned
  const { data: studentsData } = useQuery(QUERY_STUDENT_LIST);
  const allStudents = studentsData?.students || [];

  // Helper: check if a measure is in use (either in contracts or assigned to students)
  const isMeasureInUse = (measureId) => {
    // Debug: print all students and their contractDataMeasures
    console.log('DEBUG: allStudents', allStudents);
    allStudents.forEach(student => {
      console.log('DEBUG: student', student._id, 'contractDataMeasures:', student.contractDataMeasures);
    });

    // Check if used in any contracts
    const usedInContracts = contracts && contracts.some(contract =>
      contract.contractMeasures && contract.contractMeasures.some(m => m._id === measureId)
    );
    
    // Check if assigned to any student's contractDataMeasures array (handle both ObjectId and populated object)
    const assignedToStudents = allStudents.some(student =>
      student.contractDataMeasures && student.contractDataMeasures.some(m =>
        (typeof m === 'object' ? m._id : m) === measureId
      )
    );
    
    return usedInContracts || assignedToStudents;
  };

  const handleDelete = async (record) => {
    if (isMeasureInUse(record._id)) {
      message.error('Cannot delete: This contract measure is in use by a student.');
      return;
    }
    
    Modal.confirm({
      title: 'Confirm Deletion',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone and will permanently remove this contract measure template.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteContractMeasure({
            variables: { contractMeasureId: record._id },
          });
          message.success('Contract measure deleted successfully');
          if (refetchContractMeasures) refetchContractMeasures();
        } catch (error) {
          console.error('Error deleting contract measure:', error);
          message.error(error.message || 'Failed to delete contract measure');
        }
      },
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isMeasureInUse(record._id) ? (
            <Tag color="default">In use – cannot delete</Tag>
          ) : (
            <Button size="small" danger onClick={() => handleDelete(record)}>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        className="accent-table accent-table-green"
        columns={columns}
        dataSource={contractMeasures}
        rowKey="_id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default ContractMeasuresAdminTable; 
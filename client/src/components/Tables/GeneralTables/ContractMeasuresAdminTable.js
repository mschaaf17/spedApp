import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { useMutation } from '@apollo/client';
import { ADD_CONTRACT_MEASURE, DELETE_CONTRACT_MEASURE } from '../../../utils/mutations';

const { Option } = Select;

const ContractMeasuresAdminTable = ({ contractMeasures = [], refetchContractMeasures, contracts = [] }) => {
  const [deleteContractMeasure] = useMutation(DELETE_CONTRACT_MEASURE);

  // Helper: check if a measure is in use
  const isMeasureInUse = (measureId) => {
    return contracts && contracts.some(contract =>
      contract.contractMeasures && contract.contractMeasures.some(m => m._id === measureId)
    );
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
      <Table columns={columns} dataSource={contractMeasures} rowKey="_id" pagination={{ pageSize: 10 }} />
    </div>
  );
};

export default ContractMeasuresAdminTable; 
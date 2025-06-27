import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { useMutation } from '@apollo/client';
import { ADD_CONTRACT_MEASURE, DELETE_CONTRACT_MEASURE } from '../../../utils/mutations';

const { Option } = Select;

const ContractMeasuresAdminTable = ({ contractMeasures = [], refetchContractMeasures, contracts = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMeasure, setEditingMeasure] = useState(null);
  const [form] = Form.useForm();

  const [addContractMeasure] = useMutation(ADD_CONTRACT_MEASURE);
  const [deleteContractMeasure] = useMutation(DELETE_CONTRACT_MEASURE);

  const handleAdd = () => {
    setIsEditMode(false);
    setEditingMeasure(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record) => {
    setIsEditMode(true);
    setEditingMeasure(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      category: record.category,
    });
    setIsModalOpen(true);
  };

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

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form values:', values); // Debug log
      
      if (isEditMode) {
        // TODO: Implement edit mutation
        message.info('Edit contract measure not implemented yet');
      } else {
        await addContractMeasure({
          variables: {
            name: values.name,
            description: values.description,
          },
        });
        message.success('Contract measure added');
        setIsModalOpen(false);
        form.resetFields();
        if (refetchContractMeasures) refetchContractMeasures();
      }
    } catch (error) {
      console.error('Form validation or submission error:', error);
      if (error.errorFields) {
        // Form validation error
        message.error('Please fill in all required fields');
      } else {
        // API error
        message.error('Failed to save contract measure: ' + (error.message || 'Unknown error'));
      }
    }
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" onClick={handleAdd}>Add Contract Data Measure</Button>
      </div>
      <Table columns={columns} dataSource={contractMeasures} rowKey="_id" pagination={{ pageSize: 10 }} />
      <Modal
        title={isEditMode ? 'Edit Contract Data Measure' : 'Add Contract Data Measure'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}
        okText={isEditMode ? 'Save' : 'Add'}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="name" 
            label="Name" 
            rules={[{ required: true, message: 'Please enter a name' }]}
          > 
            <Input placeholder="Enter contract measure name" /> 
          </Form.Item>
          <Form.Item 
            name="description" 
            label="Description" 
            rules={[{ required: true, message: 'Please enter a description' }]}
          > 
            <Input.TextArea rows={2} placeholder="Enter contract measure description" /> 
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractMeasuresAdminTable; 
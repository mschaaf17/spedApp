import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm } from 'antd';
import { useMutation } from '@apollo/client';
import { ADD_CONTRACT_MEASURE, DELETE_CONTRACT_MEASURE } from '../../../utils/mutations';

const { Option } = Select;

const ContractMeasuresAdminTable = ({ contractMeasures = [], refetchContractMeasures }) => {
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

  const handleDelete = async (record) => {
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
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEditMode) {
        // TODO: Implement edit mutation
        message.info('Edit contract measure not implemented yet');
      } else {
        await addContractMeasure({
          variables: {
            name: values.name,
            description: values.description,
            category: values.category || 'General',
          },
        });
        message.success('Contract measure added');
        setIsModalOpen(false);
        if (refetchContractMeasures) refetchContractMeasures();
      }
    } catch (error) {
      message.error('Failed to save contract measure');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Status', dataIndex: 'isActive', key: 'isActive', render: (active) => <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>Edit</Button>
          <Popconfirm title="Delete this contract measure?" onConfirm={() => handleDelete(record)} okText="Delete" cancelText="Cancel">
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
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
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}> <Input /> </Form.Item>
          <Form.Item name="description" label="Description"> <Input.TextArea rows={2} /> </Form.Item>
          <Form.Item name="category" label="Category"> <Input /> </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractMeasuresAdminTable; 
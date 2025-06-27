import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useMutation } from '@apollo/client';
import { ADD_CONTRACT_MEASURE } from '../../utils/mutations';

const AddNewContractMeasure = ({ onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [addContractMeasure, { loading }] = useMutation(ADD_CONTRACT_MEASURE);

  const handleSubmit = async (values) => {
    try {
      await addContractMeasure({
        variables: {
          name: values.name,
          description: values.description,
        },
      });
      message.success('Contract measure added successfully');
      form.resetFields();
      if (onSuccess) {
        onSuccess();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error adding contract measure:', error);
      message.error('Failed to add contract measure: ' + (error.message || 'Unknown error'));
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="Contract Measure Name"
          rules={[{ required: true, message: 'Please enter a name' }]}
        >
          <Input placeholder="Enter contract measure name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Enter contract measure description"
          />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Add Contract Measure
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddNewContractMeasure; 
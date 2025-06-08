import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Input, Form, Select, Button, message } from 'antd';
import { ADD_INTERVENTION_TEMPLATE } from '../../utils/mutations'; // You need to define this
import { QUERY_INTERVENTION_TEMPLATES } from '../../utils/queries'; // You need to define this

const { TextArea } = Input;

const AddNewIntervention = ({ onClose, updateInterventionData, interventionData }) => {
  const { data, loading, error, refetch } = useQuery(QUERY_INTERVENTION_TEMPLATES);

  const [addInterventionTemplate] = useMutation(ADD_INTERVENTION_TEMPLATE);
  const [form] = Form.useForm();
  const [tableData, setTableData] = useState([]);

  const showMessage = (title) => {
    message.success(`Intervention "${title}" saved`, 2, onClose);
  };

  useEffect(() => {
    // This effect will run every time tableData changes
    console.log("Intervention table data updated:", tableData);
  }, [tableData]);

  const handleSubmit = async (values) => {
    const { title, summary, function: interventionFunction } = values;
    try {
      await addInterventionTemplate({
        variables: {
          title,
          summary,
          function: interventionFunction,
          isTemplate: true,
          isActive: true,
        },
      });
      refetch && refetch();
      showMessage(title);
      setTableData([...tableData, { title, summary, function: interventionFunction }]);
      updateInterventionData([...interventionData, { title, summary, function: interventionFunction }]);
      form.resetFields();
    } catch (error) {
      console.error('Error saving intervention template: ', error);
      message.error('Failed to save intervention template');
    }
  };

  return (
    <>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        style={{ maxWidth: 600 }}
        onFinish={handleSubmit}
      >
        <h4>New Intervention</h4>
        <Button onClick={onClose}>Close</Button>
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please input the intervention title!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Function"
          name="function"
          rules={[{ required: true, message: 'Please select the function!' }]}
        >
          <Select>
            <Select.Option value="Escape">Escape</Select.Option>
            <Select.Option value="Attention">Attention</Select.Option>
            <Select.Option value="Sensory">Sensory</Select.Option>
            <Select.Option value="Tangible">Tangible</Select.Option>
            <Select.Option value="Other">Other</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          label="Summary"
          name="summary"
          rules={[{ required: true, message: 'Please input the summary!' }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    </>
  );
};

export default AddNewIntervention;

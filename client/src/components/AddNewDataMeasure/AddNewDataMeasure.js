import React, { useState } from 'react';
import { Input, Checkbox, Form, Select, Upload, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
const { TextArea } = Input;

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const AddNewDataMeasure = ({onClose}) => {
  const [componentDisabled, setComponentDisabled] = useState(false);
  const handleSubmit = () =>{
    //need the mutation to add a duration or frequency here
  }

  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        style={{ maxWidth: 600 }}
      >
         <h4>New Data Measure</h4>
        <Button onClick={onClose}>
          Close
        </Button>
        <Form.Item label="Title">
          <Input />
        </Form.Item>  
        <Form.Item label="Select Data Type">
          <Select>
            <Select.Option value="frequency">Frequency</Select.Option>
            <Select.Option value="duration">Duration</Select.Option>
          </Select>
        </Form.Item>     
        <Form.Item label="Operational Definition">
          <TextArea rows={4} />
        </Form.Item>
     
        <Checkbox
          checked={componentDisabled}
          onChange={(e) => setComponentDisabled(e.target.checked)}
        >
          Need to be enabled to add student
        </Checkbox>
        <Form.Item disabled={componentDisabled} label="Select student">
          <Select>
            <Select.Option value="demo">Demo</Select.Option>
          </Select>
        </Form.Item>
        <Button type="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </Form>
    </>
  );
};

export default AddNewDataMeasure;

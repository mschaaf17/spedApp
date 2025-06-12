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

const AddNewAccommodation = ({onClose}) => {
  const [componentDisabled, setComponentDisabled] = useState(false);
  const handleSubmit = () =>{
    //need the mutation to add an accommodatioToList here
  }

  return (
    <>
      <Form
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        style={{ maxWidth: 600 }}
      >
         <h4>New Accommodation</h4>
        <Button onClick={onClose}>
          Close
        </Button>
        <Form.Item label="Title">
          <Input />
        </Form.Item>       
        <Form.Item label="Description">
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item label="Upload" valuePropName="fileList" getValueFromEvent={normFile}>
          <Upload action="/upload.do" listType="picture-card">
            <button style={{ border: 0, background: 'none' }} type="button">
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </button>
          </Upload>
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

export default AddNewAccommodation;

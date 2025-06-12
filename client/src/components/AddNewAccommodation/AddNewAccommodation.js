import React, { useState } from 'react';
import { Input, Checkbox, Form, Select, Upload, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { ADD_ACCOMMODATION_TEMPLATE } from '../../utils/mutations';
const { TextArea } = Input;

const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};

const AddNewAccommodation = ({onClose}) => {
  const [componentDisabled, setComponentDisabled] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [uploadedImagePath, setUploadedImagePath] = useState('');

  const [addAccommodationTemplate] = useMutation(ADD_ACCOMMODATION_TEMPLATE);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Add the uploaded image path to the values
      const accommodationData = {
        title: values.title,
        description: values.description,
        image: uploadedImagePath,
        isTemplate: true,
        isActive: true
      };

      const { data } = await addAccommodationTemplate({
        variables: accommodationData
      });

      message.success('Accommodation added successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding accommodation:', error);
      message.error('Failed to add accommodation');
    }
  }

  const handleUpload = async ({ file, onSuccess, onError }) => {
    // Validate file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      onError(new Error('Invalid file type'));
      return;
    }

    // Validate file size (5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      onError(new Error('File too large'));
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('Uploading file:', file.name);
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload response:', data);
      
      if (!data.path) {
        throw new Error('No file path received from server');
      }

      setUploadedImagePath(data.path);
      message.success(`${file.name} uploaded successfully`);
      onSuccess(data);
    } catch (error) {
      console.error('Upload error:', error);
      message.error(`Upload failed: ${error.message}`);
      onError(error);
    }
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
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
      >
         <h4>New Accommodation</h4>
        <Button onClick={onClose}>
          Close
        </Button>
        <Form.Item 
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please input the title!' }]}
        >
          <Input />
        </Form.Item>       
        <Form.Item 
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please input the description!' }]}
        >
          <TextArea rows={4} />
        </Form.Item>
        <Form.Item 
          name="image"
          label="Upload" 
          valuePropName="fileList" 
          getValueFromEvent={normFile}
          rules={[{ required: true, message: 'Please upload an image!' }]}
        >
          <Upload
            customRequest={handleUpload}
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList }) => setFileList(fileList)}
            maxCount={1}
            onPreview={handlePreview}
            beforeUpload={(file) => {
              const isImage = file.type.startsWith('image/');
              if (!isImage) {
                message.error('You can only upload image files!');
              }
              const isLt5M = file.size / 1024 / 1024 < 5;
              if (!isLt5M) {
                message.error('Image must be smaller than 5MB!');
              }
              return isImage && isLt5M;
            }}
          >
            {fileList.length >= 1 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            )}
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

// Helper function for image preview
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

export default AddNewAccommodation;

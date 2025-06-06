import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ADD_FREQUENCY_TITLE, ADD_DURATION_TITLE } from '../../utils/mutations';
import { Input, Checkbox, Form, Select, Upload, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { QUERY_FREQUENCY_TEMPLATES } from '../../utils/queries';
const { TextArea } = Input;




const normFile = (e) => {
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
};


const AddNewDataMeasure = ({onClose, updateMergedData, mergedData}) => {

  const { data, loading, error, refetch } = useQuery(QUERY_FREQUENCY_TEMPLATES);

  const [componentDisabled, setComponentDisabled] = useState(false);
  const [addFrequencyTitle] = useMutation(ADD_FREQUENCY_TITLE)
  const [addDurationTitle] = useMutation(ADD_DURATION_TITLE)
  const [form] = Form.useForm();
  const [tableData, setTableData] = useState([])


  
const showMessage = (dataType) => {
  message.success(`${dataType} data measure saved`, 2, onClose);

}

useEffect(() => {
  // This effect will run every time tableData changes
  console.log("Table data updated:", tableData);
  // You can perform any additional actions here
}, [tableData]); 

  const handleSubmit = async (values) => {
    const { behaviorTitle, dataType, operationalDefinition } = values;
    if (dataType === "frequency") {
      try {
        await addFrequencyTitle({
          variables: {
            behaviorTitle,
            operationalDefinition
          }
        });
        // Refetch templates here
        refetch(); // (if using Apollo's useQuery, call the refetch function)
        showMessage(behaviorTitle);
        setTableData([...tableData, { behaviorTitle, dataType, operationalDefinition }]);
        updateMergedData([...mergedData, { behaviorTitle, dataType, operationalDefinition }]);
      } catch (error) {
        console.error('Error saving frequency template: ', error);
      }
    } else if (dataType === 'duration') {
      try {
        await addDurationTitle({
          variables: {
            behaviorTitle: behaviorTitle,
            operationalDefinition: operationalDefinition
          }
        });
        setTableData([...tableData, {behaviorTitle, dataType, operationalDefinition}])
        showMessage(behaviorTitle);
        updateMergedData([...mergedData, {behaviorTitle, dataType, operationalDefinition}])  
      } catch(error) {
        console.error('Error saving duration data measure: ', error)
      }
    }
  }

  return (
    <>
      <Form
        form={form}
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 14 }}
        layout="horizontal"
        style={{ maxWidth: 600 }}
        onFinish = {handleSubmit}
      >
         <h4>New Data Measure</h4>
        <Button onClick={onClose}>
          Close
        </Button>
        <Form.Item label="Behavior Title"
        name="behaviorTitle" rules={[{ required: true, message: 'Please input the title!' }]}>
          <Input />
        </Form.Item>  
        <Form.Item label="Select Data Type"
        name="dataType" rules={[{ required: true, message: 'Please select the data type!' }]}>
          <Select>
            <Select.Option value="frequency">Frequency</Select.Option>
            <Select.Option value="duration">Duration</Select.Option>
          </Select>
        </Form.Item>     
        <Form.Item label="Operational Definition"
        name="operationalDefinition" rules={[{ required: true, message: 'Please input the operational definition!' }]}>
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
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    </>
  );
};

export default AddNewDataMeasure;

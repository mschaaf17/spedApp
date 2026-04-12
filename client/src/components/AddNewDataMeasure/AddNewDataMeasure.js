import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ADD_FREQUENCY_TITLE, ADD_DURATION_TITLE, ADD_DATA_MEASURE_TO_STUDENT } from '../../utils/mutations';
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


const AddNewDataMeasure = ({ onClose, updateMergedData, mergedData, studentId }) => {

  const { data, loading, error, refetch } = useQuery(QUERY_FREQUENCY_TEMPLATES);
  const { refetch: refetchDurationTemplates } = useQuery(require('../../utils/queries').QUERY_DURATION_TEMPLATES);

  const [componentDisabled, setComponentDisabled] = useState(false);
  const [addFrequencyTitle] = useMutation(ADD_FREQUENCY_TITLE)
  const [addDurationTitle] = useMutation(ADD_DURATION_TITLE)
  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT);
  
  const [form] = Form.useForm();
  const [tableData, setTableData] = useState([])
  const [selectedDataType, setSelectedDataType] = useState(null)


  
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
    let newTemplateId = null;

    if (dataType === "frequency") {
      try {
        const { data } = await addFrequencyTitle({
          variables: { behaviorTitle, operationalDefinition }
        });
        // Get the new template's ID
        newTemplateId = data?.addFrequencyTitle?._id;
        await refetch();
        showMessage(behaviorTitle);

        // If studentId is provided, assign to student
        if (studentId && newTemplateId) {
          await addDataMeasureToStudent({
            variables: { dataMeasureId: newTemplateId, studentId }
          });
        }

        onClose();
      } catch (error) {
        console.error('Error saving frequency template: ', error);
      }
    } else if (dataType === 'duration') {
      try {
        const { data } = await addDurationTitle({
          variables: { behaviorTitle, operationalDefinition }
        });
        newTemplateId = data?.addDurationTitle?._id;
        await refetchDurationTemplates();
        showMessage(behaviorTitle);

        if (studentId && newTemplateId) {
          await addDataMeasureToStudent({
            variables: { dataMeasureId: newTemplateId, studentId }
          });
        }

        onClose();
      } catch (error) {
        console.error('Error saving duration data measure: ', error)
      }
    }
  }

  const handleDataTypeChange = (value) => {
    setSelectedDataType(value);
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
          <Select onChange={handleDataTypeChange}>
            <Select.Option value="frequency">Frequency</Select.Option>
            <Select.Option value="duration">Duration</Select.Option>
          </Select>
        </Form.Item>     
        <Form.Item label="Operational Definition"
        name="operationalDefinition" rules={[{ required: true, message: 'Please input the operational definition!' }]}>
          <TextArea rows={4} />
        </Form.Item>
  
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    </>
  );
};

export default AddNewDataMeasure;

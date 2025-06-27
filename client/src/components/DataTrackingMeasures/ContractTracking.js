import React, { useState } from 'react';
import { Button, Card, message, Space, Typography, Table, Select, Modal, Form, Input } from 'antd';
import { useMutation } from '@apollo/client';
import { UPDATE_CONTRACT_ENTRY } from '../../utils/mutations';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ContractTracking = ({ student, contracts, refetchTrigger }) => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [noteModal, setNoteModal] = useState({ visible: false, contractId: null, date: null, time: null, value: null });
  const [noteForm] = Form.useForm();

  const [updateContractEntry] = useMutation(UPDATE_CONTRACT_ENTRY);

  // Filter active contracts
  const activeContracts = contracts?.filter(contract => contract.isActive) || [];

  const handleUpdateEntry = async (contractId, date, time, value, note = '') => {
    try {
      await updateContractEntry({
        variables: {
          input: {
            contractId,
            date,
            time,
            value,
            note
          }
        }
      });
      message.success('Contract entry updated successfully');
    } catch (error) {
      console.error('Error updating contract entry:', error);
      message.error('Failed to update contract entry');
    }
  };

  const getSmileyValue = (value) => {
    switch (value) {
      case 'smiley': return '😊';
      case 'neutral': return '😐';
      case 'sad': return '😞';
      default: return '';
    }
  };

  const getNumberValue = (value) => {
    return value || '';
  };

  const openNoteModal = (contractId, date, time, value) => {
    setNoteModal({ visible: true, contractId, date, time, value });
    noteForm.resetFields();
  };

  const handleNoteSubmit = async () => {
    try {
      const values = await noteForm.validateFields();
      await handleUpdateEntry(
        noteModal.contractId, 
        noteModal.date, 
        noteModal.time, 
        noteModal.value, 
        values.note
      );
      setNoteModal({ visible: false, contractId: null, date: null, time: null, value: null });
    } catch (error) {
      console.error('Error submitting note:', error);
    }
  };

  const renderContractTable = (contract) => {
    const today = new Date().toISOString().split('T')[0];
    const dayEntry = contract.chart.find(day => day.date === today);
    
    const columns = [
      {
        title: 'Behavior',
        dataIndex: 'row',
        key: 'row',
        width: 200,
        render: (text) => <Text strong>{text}</Text>
      },
      ...contract.times.filter(Boolean).map(time => ({
        title: time,
        key: time,
        dataIndex: time,
        width: 120,
        render: (_, record) => {
          const timeEntry = dayEntry?.entries.find(entry => entry.time === time);
          const value = timeEntry?.value || '';
          
          return (
            <div style={{ textAlign: 'center' }}>
              {contract.measureType === 'smileys' ? (
                <Select
                  value={value}
                  onChange={(newValue) => {
                    if (newValue !== 'smiley') {
                      openNoteModal(contract._id, today, time, newValue);
                    } else {
                      handleUpdateEntry(contract._id, today, time, newValue);
                    }
                  }}
                  style={{ width: '100%' }}
                  placeholder="-"
                >
                  <Option value="">-</Option>
                  <Option value="smiley">😊</Option>
                  <Option value="neutral">😐</Option>
                  <Option value="sad">😞</Option>
                </Select>
              ) : (
                <Select
                  value={value}
                  onChange={(newValue) => {
                    if (newValue !== '5') {
                      openNoteModal(contract._id, today, time, newValue);
                    } else {
                      handleUpdateEntry(contract._id, today, time, newValue);
                    }
                  }}
                  style={{ width: '100%' }}
                  placeholder="-"
                >
                  <Option value="">-</Option>
                  <Option value="1">1</Option>
                  <Option value="2">2</Option>
                  <Option value="3">3</Option>
                  <Option value="4">4</Option>
                  <Option value="5">5</Option>
                </Select>
              )}
              {timeEntry?.note && (
                <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                  📝
                </div>
              )}
            </div>
          );
        }
      }))
    ];

    return (
      <Table
        columns={columns}
        dataSource={contract.rows.map(row => ({ row, key: row }))}
        pagination={false}
        size="small"
        bordered
      />
    );
  };

  if (activeContracts.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Title level={3}>Contract Tracking</Title>
        <Card>
          <div style={{ padding: '40px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4} type="secondary">No Active Contracts</Title>
            <Text type="secondary">
              This student doesn't have any active behavior contracts to track.
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <Title level={3}>Contract Tracking</Title>
      
      {/* Contract Selection */}
      <Card style={{ marginBottom: 20 }}>
        <Title level={4}>Select Contract</Title>
        <Select
          placeholder="Choose a contract to track"
          style={{ width: '100%' }}
          value={selectedContract?._id}
          onChange={(contractId) => {
            const contract = activeContracts.find(c => c._id === contractId);
            setSelectedContract(contract);
          }}
        >
          {activeContracts.map(contract => (
            <Option key={contract._id} value={contract._id}>
              {contract.title} ({contract.type})
            </Option>
          ))}
        </Select>
      </Card>

      {/* Contract Display */}
      {selectedContract && (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Title level={4}>{selectedContract.title}</Title>
            <Space direction="vertical" size="small">
              <Text><strong>Type:</strong> {selectedContract.type}</Text>
              <Text><strong>Measure Type:</strong> {selectedContract.measureType}</Text>
              <Text><strong>Check-in Times:</strong> {selectedContract.times.filter(Boolean).join(', ')}</Text>
            </Space>
          </div>

          {/* Check-in Times Display */}
          {selectedContract.type === 'daily' && selectedContract.times.length > 0 && (
            <div style={{ 
              background: '#e3f2fd', 
              border: '1px solid #2196f3', 
              borderRadius: 6, 
              padding: 12,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              <Text strong style={{ color: '#1976d2' }}>
                📅 Check-in Times - Students must check in at these times:
              </Text>
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {selectedContract.times.filter(Boolean).map((time, index) => (
                  <span key={index} style={{ 
                    padding: '4px 8px', 
                    background: 'white', 
                    border: '1px solid #2196f3', 
                    borderRadius: 4,
                    fontWeight: 500,
                    color: '#1976d2',
                    fontSize: '13px'
                  }}>
                    {time}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contract Table */}
          {renderContractTable(selectedContract)}
        </Card>
      )}

      {/* Note Modal */}
      <Modal
        title="Add Note"
        open={noteModal.visible}
        onOk={handleNoteSubmit}
        onCancel={() => setNoteModal({ visible: false, contractId: null, date: null, time: null, value: null })}
        okText="Save Note"
        cancelText="Cancel"
      >
        <Form form={noteForm} layout="vertical">
          <Form.Item
            name="note"
            label="Note"
            rules={[{ required: true, message: 'Please provide a note for this score' }]}
          >
            <TextArea
              rows={4}
              placeholder="Please explain why this score was given..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContractTracking; 
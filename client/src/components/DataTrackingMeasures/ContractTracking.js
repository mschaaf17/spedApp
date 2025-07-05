import React, { useState } from 'react';
import { Button, Card, message, Space, Typography, Table, Select, Modal, Form, Input, Alert, Tooltip } from 'antd';
import { useMutation } from '@apollo/client';
import { UPDATE_CONTRACT_ENTRY } from '../../utils/mutations';
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, EditOutlined, FileAddOutlined } from '@ant-design/icons';
import ContractCharts from './ContractCharts';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ContractTracking = ({ student, contracts, refetchTrigger, onRefetch }) => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [noteModal, setNoteModal] = useState({ visible: false, contractId: null, date: null, time: null, value: null, row: null });
  const [noteForm] = Form.useForm();
  const [editCell, setEditCell] = useState({}); // { [row_time]: true }
  const [overrideCell, setOverrideCell] = useState({}); // { [row_time]: true }

  const [updateContractEntry] = useMutation(UPDATE_CONTRACT_ENTRY);

  // Filter active contracts
  const activeContracts = contracts?.filter(contract => contract.isActive) || [];

  // Helper: get today's day name
  const today = new Date();
  const todayName = today.toLocaleDateString(undefined, { weekday: 'long' });
  const todayISO = today.toISOString().split('T')[0];

  const handleUpdateEntry = async (contractId, date, time, value, note = '', row) => {
    try {
      await updateContractEntry({
        variables: {
          input: {
            contractId,
            date,
            time,
            value,
            note,
            row
          }
        }
      });
      message.success('Contract entry updated successfully');
      if (onRefetch) onRefetch();
      setEditCell(prev => ({ ...prev, [`${row}_${time}`]: false }));
      setOverrideCell(prev => ({ ...prev, [`${row}_${time}`]: false }));
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

  const openNoteModal = (contractId, date, time, value, row) => {
    setNoteModal({ visible: true, contractId, date, time, value, row });
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
        values.note,
        noteModal.row
      );
      setNoteModal({ visible: false, contractId: null, date: null, time: null, value: null, row: null });
    } catch (error) {
      console.error('Error submitting note:', error);
    }
  };

  const renderContractTable = (contract) => {
    const dayEntry = contract.chart.find(day => day.date === todayISO);
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const columnTimes = contract.type === 'weekly' 
      ? contract.times.filter(time => allDays.includes(time))
      : contract.times.filter(Boolean);
    const scheduledDays = contract.type === 'weekly'
      ? contract.times.filter(time => allDays.includes(time))
      : [];
    const isScheduledDay = scheduledDays.includes(todayName) || contract.type !== 'weekly';

    const columns = [
      {
        title: 'Behavior',
        key: 'behavior',
        dataIndex: 'behavior',
        width: 150,
        fixed: 'left',
      },
      ...columnTimes.map(time => ({
        title: time,
        key: time,
        dataIndex: time,
        width: 120,
        render: (_, record) => {
          const cellKey = `${record.behavior}_${time}`;
          // Find entry for this cell (today)
          const timeEntry = dayEntry?.entries.find(entry => entry.time === time && entry.row === record.behavior);
          const value = timeEntry?.value || '';
          const note = timeEntry?.note || '';
          // Cell logic
          const isToday = isScheduledDay && time === todayName;
          const isEditable = (isToday && !value) || editCell[cellKey] || overrideCell[cellKey];
          const isDisabled = !isEditable;

          return (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {isEditable ? (
                <Select
                  value={value}
                  onChange={(newValue) => {
                    if (newValue !== 'smiley' && contract.measureType === 'smileys') {
                      openNoteModal(contract._id, todayISO, time, newValue, record.behavior);
                    } else if (newValue !== '5' && contract.measureType !== 'smileys') {
                      openNoteModal(contract._id, todayISO, time, newValue, record.behavior);
                    } else {
                      handleUpdateEntry(contract._id, todayISO, time, newValue, '', record.behavior);
                    }
                  }}
                  style={{ width: '100%' }}
                  placeholder="-"
                  disabled={false}
                >
                  <Option value="">-</Option>
                  {contract.measureType === 'smileys' ? (
                    <>
                      <Option value="smiley">😊</Option>
                      <Option value="neutral">😐</Option>
                      <Option value="sad">😞</Option>
                    </>
                  ) : (
                    <>
                      <Option value="1">1</Option>
                      <Option value="2">2</Option>
                      <Option value="3">3</Option>
                      <Option value="4">4</Option>
                      <Option value="5">5</Option>
                    </>
                  )}
                </Select>
              ) : (
                <>
                  <div style={{ minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18 }}>{
                      contract.measureType === 'smileys'
                        ? value === 'smiley' ? '😊' : value === 'neutral' ? '😐' : value === 'sad' ? '😞' : '-'
                        : value || '-'
                    }</span>
                    {value && (
                      <Tooltip title="Edit score">
                        <Button
                          icon={<EditOutlined />}
                          size="small"
                          style={{ marginLeft: 4 }}
                          onClick={() => setEditCell(prev => ({ ...prev, [cellKey]: true }))}
                        />
                      </Tooltip>
                    )}
                  </div>
                  {!value && !overrideCell[cellKey] && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setOverrideCell(prev => ({ ...prev, [cellKey]: true }))}
                      style={{ padding: 0, fontSize: 12 }}
                    >
                      Override
                    </Button>
                  )}
                </>
              )}
              {value && (
                <Tooltip title={note ? 'Edit note' : 'Add note'}>
                  <Button
                    icon={<FileAddOutlined />}
                    size="small"
                    style={{ marginTop: 4 }}
                    onClick={() => openNoteModal(contract._id, todayISO, time, value, record.behavior)}
                  />
                </Tooltip>
              )}
              {note && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px', maxWidth: 80, wordBreak: 'break-word' }}>
                  📝 {note}
                </div>
              )}
            </div>
          );
        },
      })),
    ];

    const dataSource = contract.rows.map(row => ({
      key: row,
      behavior: row,
    }));

    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    );
  };

  // Helper function to format check-in times display
  const formatCheckInTimes = (contract) => {
    if (contract.type === 'weekly') {
      const days = contract.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time));
      const time = contract.times.find(time => time.includes(':') && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time));
      
      if (days.length > 0 && time) {
        return `${days.join(', ')} at ${time}`;
      } else if (days.length > 0) {
        return days.join(', ');
      } else {
        return contract.times.filter(Boolean).join(', ');
      }
    } else {
      return contract.times.filter(Boolean).join(', ');
    }
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
            setEditCell({});
            setOverrideCell({});
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
        <>
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Title level={4}>{selectedContract.title}</Title>
              <Space direction="vertical" size="small">
                <Text><strong>Type:</strong> {selectedContract.type}</Text>
                <Text><strong>Measure Type:</strong> {selectedContract.measureType}</Text>
                <Text><strong>Check-in Times:</strong> {formatCheckInTimes(selectedContract)}</Text>
              </Space>
            </div>

            {/* Contract Table */}
            {renderContractTable(selectedContract)}
          </Card>
          <ContractCharts contract={selectedContract} />
        </>
      )}

      {/* Note Modal */}
      <Modal
        title="Add Note"
        open={noteModal.visible}
        onOk={handleNoteSubmit}
        onCancel={() => setNoteModal({ visible: false, contractId: null, date: null, time: null, value: null, row: null })}
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
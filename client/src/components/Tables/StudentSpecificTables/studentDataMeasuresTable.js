import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Tag, Tooltip, message } from 'antd';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME } from '../../../utils/queries';
import { REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT, REMOVE_DURATION_BEING_TRACKED_FOR_STUDENT, DELETE_CONTRACT } from '../../../utils/mutations';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import './studentDataMeasuresTable.css';

const StudentDataMeasuresTable = ({ student, onViewChart, onRemoveDataMeasure }) => {
  const [filteredInfo, setFilteredInfo] = useState({});
  const [sortedInfo, setSortedInfo] = useState({});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  // Mutations for removing data measures
  const [removeFrequency] = useMutation(REMOVE_FREQUENCY_BEING_TRACKED_FOR_STUDENT, {
    refetchQueries: [
      { query: QUERY_ME }
    ]
  });
  const [removeDuration] = useMutation(REMOVE_DURATION_BEING_TRACKED_FOR_STUDENT, {
    refetchQueries: [
      { query: QUERY_ME }
    ]
  });
  const [deleteContract] = useMutation(DELETE_CONTRACT, {
    refetchQueries: [
      { query: QUERY_ME }
    ]
  });

  // Combine frequencies and durations into one data source
  const getDataMeasures = () => {
    if (!student) return [];

    console.log('Student data in getDataMeasures:', student);
    console.log('Student behaviorFrequencies:', student.behaviorFrequencies);
    console.log('Student behaviorDurations:', student.behaviorDurations);

    const frequencies = (student.behaviorFrequencies || [])
      .filter(freq => freq.isActive)
      .map(freq => {
        console.log('Processing frequency:', {
          _id: freq._id,
          behaviorTitle: freq.behaviorTitle,
          operationalDefinition: freq.operationalDefinition,
          createdAt: freq.createdAt
        });
        return {
          ...freq,
          dataMeasureType: 'Frequency',
          type: 'frequency',
          icon: <TrendingUpIcon style={{ color: '#1890ff' }} />,
          status: freq.isActive ? 'Active' : 'Inactive'
        };
      });

    const durations = (student.behaviorDurations || [])
      .filter(dur => dur.isActive)
      .map(dur => {
        console.log('Processing duration:', {
          _id: dur._id,
          behaviorTitle: dur.behaviorTitle,
          operationalDefinition: dur.operationalDefinition,
          createdAt: dur.createdAt
        });
        return {
          ...dur,
          dataMeasureType: 'Duration',
          type: 'duration',
          icon: <TimerIcon style={{ color: '#52c41a' }} />,
          status: dur.isActive ? 'Active' : 'Inactive'
        };
      });

    const contracts = (student.contracts || [])
      .filter(contract => contract.isActive)
      .map(contract => {
        console.log('Processing contract:', {
          _id: contract._id,
          title: contract.title,
          contractMeasures: contract.contractMeasures,
          createdAt: contract.createdAt
        });
        
        // For contracts created from contract measures, use the contract measure name as the behavior title
        // The contract title is set to the contract measure name, so we can use it directly
        const behaviorTitle = contract.title || 'Contract';
        
        return {
          ...contract,
          behaviorTitle: behaviorTitle, // Use the contract title (which is the contract measure name)
          operationalDefinition: contract.contractMeasures?.map(cm => cm.name || cm.description).join(', ') || 'No measures defined',
          dataMeasureType: 'Contract',
          type: 'contract',
          icon: <AssessmentOutlinedIcon style={{ color: '#722ed1' }} />,
          status: contract.isActive ? 'Active' : 'Inactive'
        };
      });

    const result = [...frequencies, ...durations, ...contracts];
    console.log('Final dataMeasures result:', result);
    return result;
  };

  const handleChange = (pagination, filters, sorter) => {
    setFilteredInfo(filters);
    setSortedInfo(sorter);
  };

  const generateFilters = (key) => {
    const dataMeasures = getDataMeasures();
    if (!dataMeasures.length) return [];
    const values = [...new Set(dataMeasures.map(item => item[key]))];
    return values.map(value => ({
      text: value,
      value: value,
    }));
  };

  const getRowClassName = (record, index) => {
    return index % 2 === 0 ? 'whiteRow' : 'coloredRow';
  };

  const confirmDelete = (record) => {
    setDeleteRecord(record);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteRecord) return;

    try {
      if (deleteRecord.type === 'frequency') {
        await removeFrequency({
          variables: {
            frequencyId: deleteRecord._id,
            studentId: student._id
          }
        });
      } else if (deleteRecord.type === 'duration') {
        await removeDuration({
          variables: {
            durationId: deleteRecord._id,
            studentId: student._id
          }
        });
      } else if (deleteRecord.type === 'contract') {
        await deleteContract({
          variables: {
            contractId: deleteRecord._id
          }
        });
      }

      // Call the parent callback if provided
      if (onRemoveDataMeasure) {
        onRemoveDataMeasure(deleteRecord);
      }

      // Small delay to ensure the mutation completes before the callback
      setTimeout(() => {
        setDeleteModalVisible(false);
        setDeleteRecord(null);
        message.success('Data measure removed successfully');
      }, 100);
    } catch (error) {
      console.error('Error removing data measure:', error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteRecord(null);
  };

  const handleViewChart = (record) => {
    if (onViewChart) {
      onViewChart(record);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    
    console.log('formatDate input:', dateString, 'type:', typeof dateString);
    
    let date;
    if (typeof dateString === 'string' && /^\d+$/.test(dateString)) {
      // Handle numeric string timestamps
      date = new Date(parseInt(dateString));
    } else {
      date = new Date(dateString);
    }
    
    console.log('formatDate parsed date:', date, 'isValid:', !isNaN(date.getTime()));
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return '—';
    }
    
    // Check if date is in the future (likely an error)
    if (date > new Date()) {
      console.warn('Date is in the future:', date);
      return '—';
    }
    
    return date.toLocaleDateString();
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'dataMeasureType',
      key: 'dataMeasureType',
      width: 120,
      render: (text, record) => (
        <Space>
          {record.icon}
          <span>{text}</span>
        </Space>
      ),
      filters: generateFilters('dataMeasureType'),
      filteredValue: filteredInfo.dataMeasureType || null,
      onFilter: (value, record) => record.dataMeasureType === value,
    },
    {
      title: 'Behavior Title',
      dataIndex: 'behaviorTitle',
      key: 'behaviorTitle',
      filterSearch: true,
      filters: generateFilters('behaviorTitle'),
      filteredValue: filteredInfo.behaviorTitle || null,
      onFilter: (value, record) => record.behaviorTitle.toLowerCase().includes(value.toLowerCase()),
      sorter: (a, b) => a.behaviorTitle.localeCompare(b.behaviorTitle),
      sortOrder: sortedInfo.columnKey === 'behaviorTitle' ? sortedInfo.order : null,
      render: (text) => (
        <span style={{ fontWeight: 500 }}>{text}</span>
      )
    },
    {
      title: 'Operational Definition',
      dataIndex: 'operationalDefinition',
      key: 'operationalDefinition',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          <span>{text || '—'}</span>
        </Tooltip>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
      filters: generateFilters('status'),
      filteredValue: filteredInfo.status || null,
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Assigned Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => formatDate(date),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      sortOrder: sortedInfo.columnKey === 'createdAt' ? sortedInfo.order : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Remove Data Measure">
            <Button
              type="text"
              danger
              icon={<DeleteForeverIcon />}
              onClick={() => confirmDelete(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    }
  ];

  const dataMeasures = getDataMeasures();

  return (
    <div className="student-data-measures-table">
      <Table
        columns={columns}
        dataSource={dataMeasures}
        rowKey="_id"
        onChange={handleChange}
        rowClassName={getRowClassName}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} data measures`,
        }}
        locale={{
          emptyText: (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                {student?.firstName} doesn't have any data measures assigned.
              </p>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
                Please add a data measure using the "Add Data Measure" button above, or navigate to Admin Settings to add new data measure templates.
              </p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                You can also navigate to the "Track Data" section to add new data measures.
              </p>
            </div>
          )
        }}
      />

      <Modal
        title="Confirm Removal"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Remove"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>
          Are you sure you want to remove the data measure "{deleteRecord?.behaviorTitle}" 
          from {student?.firstName} {student?.lastName}?
        </p>
        <p style={{ color: '#666', fontSize: '14px' }}>
          This action cannot be undone and will remove all associated data.
        </p>
      </Modal>
    </div>
  );
};

export default StudentDataMeasuresTable; 
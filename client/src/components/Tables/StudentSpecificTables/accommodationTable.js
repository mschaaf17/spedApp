import React, { useState } from 'react';
import { Table, Button, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { GiftOutlined, HistoryOutlined, DeleteOutlined } from '@ant-design/icons';
import AccommodationOfferModal from '../../Modals/AccommodationOfferModal';
import AccommodationLogsModal from '../../AccommodationLogs/AccommodationLogsModal';

const StudentAccommodationsTable = ({
  accommodations = [],
  loading,
  onRemoveAccommodation,
  studentId,
  username
}) => {
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [logsModalVisible, setLogsModalVisible] = useState(false);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);

  const handleOfferAccommodation = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setOfferModalVisible(true);
  };

  const handleViewLogs = (accommodation) => {
    setSelectedAccommodation(accommodation);
    setLogsModalVisible(true);
  };

  const calculateStats = (accommodation) => {
    const offeredLog = accommodation?.offeredLog || [];
    const requestLog = accommodation?.requestLog || [];
    
    const totalOffers = offeredLog.length;
    const acceptedOffers = offeredLog.filter(log => log.accepted).length;
    const acceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : 0;
    
    return { totalOffers, acceptedOffers, acceptanceRate, totalRequests: requestLog.length };
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      )
    },
    {
      title: 'Assigned Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt, record) => {
        console.log('Accommodation row:', record);
        if (!createdAt) return '—';
        let dateObj;
        if (typeof createdAt === "number") {
          dateObj = new Date(createdAt);
        } else if (typeof createdAt === "string" && /^\d+$/.test(createdAt)) {
          dateObj = new Date(Number(createdAt));
        } else {
          dateObj = new Date(createdAt);
        }
        return isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleDateString();
      },
    },
    {
      title: 'Last Offered',
      dataIndex: 'lastOffered',
      key: 'lastOffered',
      render: (lastOffered) => {
        if (!lastOffered) return 'Never';
        const date = new Date(lastOffered);
        return isNaN(date.getTime()) ? 'Never' : date.toLocaleDateString();
      }
    },
    {
      title: 'Stats',
      key: 'stats',
      render: (_, record) => {
        const stats = calculateStats(record);
        return (
          <div>
            <div>Offers: {stats.totalOffers}</div>
            <div>Acceptance: {stats.acceptanceRate}%</div>
            <div>Requests: {stats.totalRequests}</div>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const stats = calculateStats(record);
        return (
          <Space>
            <Tooltip title="Offer this accommodation">
              <Button 
                type="primary" 
                size="small" 
                icon={<GiftOutlined />}
                onClick={() => handleOfferAccommodation(record)}
              >
                Offer
              </Button>
            </Tooltip>
            
            <Tooltip title="View history and logs">
              <Button 
                size="small" 
                icon={<HistoryOutlined />}
                onClick={() => handleViewLogs(record)}
              >
                History
              </Button>
            </Tooltip>
            
            <Popconfirm
              title="Remove this accommodation from student?"
              onConfirm={() => onRemoveAccommodation(record._id)}
            >
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
              >
                Remove
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={accommodations.map(card => ({ ...card, key: card._id }))}
        loading={loading}
        pagination={false}
      />
      
      <AccommodationOfferModal
        visible={offerModalVisible}
        onCancel={() => setOfferModalVisible(false)}
        accommodation={selectedAccommodation}
        studentId={studentId}
        username={username}
      />
      
      <AccommodationLogsModal
        visible={logsModalVisible}
        onCancel={() => setLogsModalVisible(false)}
        accommodation={selectedAccommodation}
      />
    </>
  );
};

export default StudentAccommodationsTable;

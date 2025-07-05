import React from 'react';
import { Modal, Table, Tag, Statistic, Row, Col, Typography, Button } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Robust date parser for timestamps, ISO strings, etc.
function parseDateSafe(dateValue) {
  if (!dateValue) return null;
  if (typeof dateValue === 'number') return new Date(dateValue);
  if (typeof dateValue === 'string') {
    if (/^\d+$/.test(dateValue)) return new Date(Number(dateValue));
    return new Date(dateValue);
  }
  return new Date(dateValue);
}

const AccommodationLogsModal = ({ 
  visible, 
  onCancel, 
  accommodation 
}) => {
  const formatDate = (dateValue) => {
    const date = parseDateSafe(dateValue);
    return date && !isNaN(date.getTime()) ? date.toLocaleString() : 'Invalid Date';
  };

  const calculateStats = () => {
    const offeredLog = accommodation?.offeredLog || [];
    const requestLog = accommodation?.requestLog || [];
    
    const totalOffers = offeredLog.length;
    const acceptedOffers = offeredLog.filter(log => log.accepted).length;
    const acceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : 0;
    const totalRequests = requestLog.length;
    
    const lastOffered = offeredLog.length > 0 
      ? new Date(Math.max(...offeredLog.map(log => {
          const d = parseDateSafe(log.time);
          return d && !isNaN(d.getTime()) ? d.getTime() : 0;
        })))
      : null;
    
    const lastRequested = requestLog.length > 0
      ? new Date(Math.max(...requestLog.map(log => {
          const d = parseDateSafe(log.time);
          return d && !isNaN(d.getTime()) ? d.getTime() : 0;
        })))
      : null;

    return {
      totalOffers,
      acceptedOffers,
      acceptanceRate,
      totalRequests,
      lastOffered,
      lastRequested
    };
  };

  const stats = calculateStats();

  const offerColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'time',
      key: 'time',
      render: (time) => formatDate(time)
    },
    {
      title: 'Status',
      dataIndex: 'accepted',
      key: 'accepted',
      render: (accepted) => (
        <Tag 
          color={accepted ? 'green' : 'red'} 
          icon={accepted ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        >
          {accepted ? 'Accepted' : 'Declined'}
        </Tag>
      )
    }
  ];

  const requestColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'time',
      key: 'time',
      render: (time) => formatDate(time)
    }
  ];

  return (
    <Modal
      title={`Accommodation History: ${accommodation?.title}`}
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={[
        <Button key="close" onClick={onCancel}>
          Close
        </Button>
      ]}
    >
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Statistics</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="Total Offers" 
              value={stats.totalOffers} 
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Accepted" 
              value={stats.acceptedOffers}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Acceptance Rate" 
              value={stats.acceptanceRate} 
              suffix="%" 
              precision={1}
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Student Requests" 
              value={stats.totalRequests}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Text strong>Last Offered:</Text>
            <br />
            <Text>
              {stats.lastOffered ? formatDate(stats.lastOffered) : 'Never'}
            </Text>
          </Col>
          <Col span={12}>
            <Text strong>Last Requested:</Text>
            <br />
            <Text>
              {stats.lastRequested ? formatDate(stats.lastRequested) : 'Never'}
            </Text>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Offer History</Title>
        <Table
          columns={offerColumns}
          dataSource={(accommodation?.offeredLog || []).map((log, index) => ({
            ...log,
            key: index
          }))}
          pagination={false}
          size="small"
        />
      </div>

      <div>
        <Title level={4}>Student Request History</Title>
        <Table
          columns={requestColumns}
          dataSource={(accommodation?.requestLog || []).map((log, index) => ({
            ...log,
            key: index
          }))}
          pagination={false}
          size="small"
        />
      </div>
    </Modal>
  );
};

export default AccommodationLogsModal; 
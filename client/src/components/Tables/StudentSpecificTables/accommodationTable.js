import React from 'react';
import { Table, Button, Popconfirm } from 'antd';

const StudentAccommodationsTable = ({
  accommodations = [],
  loading,
  onRemoveAccommodation
}) => {
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
      render: (createdAt) => {
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Remove this accommodation from student?"
          onConfirm={() => onRemoveAccommodation(record._id)}
        >
          <Button danger size="small">
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={accommodations.map(card => ({ ...card, key: card._id }))}
      loading={loading}
      pagination={false}
    />
  );
};

export default StudentAccommodationsTable;

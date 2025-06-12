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
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => (
        <span style={{ textTransform: 'capitalize' }}>{text}</span>
      )
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

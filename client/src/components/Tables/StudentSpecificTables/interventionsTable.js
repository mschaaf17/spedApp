import React, { useState } from 'react';
import { Table, Button, Popconfirm, Select } from 'antd';

export default function InterventionsTable({
  user,
  interventions,
  allInterventions,
  loading,
  onRemoveIntervention,
  onAddIntervention
}) {
  const [selectedToAdd, setSelectedToAdd] = useState(null);

  // Filter out interventions already assigned
  const assignedIds = new Set(interventions.map(i => i._id));
  const unassignedInterventions = allInterventions.filter(i => !assignedIds.has(i._id));

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Behavior',
      dataIndex: 'behaviorId',
      key: 'behavior',
      render: (behaviorId) => behaviorId?.behaviorTitle || '—',
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
      title: 'Function',
      dataIndex: 'function',
      key: 'function',
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Remove this intervention from student?"
          onConfirm={() => onRemoveIntervention(record._id)}
        >
          <Button danger size="small">
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={interventions}
        rowKey="_id"
        loading={loading}
      />
    </div>
  );
}

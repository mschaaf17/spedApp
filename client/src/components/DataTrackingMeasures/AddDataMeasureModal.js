import React, { useState, useEffect } from 'react';
import { Modal, Select, Button } from 'antd';

// Props:
// open: boolean (modal visibility)
// onOk: function (called with selected type and measure)
// onCancel: function
// availableTypes: array of { value, label }
// getAvailableDataMeasures: function(type) => array of { value, label, type }
// loading: boolean

const AddDataMeasureModal = ({
  open,
  onOk,
  onCancel,
  availableTypes = [
    { value: 'frequency', label: 'Frequency' },
    { value: 'duration', label: 'Duration' }
  ],
  getAvailableDataMeasures,
  loading = false
}) => {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMeasures, setSelectedMeasures] = useState([]);

  useEffect(() => {
    if (!open) {
      setSelectedType(null);
      setSelectedMeasures([]);
    }
  }, [open]);

  const availableMeasures = selectedType ? getAvailableDataMeasures(selectedType) : [];

  return (
    <Modal
      title="Add Data Measure"
      open={open}
      onOk={() => onOk(selectedType, selectedMeasures)}
      onCancel={onCancel}
      okText="Add Data Measure"
      cancelText="Cancel"
      okButtonProps={{
        disabled: !selectedType || selectedMeasures.length === 0 || availableMeasures.length === 0
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Select Data Measure Type:
        </label>
        <Select
          placeholder="Select data measure type"
          style={{ width: '100%' }}
          value={selectedType}
          onChange={value => {
            setSelectedType(value);
            setSelectedMeasures([]);
          }}
          options={availableTypes}
        />
      </div>
      {selectedType && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Select {selectedType === 'frequency' ? 'Frequency' : selectedType === 'duration' ? 'Duration' : 'Contract'} Behavior(s):
          </label>
          {loading ? (
            <div>Loading...</div>
          ) : availableMeasures.length > 0 ? (
            <Select
              mode="multiple"
              placeholder={`Select ${selectedType === 'frequency' ? 'Frequency' : selectedType === 'duration' ? 'Duration' : 'Contract'} behavior(s)`}
              style={{ width: '100%' }}
              value={selectedMeasures}
              onChange={setSelectedMeasures}
              options={availableMeasures}
            />
          ) : (
            <div style={{
              padding: 16,
              backgroundColor: '#f5f5f5',
              borderRadius: 6,
              textAlign: 'center',
              border: '1px dashed #d9d9d9',
              color: '#999',
              fontSize: 14
            }}>
              No more {selectedType === 'frequency' ? 'Frequency' : selectedType === 'duration' ? 'Duration' : 'Contract'} templates available for this student.
            </div>
          )}
        </div>
      )}
      {selectedMeasures.length > 0 && (
        <div style={{
          padding: 12,
          backgroundColor: '#f5f5f5',
          borderRadius: 6,
          marginTop: 16
        }}>
          <h4 style={{ margin: '0 0 8px 0' }}>Selected Behaviors:</h4>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {selectedMeasures.map(id => {
              const found = availableMeasures.find(m => m.value === id);
              return <li key={id}>{found ? found.label : id}</li>;
            })}
          </ul>
        </div>
      )}
    </Modal>
  );
};

export default AddDataMeasureModal; 
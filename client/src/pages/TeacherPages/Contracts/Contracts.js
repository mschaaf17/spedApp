import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { QUERY_ME } from '../../../utils/queries';
import { QUERY_CONTRACTS, QUERY_CONTRACT_MEASURES } from '../../../utils/queries';
import { CREATE_CONTRACT, UPDATE_CONTRACT_ENTRY, DELETE_CONTRACT, ADD_CONTRACT_DATA_MEASURE_TO_STUDENT, UPDATE_CONTRACT_ACTIVE_STATUS, UPDATE_CONTRACT_TIMES } from '../../../utils/mutations';
import { Switch, message, Modal, Button } from 'antd';
import AddNewContractMeasure from '../../../components/AddNewContractMeasure/AddNewContractMeasure';
import './index.css';

const Contracts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(location.state?.selectedStudent || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contractForm, setContractForm] = useState({
    title: '',
    contractMeasureIds: [],
    type: 'daily',
    times: [''],
    measureType: 'smileys',
    rows: []
  });
  const [addingMeasureId, setAddingMeasureId] = useState('');
  const { data: userData, refetch: refetchMe } = useQuery(QUERY_ME);
  const { data: contractMeasuresData, refetch: refetchContractMeasures } = useQuery(QUERY_CONTRACT_MEASURES);
  const { data: contractsData, refetch: refetchContracts } = useQuery(QUERY_CONTRACTS, {
    variables: { studentId: selectedStudent?._id },
    skip: !selectedStudent
  });

  const [createContract] = useMutation(CREATE_CONTRACT);
  const [updateContractEntry] = useMutation(UPDATE_CONTRACT_ENTRY);
  const [deleteContract] = useMutation(DELETE_CONTRACT);
  const [addContractDataMeasureToStudent] = useMutation(ADD_CONTRACT_DATA_MEASURE_TO_STUDENT);
  const [updateContractActiveStatus] = useMutation(UPDATE_CONTRACT_ACTIVE_STATUS);
  const [updateContractTimes] = useMutation(UPDATE_CONTRACT_TIMES);

  const [editTimesModal, setEditTimesModal] = useState({ visible: false, contract: null, times: [] });
  const [isContractMeasureModalOpen, setIsContractMeasureModalOpen] = useState(false);

  const students = userData?.me?.students || [];
  const allContractMeasures = contractMeasuresData?.contractMeasures || [];
  const contracts = contractsData?.contracts || [];

  // Get contract measures already assigned to the student (from their contractDataMeasures)
  const studentContractDataMeasures = selectedStudent?.contractDataMeasures || [];
  const assignedContractMeasures = studentContractDataMeasures;
  const unassignedContractMeasures = allContractMeasures.filter(measure => 
    !studentContractDataMeasures.some(studentMeasure => studentMeasure._id === measure._id)
  );

  const handleStudentSelect = (student) => {
    // Get the full student data from userData to ensure we have contractDataMeasures
    const fullStudentData = userData?.me?.students?.find(s => s._id === student._id);
    setSelectedStudent(fullStudentData || student);
    setShowCreateForm(false);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleCreateContract = async () => {
    try {
      await createContract({
        variables: {
          input: {
            ...contractForm,
            studentId: selectedStudent._id
          }
        }
      });
      setShowCreateForm(false);
      setContractForm({
        title: '',
        contractMeasureIds: [],
        type: 'daily',
        times: [''],
        measureType: 'smileys',
        rows: []
      });
      refetchContracts();
      refetchMe();
    } catch (error) {
      console.error('Error creating contract:', error);
    }
  };

  const handleAddContractMeasure = async () => {
    if (!addingMeasureId) return;
    try {
      const result = await addContractDataMeasureToStudent({
        variables: {
          contractMeasureId: addingMeasureId,
          studentId: selectedStudent._id
        }
      });
      
      // Update the selectedStudent with the new contractDataMeasures
      const updatedStudent = result.data.addContractDataMeasureToStudent;
      setSelectedStudent(updatedStudent);
      setAddingMeasureId('');
      
      // Refresh all data
      refetchMe();
      refetchContracts();
      refetchContractMeasures();
    } catch (error) {
      console.error('Error adding contract measure to student:', error);
    }
  };

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
      refetchContracts();
    } catch (error) {
      console.error('Error updating contract entry:', error);
    }
  };

  const handleDeleteContract = async (contractId) => {
    try {
      await deleteContract({
        variables: { contractId }
      });
      refetchContracts();
      refetchMe();
    } catch (error) {
      console.error('Error deleting contract:', error);
    }
  };

  // Add handler for toggling contract active status
  const handleToggleActive = async (contract) => {
    try {
      await updateContractActiveStatus({
        variables: { contractId: contract._id, isActive: !contract.isActive },
      });
      message.success(`Contract "${contract.title}" is now ${!contract.isActive ? 'active' : 'inactive'}`);
      refetchContracts();
    } catch (error) {
      message.error('Failed to update contract status');
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

  const formatCheckInTimes = (contract) => {
    if (contract.type === 'daily') {
      return contract.times.filter(Boolean).join(', ');
    } else if (contract.type === 'weekly') {
      const days = contract.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time));
      const time = contract.times.find(time => time.includes(':') && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time));
      
      if (days.length > 0 && time) {
        return `${days.join(', ')} at ${time}`;
      } else if (days.length > 0) {
        return days.join(', ');
      } else {
        return contract.times.filter(Boolean).join(', ');
      }
    }
    return '';
  };

  return (
    <div className="contracts-container">
      <div className="contracts-header-main">
        <h2>Contracts</h2>
        {selectedStudent && (
          <button onClick={handleBackToDashboard} className="back-btn">
            ← Back to Dashboard
          </button>
        )}
      </div>
      
      {/* Student Selection - Only show if no student is pre-selected */}
      {!selectedStudent && (
        <div className="student-selection">
          <h3>Select Student</h3>
          <div className="student-list">
            {students.map((student) => (
              <button
                key={student._id}
                className={`student-button ${selectedStudent?._id === student._id ? 'active' : ''}`}
                onClick={() => handleStudentSelect(student)}
              >
                {student.firstName} {student.lastName}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedStudent && (
        <div className="contracts-content">
          <div className="contracts-header">
            <h3>Contracts for {selectedStudent.firstName} {selectedStudent.lastName}</h3>
            <button 
              className="create-contract-btn"
              onClick={() => setShowCreateForm(true)}
            >
              Create New Contract
            </button>
          </div>

          {/* Create Contract Form */}
          {showCreateForm && (
            <div className="create-contract-form">
              <h4>Create New Contract</h4>
              <div className="form-group">
                <label>Contract Title:</label>
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({...contractForm, title: e.target.value})}
                  placeholder="Enter contract title"
                />
              </div>

              <div className="form-group">
                <label>Select Behaviors:</label>
                {assignedContractMeasures.length === 0 ? (
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: '#888' }}>No contract behaviors assigned to this student yet.</span>
                  </div>
                ) : null}
                <div className="measure-selection">
                  {assignedContractMeasures.map((measure) => (
                    <label key={measure._id} className="measure-checkbox">
                      <input
                        type="checkbox"
                        checked={contractForm.contractMeasureIds.includes(measure._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setContractForm({
                              ...contractForm,
                              contractMeasureIds: [...contractForm.contractMeasureIds, measure._id],
                              rows: [...contractForm.rows, measure.name]
                            });
                          } else {
                            setContractForm({
                              ...contractForm,
                              contractMeasureIds: contractForm.contractMeasureIds.filter(id => id !== measure._id),
                              rows: contractForm.rows.filter(row => row !== measure.name)
                            });
                          }
                        }}
                      />
                      {measure.name}
                    </label>
                  ))}
                </div>
                {/* Add new contract data measure dropdown */}
                {unassignedContractMeasures.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ fontWeight: 500 }}>Add New Contract Data Measure:</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <select
                        value={addingMeasureId}
                        onChange={e => setAddingMeasureId(e.target.value)}
                        style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                      >
                        <option value="">Select a contract measure...</option>
                        {unassignedContractMeasures.map(measure => (
                          <option key={measure._id} value={measure._id}>{measure.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAddContractMeasure}
                        style={{ padding: '8px 16px', borderRadius: 4, background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
                        disabled={!addingMeasureId}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Create new contract measure button */}
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="dashed" 
                    onClick={() => setIsContractMeasureModalOpen(true)}
                    style={{ width: '100%' }}
                  >
                    + Create New Contract Data Measure
                  </Button>
                </div>
              </div>

              <div className="form-group">
                <label>Contract Type:</label>
                <select
                  value={contractForm.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setContractForm({
                      ...contractForm, 
                      type: newType,
                      // Reset times based on new type
                      times: newType === 'daily' ? [''] : []
                    });
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Set Check In Time(s):</label>
                {contractForm.type === 'daily' ? (
                  <div className="time-inputs">
                    <div style={{ marginBottom: 12 }}>
                      <input
                        type="time"
                        value={contractForm.times[contractForm.times.length - 1] || ''}
                        onChange={(e) => {
                          const newTimes = [...contractForm.times];
                          newTimes[newTimes.length - 1] = e.target.value;
                          setContractForm({...contractForm, times: newTimes});
                        }}
                        style={{ marginRight: 8, padding: 6 }}
                      />
                      <button 
                        type="button"
                        onClick={() => setContractForm({...contractForm, times: [...contractForm.times, '']})}
                        style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >
                        Add Time
                      </button>
                    </div>
                    
                    {/* Show current times */}
                    {contractForm.times.length > 0 && contractForm.times.some(time => time) && (
                      <div style={{ marginTop: 12 }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Check-in Times:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {contractForm.times.filter(time => time).map((time, index) => (
                            <div key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '4px 8px', 
                              background: '#f8f9fa', 
                              border: '1px solid #dee2e6', 
                              borderRadius: 4 
                            }}>
                              <span style={{ marginRight: 8 }}>{time}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newTimes = contractForm.times.filter((_, i) => i !== index);
                                  setContractForm({...contractForm, times: newTimes});
                                }}
                                style={{ 
                                  background: '#dc3545', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '50%', 
                                  width: 20, 
                                  height: 20, 
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="weekday-selection">
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Days:</label>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <label key={day} className="day-checkbox" style={{ display: 'block', marginBottom: 4 }}>
                          <input
                            type="checkbox"
                            checked={contractForm.times.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setContractForm({...contractForm, times: [...contractForm.times, day]});
                              } else {
                                setContractForm({...contractForm, times: contractForm.times.filter(t => t !== day)});
                              }
                            }}
                            style={{ marginRight: 8 }}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                    
                    {/* Check-in time for weekly contracts */}
                    <div style={{ marginTop: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Check-in Time:</label>
                      <input
                        type="time"
                        value={contractForm.times.find(time => time.includes(':') && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time)) || ''}
                        onChange={(e) => {
                          // Remove any existing time and add the new one
                          const daysOnly = contractForm.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time));
                          setContractForm({...contractForm, times: [...daysOnly, e.target.value]});
                        }}
                        style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
                      />
                    </div>
                    
                    {/* Show selected days and time */}
                    {contractForm.times.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Selected Days & Time:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {contractForm.times.map((item, index) => (
                            <div key={index} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              padding: '4px 8px', 
                              background: '#f8f9fa', 
                              border: '1px solid #dee2e6', 
                              borderRadius: 4 
                            }}>
                              <span style={{ marginRight: 8 }}>{item}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newTimes = contractForm.times.filter((_, i) => i !== index);
                                  setContractForm({...contractForm, times: newTimes});
                                }}
                                style={{ 
                                  background: '#dc3545', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: '50%', 
                                  width: 20, 
                                  height: 20, 
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Check-in Times Preview (only for daily contracts) */}
              {contractForm.type === 'daily' && contractForm.times.length > 0 && contractForm.times.some(time => time) && (
                <div className="form-group" style={{ marginTop: 20 }}>
                  <h5 style={{ margin: '0 0 12px 0', color: '#333' }}>Check-in Times Preview</h5>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: 12 }}>
                    This is what will appear at the top of the contract to show students when to check in:
                  </p>
                  <div style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #dee2e6', 
                    borderRadius: 6, 
                    padding: 16,
                    textAlign: 'center'
                  }}>
                    <h6 style={{ margin: '0 0 8px 0', color: '#495057' }}>Check-in Times:</h6>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
                      {contractForm.times.filter(time => time).map((time, index) => (
                        <span key={index} style={{ 
                          padding: '6px 12px', 
                          background: 'white', 
                          border: '1px solid #ced4da', 
                          borderRadius: 4,
                          fontWeight: 500,
                          color: '#495057'
                        }}>
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Measure Type:</label>
                <select
                  value={contractForm.measureType}
                  onChange={(e) => setContractForm({...contractForm, measureType: e.target.value})}
                >
                  <option value="smileys">Smileys</option>
                  <option value="numbers">Numbers (1-5)</option>
                </select>
              </div>

              <div className="form-actions">
                <button onClick={handleCreateContract} className="save-btn">Create Contract</button>
                <button onClick={() => setShowCreateForm(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          )}

          {/* Contracts List */}
          <div className="contracts-list">
            {contracts.map((contract) => (
              <div key={contract._id} className="contract-card">
                <div className="contract-header">
                  <h4>{contract.title}</h4>
                  <Switch
                    checked={contract.isActive}
                    checkedChildren="Active"
                    unCheckedChildren="Inactive"
                    onChange={() => handleToggleActive(contract)}
                    style={{ marginLeft: 12 }}
                  />
                  <button 
                    onClick={() => handleDeleteContract(contract._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                  <Button
                    size="small"
                    style={{ marginLeft: 8 }}
                    onClick={() => setEditTimesModal({ visible: true, contract, times: contract.times.filter(Boolean) })}
                  >
                    Edit Times
                  </Button>
                </div>
                
                <div className="contract-info">
                  <p><strong>Type:</strong> {contract.type}</p>
                  <p><strong>Measure Type:</strong> {contract.measureType}</p>
                  <p><strong>Times:</strong> {formatCheckInTimes(contract)}</p>
                </div>

                {/* Contract Preview */}
                <div className="contract-preview" style={{ marginBottom: 24 }}>
                  <h5 style={{ margin: '8px 0' }}>Contract Preview</h5>
                  
                  {/* Check-in Times Display (only for daily contracts) */}
                  {contract.type === 'daily' && contract.times.length > 0 && (
                    <div style={{ 
                      background: '#e3f2fd', 
                      border: '1px solid #2196f3', 
                      borderRadius: 6, 
                      padding: 12,
                      marginBottom: 16,
                      textAlign: 'center'
                    }}>
                      <h6 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '14px' }}>
                        📅 Check-in Times - Students must check in at these times:
                      </h6>
                      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
                        {contract.times.filter(Boolean).map((time, index) => (
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

                  {/* Check-in Times Display for weekly contracts */}
                  {contract.type === 'weekly' && contract.times.length > 0 && (
                    <div style={{ 
                      background: '#e8f5e8', 
                      border: '1px solid #4caf50', 
                      borderRadius: 6, 
                      padding: 12,
                      marginBottom: 16,
                      textAlign: 'center'
                    }}>
                      <h6 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '14px' }}>
                        📅 Weekly Check-in Schedule - Students must check in on these days at the specified time:
                      </h6>
                      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        {contract.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time)).map((day, index) => (
                          <span key={index} style={{ 
                            padding: '4px 8px', 
                            background: 'white', 
                            border: '1px solid #4caf50', 
                            borderRadius: 4,
                            fontWeight: 500,
                            color: '#2e7d32',
                            fontSize: '13px'
                          }}>
                            {day}
                          </span>
                        ))}
                      </div>
                      {contract.times.find(time => time.includes(':') && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time)) && (
                        <div style={{ marginTop: 8 }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            background: 'white', 
                            border: '1px solid #4caf50', 
                            borderRadius: 4,
                            fontWeight: 500,
                            color: '#2e7d32',
                            fontSize: '13px'
                          }}>
                            Check-in Time: {contract.times.find(time => time.includes(':') && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time))}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <table className="contract-preview-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ccc', padding: 6, background: '#f8f9fa' }}>Behavior</th>
                        {/* For weekly contracts, only show days as columns, not the time */}
                        {(contract.type === 'weekly' 
                          ? contract.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time))
                          : contract.times.filter(Boolean)
                        ).map((time) => (
                          <th key={time} style={{ border: '1px solid #ccc', padding: 6, background: '#f8f9fa' }}>{time}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contract.rows.map((row) => (
                        <tr key={row}>
                          <td style={{ border: '1px solid #ccc', padding: 6, background: '#f8f9fa', fontWeight: 500 }}>{row}</td>
                          {/* For weekly contracts, only show days as columns, not the time */}
                          {(contract.type === 'weekly' 
                            ? contract.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time))
                            : contract.times.filter(Boolean)
                          ).map((time) => (
                            <td key={time} style={{ border: '1px solid #ccc', padding: 6, textAlign: 'center' }}>
                              {contract.measureType === 'smileys' ? (
                                <span style={{ fontSize: 22 }}>
                                  {/* Show all 3 smileys as faded, for preview */}
                                  <span style={{ opacity: 0.7, marginRight: 2 }}>😊</span>
                                  <span style={{ opacity: 0.7, marginRight: 2 }}>😐</span>
                                  <span style={{ opacity: 0.7 }}>😞</span>
                                </span>
                              ) : (
                                <span style={{ fontSize: 16 }}>
                                  {/* Show numbers 1-5 as faded, for preview */}
                                  {[1,2,3,4,5].map(n => <span key={n} style={{ opacity: 0.7, marginRight: 2 }}>{n}</span>)}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Contract Chart */}
                <div className="contract-chart">
                  <table>
                    <thead>
                      <tr>
                        <th>Behavior</th>
                        {/* For weekly contracts, only show days as columns, not the time */}
                        {(contract.type === 'weekly' 
                          ? contract.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time))
                          : contract.times.filter(Boolean)
                        ).map((time) => (
                          <th key={time}>{time}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contract.rows.map((row) => (
                        <tr key={row}>
                          <td>{row}</td>
                          {/* For weekly contracts, only show days as columns, not the time */}
                          {(contract.type === 'weekly' 
                            ? contract.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time))
                            : contract.times.filter(Boolean)
                          ).map((time) => {
                            const today = new Date().toISOString().split('T')[0];
                            const dayEntry = contract.chart.find(day => day.date === today);
                            const timeEntry = dayEntry?.entries.find(entry => entry.time === time);
                            
                            return (
                              <td key={time}>
                                {contract.measureType === 'smileys' ? (
                                  <select
                                    value={timeEntry?.value || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const note = value !== 'smiley' ? prompt('Please provide a note for this score:') : '';
                                      handleUpdateEntry(contract._id, today, time, value, note);
                                    }}
                                  >
                                    <option value="">-</option>
                                    <option value="smiley">😊</option>
                                    <option value="neutral">😐</option>
                                    <option value="sad">😞</option>
                                  </select>
                                ) : (
                                  <select
                                    value={timeEntry?.value || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const note = value !== '5' ? prompt('Please provide a note for this score:') : '';
                                      handleUpdateEntry(contract._id, today, time, value, note);
                                    }}
                                  >
                                    <option value="">-</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                  </select>
                                )}
                                {timeEntry?.note && (
                                  <div className="note-indicator">📝</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Times Modal */}
      <Modal
        title="Edit Check-in Times"
        open={editTimesModal.visible}
        onOk={async () => {
          try {
            await updateContractTimes({
              variables: {
                contractId: editTimesModal.contract._id,
                times: editTimesModal.times.filter(Boolean),
              },
            });
            setEditTimesModal({ visible: false, contract: null, times: [] });
            refetchContracts();
            message.success('Check-in times updated!');
          } catch (err) {
            message.error('Failed to update times');
          }
        }}
        onCancel={() => setEditTimesModal({ visible: false, contract: null, times: [] })}
        okText="Save"
        cancelText="Cancel"
      >
        {editTimesModal.contract && (
          <div>
            {editTimesModal.contract.type === 'daily' ? (
              <div>
                {editTimesModal.times.map((time, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <input
                      type="time"
                      value={time}
                      onChange={e => {
                        const newTimes = [...editTimesModal.times];
                        newTimes[idx] = e.target.value;
                        setEditTimesModal(modal => ({ ...modal, times: newTimes }));
                      }}
                      style={{ marginRight: 8 }}
                    />
                    <Button size="small" danger onClick={() => {
                      const newTimes = editTimesModal.times.filter((_, i) => i !== idx);
                      setEditTimesModal(modal => ({ ...modal, times: newTimes }));
                    }}>Remove</Button>
                  </div>
                ))}
                <Button size="small" onClick={() => setEditTimesModal(modal => ({ ...modal, times: [...modal.times, ''] }))}>Add Time</Button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ marginBottom: 8 }}>Select Days:</h4>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <label key={day} style={{ display: 'block', marginBottom: 4 }}>
                      <input
                        type="checkbox"
                        checked={editTimesModal.times.includes(day)}
                        onChange={e => {
                          let newTimes;
                          if (e.target.checked) {
                            newTimes = [...editTimesModal.times, day];
                          } else {
                            newTimes = editTimesModal.times.filter(t => t !== day);
                          }
                          setEditTimesModal(modal => ({ ...modal, times: newTimes }));
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
                
                <div>
                  <h4 style={{ marginBottom: 8 }}>Check-in Time:</h4>
                  <input
                    type="time"
                    value={editTimesModal.times.find(time => time.includes(':') && !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time)) || ''}
                    onChange={e => {
                      // Remove any existing time and add the new one
                      const daysOnly = editTimesModal.times.filter(time => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(time));
                      setEditTimesModal(modal => ({ ...modal, times: [...daysOnly, e.target.value] }));
                    }}
                    style={{ padding: 6, border: '1px solid #ccc', borderRadius: 4 }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add New Contract Measure Modal */}
      <Modal
        title="Create New Contract Data Measure"
        open={isContractMeasureModalOpen}
        onCancel={() => setIsContractMeasureModalOpen(false)}
        footer={null}
        width={600}
      >
        <AddNewContractMeasure 
          onClose={() => setIsContractMeasureModalOpen(false)}
          onSuccess={() => {
            refetchContractMeasures();
            refetchMe();
          }}
        />
      </Modal>
    </div>
  );
};

export default Contracts; 
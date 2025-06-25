import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME } from '../../../utils/queries';
import { QUERY_CONTRACTS, QUERY_CONTRACT_MEASURES } from '../../../utils/queries';
import { CREATE_CONTRACT, UPDATE_CONTRACT_ENTRY, DELETE_CONTRACT } from '../../../utils/mutations';
import './index.css';

const Contracts = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [contractForm, setContractForm] = useState({
    title: '',
    contractMeasureIds: [],
    type: 'daily',
    times: [],
    measureType: 'smileys',
    rows: []
  });

  const { data: userData } = useQuery(QUERY_ME);
  const { data: contractMeasuresData } = useQuery(QUERY_CONTRACT_MEASURES);
  const { data: contractsData, refetch: refetchContracts } = useQuery(QUERY_CONTRACTS, {
    variables: { studentId: selectedStudent?._id },
    skip: !selectedStudent
  });

  const [createContract] = useMutation(CREATE_CONTRACT);
  const [updateContractEntry] = useMutation(UPDATE_CONTRACT_ENTRY);
  const [deleteContract] = useMutation(DELETE_CONTRACT);

  const students = userData?.me?.students || [];
  const contractMeasures = contractMeasuresData?.contractMeasures || [];
  const contracts = contractsData?.contracts || [];

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowCreateForm(false);
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
        times: [],
        measureType: 'smileys',
        rows: []
      });
      refetchContracts();
    } catch (error) {
      console.error('Error creating contract:', error);
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
    } catch (error) {
      console.error('Error deleting contract:', error);
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

  return (
    <div className="contracts-container">
      <h2>Contracts</h2>
      
      {/* Student Selection */}
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
                <div className="measure-selection">
                  {contractMeasures.map((measure) => (
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
              </div>

              <div className="form-group">
                <label>Contract Type:</label>
                <select
                  value={contractForm.type}
                  onChange={(e) => setContractForm({...contractForm, type: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Times:</label>
                {contractForm.type === 'daily' ? (
                  <div className="time-inputs">
                    <input
                      type="time"
                      onChange={(e) => setContractForm({...contractForm, times: [e.target.value]})}
                    />
                    <button onClick={() => setContractForm({...contractForm, times: [...contractForm.times, '']})}>
                      Add Time
                    </button>
                  </div>
                ) : (
                  <div className="weekday-selection">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                      <label key={day} className="day-checkbox">
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
                        />
                        {day}
                      </label>
                    ))}
                  </div>
                )}
              </div>

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
                  <button 
                    onClick={() => handleDeleteContract(contract._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="contract-info">
                  <p><strong>Type:</strong> {contract.type}</p>
                  <p><strong>Measure Type:</strong> {contract.measureType}</p>
                  <p><strong>Times:</strong> {contract.times.join(', ')}</p>
                </div>

                {/* Contract Chart */}
                <div className="contract-chart">
                  <table>
                    <thead>
                      <tr>
                        <th>Behavior</th>
                        {contract.times.map((time) => (
                          <th key={time}>{time}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contract.rows.map((row) => (
                        <tr key={row}>
                          <td>{row}</td>
                          {contract.times.map((time) => {
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
    </div>
  );
};

export default Contracts; 
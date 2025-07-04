import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { QUERY_ME } from '../../../utils/queries';
import { QUERY_CONTRACTS } from '../../../utils/queries';
import { UPDATE_CONTRACT_ENTRY } from '../../../utils/mutations';
import './index.css';

const StudentContracts = () => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);

  const { data: userData } = useQuery(QUERY_ME);
  const { data: contractsData, refetch: refetchContracts } = useQuery(QUERY_CONTRACTS, {
    variables: { studentId: userData?.me?._id },
    skip: !userData?.me?._id
  });

  const [updateContractEntry] = useMutation(UPDATE_CONTRACT_ENTRY);

  const contracts = contractsData?.contracts || [];
  const student = userData?.me;

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
      refetchContracts();
    } catch (error) {
      console.error('Error updating contract entry:', error);
    }
  };

  const handleScoreSelect = (contract, time, value, row) => {
    if (value !== 'smiley' && value !== '5') {
      setCurrentEntry({ contract, time, value, row });
      setShowNoteModal(true);
    } else {
      const today = new Date().toISOString().split('T')[0];
      handleUpdateEntry(contract._id, today, time, value, '', row);
    }
  };

  const handleNoteSubmit = () => {
    if (currentEntry) {
      const note = document.getElementById('note-input').value;
      const today = new Date().toISOString().split('T')[0];
      handleUpdateEntry(currentEntry.contract._id, today, currentEntry.time, currentEntry.value, note, currentEntry.row);
      setShowNoteModal(false);
      setCurrentEntry(null);
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

  if (!student) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="student-contracts-container">
      <h2>My Behavior Contracts</h2>
      
      {contracts.length === 0 ? (
        <div className="no-contracts">
          <p>You don't have any behavior contracts assigned yet.</p>
          <p>Your teacher will create contracts for you when needed.</p>
        </div>
      ) : (
        <div className="contracts-list">
          {contracts.map((contract) => (
            <div key={contract._id} className="contract-card">
              <div className="contract-header">
                <h3>{contract.title}</h3>
                <div className="contract-info">
                  <span className="contract-type">{contract.type}</span>
                  <span className="contract-measure-type">{contract.measureType}</span>
                </div>
              </div>

              {/* Check-in Times Display (only for daily contracts) */}
              {contract.type === 'daily' && contract.times.length > 0 && (
                <div className="check-in-times-display" style={{ 
                  background: '#e3f2fd', 
                  border: '1px solid #2196f3', 
                  borderRadius: 6, 
                  padding: 12,
                  marginBottom: 16,
                  textAlign: 'center'
                }}>
                  <h6 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '14px' }}>
                    📅 Check-in Times - You must check in at these times:
                  </h6>
                  <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {contract.times.map((time, index) => (
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
                <div className="check-in-times-display" style={{ 
                  background: '#e8f5e8', 
                  border: '1px solid #4caf50', 
                  borderRadius: 6, 
                  padding: 12,
                  marginBottom: 16,
                  textAlign: 'center'
                }}>
                  <h6 style={{ margin: '0 0 8px 0', color: '#2e7d32', fontSize: '14px' }}>
                    📅 Weekly Check-in Schedule - You must check in on these days at the specified time:
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
                        <td className="behavior-name">{row}</td>
                        {contract.times.map((time) => {
                          const today = new Date().toISOString().split('T')[0];
                          const dayEntry = contract.chart.find(day => day.date === today);
                          const timeEntry = dayEntry?.entries.find(entry => entry.time === time && entry.row === row);
                          
                          return (
                            <td key={time} className="score-cell">
                              {contract.measureType === 'smileys' ? (
                                <div className="smiley-selector">
                                  <button
                                    className={`smiley-btn ${timeEntry?.value === 'smiley' ? 'selected' : ''}`}
                                    onClick={() => handleScoreSelect(contract, time, 'smiley', row)}
                                  >
                                    😊
                                  </button>
                                  <button
                                    className={`smiley-btn ${timeEntry?.value === 'neutral' ? 'selected' : ''}`}
                                    onClick={() => handleScoreSelect(contract, time, 'neutral', row)}
                                  >
                                    😐
                                  </button>
                                  <button
                                    className={`smiley-btn ${timeEntry?.value === 'sad' ? 'selected' : ''}`}
                                    onClick={() => handleScoreSelect(contract, time, 'sad', row)}
                                  >
                                    😞
                                  </button>
                                </div>
                              ) : (
                                <div className="number-selector">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                      key={num}
                                      className={`number-btn ${timeEntry?.value === num.toString() ? 'selected' : ''}`}
                                      onClick={() => handleScoreSelect(contract, time, num.toString(), row)}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {timeEntry?.note && (
                                <div className="note-indicator" title={timeEntry.note}>
                                  📝
                                </div>
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
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="note-modal-overlay">
          <div className="note-modal">
            <h3>Add Note</h3>
            <p>Please provide a note explaining why this score was given:</p>
            <textarea
              id="note-input"
              placeholder="Enter your note here..."
              rows="4"
            />
            <div className="modal-actions">
              <button onClick={handleNoteSubmit} className="submit-btn">
                Submit
              </button>
              <button onClick={() => setShowNoteModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentContracts; 
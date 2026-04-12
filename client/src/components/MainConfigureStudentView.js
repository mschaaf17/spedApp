import React from 'react';
import StudentAccommodations from '../pages/StudentPages/StudentAccommodations/StudentAccommodations.js'
import { Button } from '@mui/material';

export default function MainConfigureStudentView({
  selectedStudent,
  selectedStudentData,
  showAccommodations,
  setShowAccommodations,
  showBreaks,
  setShowBreaks,
  getBehaviors,
  selectedCharts,
  setSelectedCharts,
  breakSettings,
  isUnlimitedBreaks,
  handleSaveStudentViewConfig,
  studentHasBreaksFeature,
}) {
  if (!selectedStudent) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>No student selected.</div>;
  }

  return (
    <div className="student-view-section">
      <div className="student-view-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Student View Configuration</h3>
            <p>Configure what {selectedStudent.username} will see on their student view</p>
          </div>
          <Button
            variant="contained"
            onClick={handleSaveStudentViewConfig}
            disabled={!selectedStudent}
          >
            Save Configuration
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
        {/* Configuration Panel */}
        <div style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h4>Available Options</h4>

          {/* Accommodations Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #d9d9d9'
            }}>
              <div>
                <h5 style={{ margin: 0 }}>Accommodations</h5>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Show all assigned accommodations
                </p>
              </div>
              <input
                type="checkbox"
                checked={showAccommodations}
                onChange={(e) => setShowAccommodations(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
            </div>
          </div>

          {/* Breaks Section - Only show if student has breaks feature */}
          {studentHasBreaksFeature && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}>
                <div>
                  <h5 style={{ margin: 0 }}>Breaks</h5>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                    Enable break functionality for student
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showBreaks}
                  onChange={(e) => setShowBreaks(e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div>
            <h5>Individual Charts</h5>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              Select specific behavior charts to show
            </p>

            {getBehaviors().map(behavior => (
              <div key={`${behavior.type}-${behavior.id}`} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px solid #d9d9d9',
                marginBottom: '8px'
              }}>
                <div>
                  <span style={{ fontWeight: 500 }}>{behavior.title}</span>
                  <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                    ({behavior.type})
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedCharts.some(chart =>
                    chart.type === behavior.type && chart.id === behavior.id
                  )}
                  disabled={behavior.type.startsWith('break-') && !showBreaks}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCharts([...selectedCharts, { type: behavior.type, id: behavior.id, title: behavior.title }]);
                    } else {
                      setSelectedCharts(selectedCharts.filter(chart =>
                        !(chart.type === behavior.type && chart.id === behavior.id)
                      ));
                    }
                  }}
                  style={{ transform: 'scale(1.1)' }}
                />
              </div>
            ))}

            {getBehaviors().length === 0 && (
              <div style={{
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: '1px dashed #d9d9d9',
                textAlign: 'center',
                color: '#666'
              }}>
                No data measures available. Add data measures first to configure charts.
              </div>
            )}
          </div>
        </div>

        {/* Student View Preview */}
        <div style={{ flex: 1, backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
          <h4>Student View Preview</h4>
          <div style={{
            backgroundColor: 'white',
            minHeight: '400px',
            padding: '20px',
            borderRadius: '6px',
            border: '1px solid #d9d9d9'
          }}>
            <StudentAccommodations
              accommodations={selectedStudentData?.user?.accommodations}
              behaviorFrequencies={selectedStudentData?.user?.behaviorFrequencies}
              behaviorDurations={selectedStudentData?.user?.behaviorDurations}
              studentViewConfig={{
                showAccommodations,
                selectedCharts
              }}
              breakHistory={selectedStudentData?.user?.breakHistory}
              breakSettings={showBreaks ? {
                isEnabled: true,
                duration: breakSettings.duration,
                hasDelay: breakSettings.hasDelay,
                delayDuration: breakSettings.delayDuration,
                dailyLimit: isUnlimitedBreaks ? 0 : breakSettings.dailyLimit,
              } : { isEnabled: false }}
              previewMode={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

 


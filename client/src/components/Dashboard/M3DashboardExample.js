import React, { useState } from 'react';
import { M3Button, M3Card } from '../M3Components';
import { PlusOutlined, SearchOutlined, SettingOutlined, BarChartOutlined } from '@ant-design/icons';

// Example of how to integrate M3 components into your existing Dashboard
const M3DashboardExample = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <div className="md-surface" style={{ minHeight: '100vh', padding: 'var(--md-spacing-lg)' }}>
      {/* M3 Header */}
      <header className="md-card md-card-elevated md-card-padding-medium" 
              style={{ marginBottom: 'var(--md-spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="md-headline-large" style={{ color: 'var(--md-on-surface)', margin: 0 }}>
              Student Dashboard
            </h1>
            <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)', margin: 'var(--md-spacing-xs) 0 0 0' }}>
              Track and analyze student progress
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--md-spacing-sm)' }}>
            <M3Button variant="outlined" startIcon={<SettingOutlined />}>
              Settings
            </M3Button>
            <M3Button variant="filled" startIcon={<PlusOutlined />}>
              Add Student
            </M3Button>
          </div>
        </div>
      </header>

      {/* M3 Student Selector */}
      <M3Card variant="elevated" padding="medium" style={{ marginBottom: 'var(--md-spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--md-spacing-md)' }}>
          <div style={{ flex: 1 }}>
            <label className="md-label-large" style={{ color: 'var(--md-on-surface)', display: 'block', marginBottom: 'var(--md-spacing-xs)' }}>
              Select Student
            </label>
            <input 
              className="md-input" 
              placeholder="Search for a student..."
              style={{ width: '100%' }}
            />
          </div>
          <M3Button variant="tonal" startIcon={<SearchOutlined />}>
            Search
          </M3Button>
        </div>
      </M3Card>

      {/* M3 Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 'var(--md-spacing-lg)',
        marginBottom: 'var(--md-spacing-lg)'
      }}>
        {/* M3 Quick Actions Card */}
        <M3Card variant="elevated" padding="medium">
          <div className="md-card-header">
            <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)', margin: 0 }}>
              Quick Actions
            </h2>
          </div>
          <div className="md-card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-spacing-sm)' }}>
              <M3Button variant="outlined" fullWidth startIcon={<BarChartOutlined />}>
                View Analytics
              </M3Button>
              <M3Button variant="outlined" fullWidth startIcon={<PlusOutlined />}>
                Add Intervention
              </M3Button>
              <M3Button variant="outlined" fullWidth startIcon={<PlusOutlined />}>
                Add Accommodation
              </M3Button>
            </div>
          </div>
        </M3Card>

        {/* M3 Student Info Card */}
        <M3Card variant="elevated" padding="medium">
          <div className="md-card-header">
            <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)', margin: 0 }}>
              Student Information
            </h2>
          </div>
          <div className="md-card-content">
            {selectedStudent ? (
              <div>
                <p className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>
                  <strong>Name:</strong> {selectedStudent.name}
                </p>
                <p className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>
                  <strong>Grade:</strong> {selectedStudent.grade}
                </p>
                <p className="md-body-medium" style={{ color: 'var(--md-on-surface)' }}>
                  <strong>Interventions:</strong> {selectedStudent.interventions?.length || 0}
                </p>
              </div>
            ) : (
              <p className="md-body-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                Select a student to view information
              </p>
            )}
          </div>
        </M3Card>

        {/* M3 Recent Activity Card */}
        <M3Card variant="elevated" padding="medium">
          <div className="md-card-header">
            <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)', margin: 0 }}>
              Recent Activity
            </h2>
          </div>
          <div className="md-card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-spacing-sm)' }}>
              <div style={{ 
                padding: 'var(--md-spacing-sm)', 
                backgroundColor: 'var(--md-surface-variant)', 
                borderRadius: 'var(--md-radius-sm)',
                borderLeft: '4px solid var(--md-primary-50)'
              }}>
                <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)', margin: 0 }}>
                  Break intervention added
                </p>
                <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)', margin: 'var(--md-spacing-xs) 0 0 0' }}>
                  2 hours ago
                </p>
              </div>
              <div style={{ 
                padding: 'var(--md-spacing-sm)', 
                backgroundColor: 'var(--md-surface-variant)', 
                borderRadius: 'var(--md-radius-sm)',
                borderLeft: '4px solid var(--md-secondary-50)'
              }}>
                <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)', margin: 0 }}>
                  Frequency data logged
                </p>
                <p className="md-label-small" style={{ color: 'var(--md-on-surface-variant)', margin: 'var(--md-spacing-xs) 0 0 0' }}>
                  4 hours ago
                </p>
              </div>
            </div>
          </div>
        </M3Card>
      </div>

      {/* M3 Data Section */}
      <M3Card variant="elevated" padding="large">
        <div className="md-card-header">
          <h2 className="md-title-large" style={{ color: 'var(--md-on-surface)', margin: 0 }}>
            Data Analysis
          </h2>
        </div>
        <div className="md-card-content">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 'var(--md-spacing-md)' 
          }}>
            {/* M3 Metric Cards */}
            <div style={{ 
              padding: 'var(--md-spacing-md)', 
              backgroundColor: 'var(--md-primary-95)', 
              borderRadius: 'var(--md-radius-md)',
              textAlign: 'center'
            }}>
              <h3 className="md-headline-small" style={{ color: 'var(--md-primary-50)', margin: 0 }}>
                12
              </h3>
              <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)', margin: 'var(--md-spacing-xs) 0 0 0' }}>
                Total Interventions
              </p>
            </div>
            
            <div style={{ 
              padding: 'var(--md-spacing-md)', 
              backgroundColor: 'var(--md-secondary-95)', 
              borderRadius: 'var(--md-radius-md)',
              textAlign: 'center'
            }}>
              <h3 className="md-headline-small" style={{ color: 'var(--md-secondary-50)', margin: 0 }}>
                8
              </h3>
              <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)', margin: 'var(--md-spacing-xs) 0 0 0' }}>
                Active Accommodations
              </p>
            </div>
            
            <div style={{ 
              padding: 'var(--md-spacing-md)', 
              backgroundColor: 'var(--md-tertiary-95)', 
              borderRadius: 'var(--md-radius-md)',
              textAlign: 'center'
            }}>
              <h3 className="md-headline-small" style={{ color: 'var(--md-tertiary-50)', margin: 0 }}>
                24
              </h3>
              <p className="md-body-small" style={{ color: 'var(--md-on-surface-variant)', margin: 'var(--md-spacing-xs) 0 0 0' }}>
                Data Points Today
              </p>
            </div>
          </div>
        </div>
      </M3Card>

      {/* M3 Floating Action Button */}
      <button className="md-fab" onClick={() => console.log('FAB clicked')}>
        <PlusOutlined style={{ fontSize: '24px' }} />
      </button>
    </div>
  );
};

export default M3DashboardExample; 
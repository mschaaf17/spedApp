import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { M3Button, M3Card } from '../components/M3Components';
import { StarFilled, MenuOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';

const SidebarNav = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
   
       
      {/* Top Menu Icon */}
      <button className="md-icon-button" 
        style={{ position: 'fixed', top: 16, left: 16, zIndex: 2000 }}
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label="Open navigation"
        >
        <MenuOutlined />
      </button>

{sidebarOpen && (
      <nav
      className="md-surface md-elevation-1"
      style={{
        width: 280,
        minHeight: '100vh',
        padding: 'var(--md-spacing-lg) var(--md-spacing-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--md-spacing-lg)',
        background: 'var(--md-surface-variant)',
      }}
    >

      {/* Track Data Button */}
      <M3Button
        variant="filled"
        size="large"
        style={{
          background: 'var(--md-primary-95)',
          color: 'var(--md-primary-40)',
          fontWeight: 600,
          fontSize: '18px',
          marginBottom: 'var(--md-spacing-lg)',
        }}
        fullWidth
        onClick={() => navigate('/selectStudentToTrack')}
      >
        Track Data
      </M3Button>

      {/* Collapsible Configure Data Button */}
      <M3Button
        variant="filled"
        style={{
          background: 'var(--md-primary-95)',
          color: 'var(--md-primary-40)',
          fontWeight: 600,
          marginBottom: 'var(--md-spacing-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        fullWidth
        onClick={() => setConfigOpen((open) => !open)}
        endIcon={configOpen ? <DownOutlined /> : <RightOutlined />}
      >
        Configure Data For Student 1
      </M3Button>

      {/* Collapsible Content */}
      {configOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--md-spacing-md)', marginLeft: 24 }}>
          <M3Button variant="text" style={{ color: 'var(--md-on-surface)' }} fullWidth>
            Contracts
          </M3Button>
          <M3Button variant="text" style={{ color: 'var(--md-on-surface)' }} fullWidth>
            Breaks
          </M3Button>
          <M3Button variant="text" style={{ color: 'var(--md-on-surface)' }} fullWidth>
            Student View
          </M3Button>
        </div>
      )}

      <M3Button
        variant="filled"
        style={{
          background: 'var(--md-primary-95)',
          color: 'var(--md-primary-40)',
          fontWeight: 600,
          marginTop: 'var(--md-spacing-lg)',
        }}
        fullWidth
        onClick={() => navigate('/dashboard')}
      >
        Analyze Data For Student 1
      </M3Button>
     
    </nav>
    )}
    </>
  );
};

export default SidebarNav;

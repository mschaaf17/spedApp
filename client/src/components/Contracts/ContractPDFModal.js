import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Table, Typography, message, Select } from 'antd';
import html2pdf from 'html2pdf.js';

const { Title, Text } = Typography;

function parseDateSafe(dateValue) {
  if (!dateValue) return null;
  if (typeof dateValue === 'number') return new Date(dateValue);
  if (typeof dateValue === 'string') {
    if (/^\d+$/.test(dateValue)) return new Date(Number(dateValue));
    return new Date(dateValue);
  }
  return new Date(dateValue);
}

const smileyToNumber = (value) => {
  if (!value) return 0;
  const v = value.trim().toLowerCase();
  if (v === 'smiley' || v === '😊') return 3;
  if (v === 'neutral' || v === '😐') return 2;
  if (v === 'sad' || v === '😢') return 1;
  const n = Number(value);
  return isNaN(n) ? 0 : n;
};

// Helper to get week start (Monday) for a date
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}

// Helper to format week label
function formatWeekLabel(date) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

const ContractPDFModal = ({ visible, onCancel, contract, student, teacher }) => {
  const printRef = useRef();
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Always call useEffect, check for contract inside
  useEffect(() => {
    if (!contract) return;
    const chart = contract?.chart || [];
    const times = contract?.times || [];
    const isWeekly = contract?.type === 'weekly' || (chart.length > 1 && times.length <= 1);
    const isDaily = contract?.type === 'daily' || (chart.length === 1 && times.length > 1);
    let dateOptions = [];
    if (isWeekly) {
      let weekGroups = {};
      chart.forEach(day => {
        const weekStart = getWeekStart(day.date).toISOString().slice(0, 10);
        if (!weekGroups[weekStart]) weekGroups[weekStart] = [];
        weekGroups[weekStart].push(day);
      });
      dateOptions = Object.keys(weekGroups).map(weekStart => ({
        value: weekStart,
        label: formatWeekLabel(weekStart)
      }));
      if (dateOptions.length > 0 && !selectedWeek) {
        setSelectedWeek(dateOptions[0].value);
      }
    } else if (isDaily) {
      dateOptions = chart.map(day => ({
        value: day.date,
        label: parseDateSafe(day.date)?.toLocaleDateString() || day.date
      }));
      if (dateOptions.length > 0 && !selectedDay) {
        setSelectedDay(dateOptions[0].value);
      }
    }
  }, [contract, selectedWeek, selectedDay]);

  if (!contract) return null;

  const behaviors = contract?.rows || [];
  const chart = contract?.chart || [];
  const times = contract?.times || [];
  const isWeekly = contract?.type === 'weekly' || (chart.length > 1 && times.length <= 1);
  const isDaily = contract?.type === 'daily' || (chart.length === 1 && times.length > 1);

  // --- Date Dropdown Logic ---
  let dateOptions = [];
  let selectedKey = null;
  let setSelectedKey = null;
  let columns = [];
  let dataSource = [];

  // Weekly: group chart entries by week start
  let weekGroups = {};
  if (isWeekly) {
    chart.forEach(day => {
      const weekStart = getWeekStart(day.date).toISOString().slice(0, 10);
      if (!weekGroups[weekStart]) weekGroups[weekStart] = [];
      weekGroups[weekStart].push(day);
    });
    dateOptions = Object.keys(weekGroups).map(weekStart => ({
      value: weekStart,
      label: formatWeekLabel(weekStart)
    }));
    selectedKey = selectedWeek || (dateOptions[0] && dateOptions[0].value);
    setSelectedKey = setSelectedWeek;
  } else if (isDaily) {
    dateOptions = chart.map(day => ({
      value: day.date,
      label: parseDateSafe(day.date)?.toLocaleDateString() || day.date
    }));
    selectedKey = selectedDay || (dateOptions[0] && dateOptions[0].value);
    setSelectedKey = setSelectedDay;
  }

  if (isWeekly && selectedKey) {
    const daysInWeek = weekGroups[selectedKey] || [];
    columns = [
      { title: 'Behavior', dataIndex: 'behavior', key: 'behavior' },
      ...daysInWeek.map(day => {
        const d = parseDateSafe(day.date);
        return {
          title: `${d ? d.toLocaleDateString(undefined, { weekday: 'long' }) : ''} (${d ? d.toLocaleDateString() : day.date})`,
          dataIndex: day.date,
          key: day.date
        };
      })
    ];
    dataSource = behaviors.map(behavior => {
      const row = { key: behavior, behavior };
      daysInWeek.forEach(day => {
        const entry = (day.entries || []).find(e => e.row === behavior);
        row[day.date] = entry ? smileyToNumber(entry.value) : '';
      });
      return row;
    });
  } else if (isDaily && selectedKey) {
    const day = chart.find(d => d.date === selectedKey) || {};
    columns = [
      { title: 'Behavior', dataIndex: 'behavior', key: 'behavior' },
      ...times.map(time => ({
        title: time,
        dataIndex: time,
        key: time
      }))
    ];
    dataSource = behaviors.map(behavior => {
      const row = { key: behavior, behavior };
      times.forEach(time => {
        const entry = (day.entries || []).find(e => e.row === behavior && e.time === time);
        row[time] = entry ? smileyToNumber(entry.value) : '';
      });
      return row;
    });
  } else if (!isWeekly && !isDaily) {
    columns = [
      { title: 'Behavior', dataIndex: 'behavior', key: 'behavior' },
      { title: 'Score', dataIndex: 'score', key: 'score' }
    ];
    dataSource = behaviors.map(behavior => {
      const total = chart.reduce((sum, day) => {
        const entries = (day.entries || []).filter(e => e.row === behavior);
        return sum + entries.reduce((s, e) => s + smileyToNumber(e.value), 0);
      }, 0);
      return { key: behavior, behavior, score: total > 0 ? total : '' };
    });
  }

  // --- Aggregate notes from chart entries ---
  let notes = [];
  if (isWeekly && selectedKey) {
    const daysInWeek = weekGroups[selectedKey] || [];
    daysInWeek.forEach(day => {
      (day.entries || []).forEach(entry => {
        if (entry.note && entry.note.trim()) {
          notes.push({
            date: day.date,
            behavior: entry.row,
            note: entry.note
          });
        }
      });
    });
  } else if (isDaily && selectedKey) {
    const day = chart.find(d => d.date === selectedKey);
    if (day) {
      (day.entries || []).forEach(entry => {
        if (entry.note && entry.note.trim()) {
          notes.push({
            date: day.date,
            behavior: entry.row,
            note: entry.note
          });
        }
      });
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    html2pdf().from(printRef.current).save(`${contract?.title || 'contract'}.pdf`);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Contract Report: ${contract?.title || ''}`);
    const body = encodeURIComponent('Please find the attached contract report.');
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      style={{ top: 40 }}
      bodyStyle={{ padding: 0 }}
      destroyOnClose
    >
      <div ref={printRef} className="contract-pdf-print-area" style={{ background: 'white', padding: 24 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 16 }}>{contract?.title || 'Contract'}</Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <Text strong>Student ID:</Text> {student?._id || 'N/A'}<br />
            <Text strong>Teacher:</Text> {teacher?.firstName} {teacher?.lastName}<br />
            <Text strong>Type:</Text> {contract?.type}<br />
            <Text strong>Measure Type:</Text> {contract?.measureType}
          </div>
          <div>
            <Text strong>{isWeekly ? 'Week:' : 'Date:'}</Text> {' '}
            <Select
              value={selectedKey}
              onChange={v => setSelectedKey(v)}
              style={{ minWidth: 180 }}
              options={dateOptions}
            />
          </div>
          <div>
            <Text strong>Behaviors:</Text> {behaviors.join(', ')}<br />
            <Text strong>Time Slots:</Text> {contract?.times?.join(', ')}
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          style={{ marginBottom: 16 }}
        />
        <div style={{ marginTop: 16 }}>
          <Text strong>Notes</Text>
          <ul style={{ marginTop: 8 }}>
            {notes.length === 0 && <li>No notes for this selection.</li>}
            {notes.map((note, idx) => (
              <li key={idx}><b>{parseDateSafe(note.date)?.toLocaleDateString() || note.date}</b> — <b>{note.behavior}:</b> {note.note}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <Button onClick={handlePrint}>Print</Button>
        <Button onClick={handleDownloadPDF}>Download PDF</Button>
        <Button onClick={handleEmail}>Email</Button>
        <Button onClick={onCancel}>Close</Button>
      </div>
    </Modal>
  );
};

export default ContractPDFModal; 
//TODO: fix the modal issues when more than duration is opened


import React, {useState, useEffect} from 'react'
import { Modal, Button, Select, message } from "antd"
import "./index.css"
import { useQuery, useMutation } from '@apollo/client';
import {
  QUERY_TIMERS_FOR_DURATION,
  QUERY_DURATIONS_FOR_STUDENT,
  QUERY_DURATION_TEMPLATES
} from '../../utils/queries'; // adjust pa
import {
  START_DURATION_TIMER,
  END_DURATION_TIMER,
  RESUME_DURATION_TIMER,
  RESET_DURATION_TIMER,
  SAVE_DURATION_TIMER,
  ADD_DATA_MEASURE_TO_STUDENT,
  REMOVE_DURATION_BEING_TRACKED_FOR_STUDENT
} from '../../utils/mutations';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddIcon from '@mui/icons-material/Add';

export default function DurationTimers({ studentId }) {
  const [showSelect, setShowSelect] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedBehaviorIds, setSelectedBehaviorIds] = useState([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [deleteIconBehaviorId, setDeleteIconBehaviorId] = useState(null);
  const [selectedBehaviorTitleForDelete, setSelectedBehaviorTitleForDelete] = useState('');

  // Query all durations assigned to this student
  const { data: durationData, loading: durationLoading, refetch: durationRefetch } = useQuery(QUERY_DURATIONS_FOR_STUDENT, {
    variables: { studentId }
  });
  const durations = durationData?.duration || [];

  // Query all duration templates
  const { data: templateData, loading: templateLoading, refetch: refetchTemplates } = useQuery(QUERY_DURATION_TEMPLATES);
  const durationTemplates = templateData?.duration?.filter(t => t.isTemplate) || [];

  // Add duration to student
  const [addDataMeasureToStudent] = useMutation(ADD_DATA_MEASURE_TO_STUDENT, {
    onCompleted: () => {
      durationRefetch();
      refetchTemplates();
      setShowSelect(false);
      setSelectedTemplateId(null);
      message.success('Duration added!');
    }
  });

  // Remove duration from student
  const [removeDurationBeingTrackedForStudent] = useMutation(REMOVE_DURATION_BEING_TRACKED_FOR_STUDENT, {
    onCompleted: () => {
      durationRefetch();
      message.success('Duration removed!');
    }
  });

  // For each duration, manage its own timer state
  const [timersState, setTimersState] = useState({}); // { [durationId]: { time, timerOn, pendingStop } }

  // Add duration (from template) to student
  const handleAddDuration = async () => {
    if (!selectedTemplateId) return;
    await addDataMeasureToStudent({
      variables: { dataMeasureId: selectedTemplateId, studentId }
    });
  };

  // Remove duration from student
  const handleRemoveDuration = async (durationId) => {
    await removeDurationBeingTrackedForStudent({
      variables: { durationId, studentId }
    });
  };

  // Get templates not already assigned
  const assignedTitles = durations.map(d => d.behaviorTitle);
  const availableTemplates = durationTemplates.filter(
    t => !assignedTitles.includes(t.behaviorTitle)
  );

  // Timer controls for each duration
  const TimerControls = ({ duration }) => {
    const durationId = duration._id;
    const { data: timersData, loading: timersLoading, refetch: timersRefetch } = useQuery(QUERY_TIMERS_FOR_DURATION, {
      variables: { durationId, studentId }
    });
    const timers = timersData?.duration?.timers || [];
    const runningTimer = timers.find(t => t.status === 'running');

    // Timer state for this duration
    const timerState = timersState[durationId] || { time: 0, timerOn: false, pendingStop: false };
    const setTimerState = (newState) => setTimersState(prev => ({ ...prev, [durationId]: { ...prev[durationId], ...newState } }));

    // Mutations
    const [startTimer] = useMutation(START_DURATION_TIMER, {
      onCompleted: () => { durationRefetch(); timersRefetch(); setTimerState({ timerOn: true }); }
    });
    const [endTimer] = useMutation(END_DURATION_TIMER, {
      onCompleted: () => { timersRefetch(); setTimerState({ timerOn: false, pendingStop: false }); }
    });
    const [resumeTimer] = useMutation(RESUME_DURATION_TIMER, {
      onCompleted: () => { timersRefetch(); setTimerState({ timerOn: true }); }
    });
    const [resetTimer] = useMutation(RESET_DURATION_TIMER, {
      onCompleted: () => { timersRefetch(); setTimerState({ time: 0, timerOn: false }); }
    });
    const [saveTimer] = useMutation(SAVE_DURATION_TIMER, {
      onCompleted: () => { timersRefetch(); setTimerState({ timerOn: false }); }
    });

    // Timer interval effect
    useEffect(() => {
      let interval = null;
      let isMounted = true;
      if (timerState.timerOn) {
        interval = setInterval(() => {
          if (isMounted) {
            setTimerState(prev => ({ ...prev, time: (prev.time || 0) + 1000 }));
          }
        }, 1000);
      }
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    }, [timerState.timerOn]);

    // Pending stop effect
    useEffect(() => {
      if (timerState.pendingStop && runningTimer) {
        endTimer({ variables: { durationId, timerId: runningTimer.timerId, studentId } });
        setTimerState({ pendingStop: false });
      }
    }, [timerState.pendingStop, runningTimer]);

    // Initialize timer state only once when component mounts
    useEffect(() => {
      if (!timersState[durationId]) {
        setTimersState(prev => ({
          ...prev,
          [durationId]: { time: 0, timerOn: false, pendingStop: false }
        }));
      }
    }, [durationId]); // Only depend on durationId

    // Timer controls
    const handleStart = async () => {
      setTimerState({ timerOn: true, time: 0 });
      await startTimer({ variables: { durationId, studentId } });
    };
    const handleStop = () => {
      setTimerState({ timerOn: false });
      if (runningTimer) {
        endTimer({ variables: { durationId, timerId: runningTimer.timerId, studentId } });
        setTimerState({ pendingStop: false });
      } else {
        setTimerState({ pendingStop: true });
      }
    };
    const handleResume = () => setTimerState({ timerOn: true });
    const handleReset = () => setTimerState({ time: 0, timerOn: false });
    const handleSave = async () => { setTimerState({ timerOn: false }); await saveTimer({ variables: { durationId, timerId: runningTimer?.timerId, studentId } }); };

    return (
      <div className="timer-card">
        <div className="timer-display">
          {String(Math.floor((timerState.time / 3600000) % 60)).padStart(2, '0')}:
          {String(Math.floor((timerState.time / 60000) % 60)).padStart(2, '0')}:
          {String(Math.floor((timerState.time / 1000) % 60)).padStart(2, '0')}
        </div>
        {!timerState.timerOn && timerState.time === 0 && (
          <Button className="green time-btn" onClick={handleStart}>Start</Button>
        )}
        {timerState.timerOn && (
          <Button className="red time-btn" onClick={handleStop}>Stop</Button>
        )}
        {!timerState.timerOn && timerState.time !== 0 && (
          <>
            <Button className="green time-btn" onClick={handleResume}>Resume</Button>
            <Button className="yellow time-btn" onClick={handleReset}>Reset</Button>
            <Button className="blue time-btn" onClick={handleSave}>Save</Button>
          </>
        )}
        <Button danger icon={<DeleteForeverIcon />} onClick={() => handleRemoveDuration(durationId)} style={{ marginLeft: 8 }}>Remove</Button>
      </div>
    );
  };

  if (durationLoading || templateLoading) return <div>Loading...</div>;

  return (
    <div className="data-logging-container">
      <h2>Duration Data</h2>
      <div>
        <h2>Duration Behaviors</h2>
        {durations.length === 0 && <div>No durations found for this student.</div>}
        <ul>
          {durations.map(duration => (
            <li key={duration._id}>
              <b>{duration.behaviorTitle}</b>
              <TimerControls duration={duration} />
            </li>
          ))}
        </ul>
      </div>
      <div style={{ margin: '16px 0' }}>
        <Button icon={<AddIcon />} onClick={() => setShowSelect(!showSelect)}>
          Add Data Measure
        </Button>
        {showSelect && (
          <>
            <Select
              showSearch
              style={{ width: 300, marginLeft: 8 }}
              placeholder="Select duration behavior"
              optionFilterProp="children"
              value={selectedTemplateId}
              onChange={setSelectedTemplateId}
              filterOption={(input, option) =>
                option?.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableTemplates.map(template => (
                <Select.Option key={template._id} value={template._id}>
                  {template.behaviorTitle}
                </Select.Option>
              ))}
            </Select>
            <Button type="primary" onClick={handleAddDuration} disabled={!selectedTemplateId} style={{ marginLeft: 8 }}>
              Save
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export function StudentDurations({ studentId }) {
  const { data, loading, error } = useQuery(QUERY_DURATIONS_FOR_STUDENT, {
    variables: { studentId }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading durations</div>;

  const durations = data?.duration || [];

  return (
    <div>
      <h2>Duration Behaviors</h2>
      {durations.length === 0 && <div>No durations found for this student.</div>}
      <ul>
        {durations.map(duration => (
          <li key={duration._id}>
            <b>{duration.behaviorTitle}</b>
            {/* You can also show operationalDefinition or other info */}
            {/* Pass duration._id to your DurationTimers component */}
            <DurationTimers durationId={duration._id} behaviorTitle={duration.behaviorTitle} />
          </li>
        ))}
      </ul>
    </div>
  );
}

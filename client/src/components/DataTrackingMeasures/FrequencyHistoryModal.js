import { Modal, Typography, List } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';

export default function FrequencyHistoryModal({ open, onClose, behavior, interventions, data }) {
  if (!behavior) return null;

  // Filter interventions for this behavior
  const behaviorInterventions = interventions.filter(i => i.behaviorId?._id === behavior._id);

  // Calculate stats
  const totalDataPoints = (behavior.dailyCounts || []).length;
  const firstDate = behavior.dailyCounts?.[0]?.date;
  const lastDate = behavior.dailyCounts?.[behavior.dailyCounts.length - 1]?.date;

  function formatDate(date) {
    if (!date) return 'N/A';
    let d;
    if (typeof date === 'number') {
      d = new Date(date);
    } else if (typeof date === 'string') {
      // If it's a string of digits, treat as timestamp
      if (/^\d+$/.test(date)) {
        d = new Date(Number(date));
      } else {
        d = new Date(date);
      }
    } else {
      return 'N/A';
    }
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{
        background: '#fff',
        padding: 32,
        maxWidth: 600,
        margin: '40px auto',
        borderRadius: 8,
        position: 'relative'
      }}>
        {/* Close Icon */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6">History: {behavior.behaviorTitle}</Typography>
        <Typography variant="subtitle1" gutterBottom>
          Operational Definition: {behavior.operationalDefinition}
        </Typography>
        <Typography variant="body2">Started: {formatDate(firstDate)}</Typography>
        <Typography variant="body2">Total Data Points: {totalDataPoints}</Typography>
        <Typography variant="body2">Last Data Entry: {formatDate(lastDate)}</Typography>
        <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>Interventions Tried: {behaviorInterventions.length}</Typography>
        <List>
          {behaviorInterventions.map(i => (
            <li key={i._id}>
              <b>{i.title}</b> ({formatDate(i.createdAt)})
              <div>{i.summary}</div>
            </li>
          ))}
        </List>
        {/* Add more stats as needed */}
        {/* Assuming Button is available in the scope, otherwise this will cause an error */}
        {/* <Button onClick={onClose} sx={{ mt: 2 }}>Close</Button> */}
      </div>
    </Modal>
  );
}

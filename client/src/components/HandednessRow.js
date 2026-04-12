// client/src/components/HandednessRow.js
import React from 'react';
import { Box } from '@mui/material';

export default function HandednessRow({ left, center, right, leftHanded = false, sx = {} }) {
  // Order the children based on handedness
  const content = leftHanded
    ? [right, center, left]
    : [left, center, right];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        ...sx,
      }}
    >
      {content.map((el, i) => (
        <React.Fragment key={i}>{el}</React.Fragment>
      ))}
    </Box>
  );
}

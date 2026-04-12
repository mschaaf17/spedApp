import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Stack, Typography, Button, IconButton, Paper, BottomNavigation, BottomNavigationAction, Popover, TextField, Select, MenuItem
} from '@mui/material';


export default function MainBottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bottomNav, setBottomNav] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  

  const selectedStudent = location.state?.selectedStudent;

  return (
    <Box>
      {/* Bottom Navigation */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '24px 24px 0 0',
          px: 2,
        }}
      >
        <BottomNavigation
          showLabels
          value={bottomNav}
          onChange={(_, newValue) => setBottomNav(newValue)}
          sx={{
            bgcolor: 'transparent',
            borderRadius: '24px 24px 0 0',
            height: 64,
          }}
        >
          <BottomNavigationAction
            label="Accommodations"
         
            sx={{
              color: bottomNav === 0 ? '#5e35b1' : '#888',
              bgcolor: bottomNav === 0 ? '#ede7f6' : 'transparent',
              borderRadius: 3,
              minWidth: 120,
            }}
          />
          <BottomNavigationAction
            label="Contracts"
           
            sx={{
              color: bottomNav === 1 ? '#5e35b1' : '#888',
              bgcolor: bottomNav === 1 ? '#ede7f6' : 'transparent',
              borderRadius: 3,
              minWidth: 120,
            }}
          />
          <BottomNavigationAction
            label="Breaks"
          
            sx={{
              color: bottomNav === 2 ? '#5e35b1' : '#888',
              bgcolor: bottomNav === 2 ? '#ede7f6' : 'transparent',
              borderRadius: 3,
              minWidth: 120,
            }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
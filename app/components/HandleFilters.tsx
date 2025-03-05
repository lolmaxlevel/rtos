// app/components/HandleFilters.tsx
import React from 'react';
import { Box, Chip, Typography, Paper } from '@mui/material';
import { useProcessStore } from '@/app/store/processStore';

interface HandleFiltersProps {
  availableHandles: number[];
  selectedHandles: number[];
  onChange: (handles: number[]) => void;
}

export default function HandleFilters({ availableHandles, selectedHandles, onChange }: HandleFiltersProps) {
  const getProcessName = useProcessStore(state => state.getProcessName);

  const toggleHandle = (handle: number) => {
    if (selectedHandles.includes(handle)) {
      onChange(selectedHandles.filter(h => h !== handle));
    } else {
      onChange([...selectedHandles, handle]);
    }
  };

  const selectAll = () => onChange(availableHandles);
  const clearAll = () => onChange([]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ mr: 2 }}>Processes:</Typography>
        <Chip
          label="All"
          onClick={selectAll}
          variant="outlined"
          sx={{ mr: 0.5 }}
        />
        <Chip
          label="None"
          onClick={clearAll}
          variant="outlined"
        />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {availableHandles.map(handle => (
          <Chip
            key={handle}
            label={getProcessName(handle)}
            color={selectedHandles.includes(handle) ? "primary" : "default"}
            onClick={() => toggleHandle(handle)}
          />
        ))}
      </Box>
    </Paper>
  );
}
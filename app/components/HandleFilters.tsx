import React, {useMemo, useState} from 'react';
import {
    Box,
    Chip,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import {useProcessStore} from '@/app/store/processStore';

interface HandleFiltersProps {
    availableHandles: number[];
    selectedHandles: number[];
    onChange: (handles: number[]) => void;
}

export default function HandleFilters({availableHandles, selectedHandles, onChange}: HandleFiltersProps) {
    const getProcessName = useProcessStore(state => state.getProcessName);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleHandle = (handle: number) => {
        if (selectedHandles.includes(handle)) {
            onChange(selectedHandles.filter(h => h !== handle));
        } else {
            onChange([...selectedHandles, handle]);
        }
    };

    const selectAll = () => {
        onChange(availableHandles);
    };

    const clearAll = () => {
        onChange([]);
    };

    // Filter handles based on search term
    const filteredHandles = useMemo(() => {
        if (!searchTerm.trim()) return availableHandles;
        return availableHandles.filter(handle =>
            getProcessName(handle).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [availableHandles, searchTerm, getProcessName]);

    // Group handles by selection status for better organization
    const {selectedFiltered, unselectedFiltered} = useMemo(() => ({
        selectedFiltered: filteredHandles.filter(h => selectedHandles.includes(h)),
        unselectedFiltered: filteredHandles.filter(h => !selectedHandles.includes(h))
    }), [filteredHandles, selectedHandles]);

    return (
        <Paper sx={{p: 2, mb: 2}}>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography variant="h6" sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                        <FilterListIcon fontSize="small"/>
                        Processes
                    </Typography>

                    <Box>
                        <Chip
                            label="All"
                            onClick={selectAll}
                            variant="outlined"
                            color="primary"
                            sx={{mr: 0.5}}
                        />
                        <Chip
                            label="None"
                            onClick={clearAll}
                            variant="outlined"
                        />
                    </Box>
                </Box>

                <TextField
                    size="small"
                    placeholder="Search processes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small"/>
                                </InputAdornment>
                            ),
                        }
                    }}
                />

                {filteredHandles.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{py: 1}}>
                        No processes match your search
                    </Typography>
                )}

                {selectedFiltered.length > 0 && (
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Selected ({selectedFiltered.length})
                        </Typography>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5}}>
                            {selectedFiltered.map(handle => (
                                <Chip
                                    key={`sel-${handle}`}
                                    label={getProcessName(handle)}
                                    color="primary"
                                    onClick={() => toggleHandle(handle)}
                                    onDelete={() => toggleHandle(handle)}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {unselectedFiltered.length > 0 && selectedFiltered.length > 0 && (
                    <Divider sx={{my: 1}}/>
                )}

                {unselectedFiltered.length > 0 && (
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Available ({unselectedFiltered.length})
                        </Typography>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5}}>
                            {unselectedFiltered.map(handle => (
                                <Chip
                                    key={`unselect-${handle}`}
                                    label={getProcessName(handle)}
                                    variant="outlined"
                                    onClick={() => toggleHandle(handle)}
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Paper>
    );
}
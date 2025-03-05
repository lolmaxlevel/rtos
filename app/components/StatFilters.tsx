import React from 'react';
import { traceLabels } from '@/app/dict';
import {
    Box,
    Autocomplete,
    Chip,
    TextField,
    Button,
    Stack,
    ButtonGroup
} from '@mui/material';
import {signalGroups} from "@/app/groups";

interface StatFiltersProps {
    selectedIds: number[];
    onChange: (ids: number[]) => void;
}

export default function StatFilters({ selectedIds, onChange }: StatFiltersProps) {
    const options = Object.entries(traceLabels).map(([id, label]) => ({
        id: parseInt(id),
        label
    }));

    const selectedOptions = options.filter(option =>
        selectedIds.includes(option.id)
    );

    return (
        <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Autocomplete
                    multiple
                    options={options}
                    value={selectedOptions}
                    getOptionLabel={(option) => option.label}
                    onChange={(_, newValue) => {
                        onChange(newValue.map(v => v.id));
                    }}
                    limitTags={5}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            label="Select statistics"
                            placeholder="Search..."
                            sx={{ minWidth: 300 }}
                        />
                    )}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                {...getTagProps({ index })}
                                key={option.id+100}
                                label={option.label}
                            />
                        ))
                    }
                />
                <ButtonGroup>
                        <Button
                            variant="outlined"
                            onClick={() => onChange(Object.keys(traceLabels).map(Number))}
                        >
                            Select All
                        </Button>
                        {Object.entries(signalGroups).map(([groupName, ids]) => (
                            <Button
                                key={groupName}
                                variant="outlined"
                                onClick={() => onChange(ids)}
                            >
                                {groupName}
                            </Button>
                        ))}
                    </ButtonGroup>
            </Stack>
        </Box>
    );
}
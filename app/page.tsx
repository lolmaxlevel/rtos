'use client'
import {Button, ThemeProvider, createTheme} from '@mui/material';
import {Box, Container, Grid, Paper, Typography} from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import useWebSocket from "react-use-websocket";
import {useEffect, useState, useMemo, useRef, useCallback} from "react";
import {SignalMap} from "@/app/types/types";
import {processPackets} from "@/app/utils/packet";
import {createLineConfig} from '@/app/configs/eChartsConfigs';
import dynamic from 'next/dynamic';
import {processStore} from "@/app/store/processStore";

const ReactECharts = dynamic(() => import('echarts-for-react'), {ssr: false});
const StatFilters = dynamic(() => import('@/app/components/StatFilters'), {ssr: false});
const HandleFilters = dynamic(() => import('@/app/components/HandleFilters'), {ssr: false});

const getProcessName = (handle: number) => processStore.getState().getProcessName(handle);

const theme = createTheme({
    components: {
        MuiPaper: {
            defaultProps: {elevation: 2}
        }
    }
});

type ChartConfig = {
    title: string;
    config: any;
};

export default function Home() {
    const [isRecording, setIsRecording] = useState(false);
    const {lastMessage, sendMessage} = useWebSocket("ws://localhost:8080", {
        onOpen: () => console.log('opened'),
        shouldReconnect: () => true,
    });

    const [signals, setSignals] = useState<SignalMap>(new Map());
    const bufferedSignals = useRef<SignalMap>(new Map());
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectedHandles, setSelectedHandles] = useState<number[]>([]);
    const [shouldNotMerge, setShouldNotMerge] = useState(false);

    const sendTask = useCallback((taskId: number) => {
        // console.log("Sending task ID:", taskId);
        if (sendMessage) {
            sendMessage(new Uint8Array([taskId]));
        }
    }, [sendMessage]);


// Then update the packet processing logic:
    const activeHandles = useRef(new Map<number, Map<number, number>>());

    useEffect(() => {
        if (!lastMessage || !isRecording) return;

        (lastMessage.data as Blob).arrayBuffer().then(buffer => {
            const packets = processPackets(buffer);
            if (packets.length === 0) return;

            // Process packets in a single batch
            const newSignals = new Map(bufferedSignals.current);
            const handles = activeHandles.current;

            // Pre-allocate maps for frequently accessed ticks
            const tickMaps = new Map<number, Map<number, Map<number, number>>>();

            packets.forEach(packet => {
                const tick = packet.tickCount;
                const handle = packet.handle;

                // Get handle signals map (create if needed)
                let handleSignals = handles.get(handle);
                if (!handleSignals) {
                    handleSignals = new Map();
                    handles.set(handle, handleSignals);
                }

                // Get or create tick map (with caching)
                let tickMap = tickMaps.get(tick);
                if (!tickMap) {
                    tickMap = newSignals.get(tick) || new Map();
                    tickMaps.set(tick, tickMap);
                    newSignals.set(tick, tickMap);
                }

                // Get or create handle map (with caching)
                let handleTickSignals = tickMap.get(handle);
                if (!handleTickSignals) {
                    handleTickSignals = new Map();
                    tickMap.set(handle, handleTickSignals);
                }

                // Process signal state based on packet ID
                if (packet.id === 67) {
                    handleSignals.set(999, 1);
                    handleTickSignals.set(999, 1);
                } else if (packet.id === 68) {
                    handleSignals.delete(999);
                    handleTickSignals.set(999, 0);
                } else if (packet.id >= 86 && packet.id <= 91) {
                    const taskId = Math.floor((packet.id - 86) / 2);
                    const isStart = packet.id % 2 === 0;
                    const baseSignalId = 86 + (taskId * 2);

                    if (isStart) {
                        handleSignals.set(baseSignalId, 1);
                        handleTickSignals.set(baseSignalId, 1);
                    } else {
                        handleSignals.delete(baseSignalId);
                        handleTickSignals.set(baseSignalId, 0);
                    }
                } else if (packet.id >= 97) {
                    const isEnter = packet.id < 300;
                    const baseSignalId = isEnter ? packet.id : packet.id - 203;

                    if (isEnter) {
                        handleSignals.set(baseSignalId, 1);
                        handleTickSignals.set(baseSignalId, 1);
                    } else {
                        handleSignals.delete(baseSignalId);
                        handleTickSignals.set(baseSignalId, 0);
                    }
                }

                // Copy active signals
                handleSignals.forEach((value, signalId) => {
                    if (!handleTickSignals.has(signalId)) {
                        handleTickSignals.set(signalId, value);
                    }
                });
            });

            bufferedSignals.current = newSignals;
        });
    }, [lastMessage, isRecording]);

    // Update signals periodically
    useEffect(() => {
        if (lastMessage === null) return;

        const timeoutId = setTimeout(() => {
            setSignals(new Map(bufferedSignals.current));
        }, 100); // More responsive than 500ms

        return () => clearTimeout(timeoutId);
    }, [lastMessage]);

    // Find all available handles
    const availableHandles = useMemo(() => {
        const handles = new Set<number>();
        for (const tickMap of signals.values()) {
            for (const handle of tickMap.keys()) {
                handles.add(handle);
            }
        }
        return Array.from(handles).sort((a, b) => a - b);
    }, [signals]);

    // Little hack to prevent chart caching
    useEffect(() => {
        setShouldNotMerge(true);
        const timer = setTimeout(() => setShouldNotMerge(false), 100);
        return () => clearTimeout(timer);
    }, [selectedIds, selectedHandles]);

    // Prepare chart configurations
    const chartConfigs = useMemo(() => {
        // Create a map to store configs for each handle
        const handleConfigs = new Map<number, any>();

        // For each selected handle, create a specific chart config
        selectedHandles.forEach(handle => {
            // Filter the signals data for just this handle
            const handleSignals = new Map<number, Map<number, Map<number, number>>>();

            for (const [tick, tickMap] of signals.entries()) {
                const handleTickMap = tickMap.get(handle);
                if (handleTickMap) {
                    const newTickMap = new Map<number, Map<number, number>>();
                    newTickMap.set(handle, handleTickMap);
                    handleSignals.set(tick, newTickMap);
                }
            }

            // Create a config for just this handle's data
            handleConfigs.set(handle, createLineConfig(handleSignals, selectedIds, [handle]));
        });

        return handleConfigs;
    }, [signals, selectedIds, selectedHandles]);

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth={false} disableGutters>
                <Box sx={{p: 2, minHeight: '100vh', bgcolor: 'grey.100'}}>
                    <Grid container spacing={2} sx={{mb: 2}}>
                        <Grid item xs={12}>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <StatFilters
                                    selectedIds={selectedIds}
                                    onChange={setSelectedIds}
                                />
                                <Button
                                    variant="contained"
                                    color={isRecording ? "error" : "primary"}
                                    onClick={() => setIsRecording(!isRecording)}
                                    startIcon={isRecording ? <StopIcon/> : <FiberManualRecordIcon/>}
                                    sx={{ml: 2, height: 40}}
                                >
                                    {isRecording ? "Stop Recording" : "Start Recording"}
                                </Button>

                                {isRecording && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            ml: 2
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                bgcolor: 'error.main',
                                                mr: 1,
                                                animation: 'pulse 1.5s infinite'
                                            }}
                                        />
                                        <Typography variant="body2" color="error">Recording</Typography>
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => sendTask(1)}
                                    startIcon={<PlayArrowIcon/>}
                                >
                                    Task 1
                                </Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => sendTask(2)}
                                    startIcon={<PlayArrowIcon/>}
                                >
                                    Task 2
                                </Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => sendTask(3)}
                                    startIcon={<PlayArrowIcon/>}
                                >
                                    Task 3
                                </Button>
                            </Box>
                            <HandleFilters
                                availableHandles={availableHandles}
                                selectedHandles={selectedHandles}
                                onChange={setSelectedHandles}
                            />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2}>
                        {selectedHandles.map(handle => (
                            <Grid item xs={12} md={12} lg={12} key={handle}>
                                <Paper sx={{height: '300px', p: 2}}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 1
                                    }}>
                                        <Typography variant="h6">{getProcessName(handle)}</Typography>
                                    </Box>
                                    <Box sx={{height: 'calc(100% - 40px)'}}>
                                        <ReactECharts
                                            option={chartConfigs.get(handle)}
                                            notMerge={shouldNotMerge}
                                            lazyUpdate={true}
                                            style={{height: '100%', width: '100%'}}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
            <style jsx global>{`
                @keyframes pulse {
                    0% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                    100% {
                        opacity: 1;
                    }
                }
            `}</style>
        </ThemeProvider>
    );
}
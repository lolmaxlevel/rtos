'use client'
import {ThemeProvider, createTheme} from '@mui/material';
import {Box, Container, Grid, Paper, Typography} from '@mui/material';
import useWebSocket from "react-use-websocket";
import {useEffect, useState, useMemo, useRef} from "react";
import {SignalMap} from "@/app/types/types";
import {processPackets} from "@/app/utils/packet";
import {createLineConfig} from '@/app/configs/eChartsConfigs';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), {ssr: false});
const StatFilters = dynamic(() => import('@/app/components/StatFilters'), {ssr: false});
const HandleFilters = dynamic(() => import('@/app/components/HandleFilters'), {ssr: false});

const UPDATE_INTERVAL = 500;

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
    const {lastMessage} = useWebSocket("ws://localhost:8080", {
        onOpen: () => console.log('opened'),
        shouldReconnect: () => true,
    });

    const [signals, setSignals] = useState<SignalMap>(new Map());
    const bufferedSignals = useRef<SignalMap>(new Map());
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [selectedHandles, setSelectedHandles] = useState<number[]>([]);
    const [shouldNotMerge, setShouldNotMerge] = useState(false);


// Then update the packet processing logic:
    const activeHandles = useRef(new Map<number, Map<number, number>>());

    useEffect(() => {
        if (lastMessage === null) return;

        (lastMessage.data as Blob).arrayBuffer().then(buffer => {
            const packets = processPackets(buffer);
            if (packets.length === 0) return;

            const tickSignals = new Map<number, Map<number, Map<number, number>>>();

            packets.forEach(packet => {
                const tick = packet.tickCount;
                const handle = packet.handle;

                // Initialize maps if needed
                if (!activeHandles.current.has(handle)) {
                    activeHandles.current.set(handle, new Map());
                }
                const handleSignals = activeHandles.current.get(handle)!;

                // Handle task signals (86-91)
                if (packet.id >= 86 && packet.id <= 91) {
                    const taskId = Math.floor((packet.id - 86) / 2);
                    const isStart = packet.id % 2 === 0;
                    const baseSignalId = 86 + (taskId * 2); // Get the START signal ID

                    // Update active signals for tasks
                    if (isStart) {
                        handleSignals.set(baseSignalId, 1);
                    } else {
                        handleSignals.delete(baseSignalId);
                    }
                }
                // Handle regular trace signals
                else if (packet.id >= 97) {
                    const isEnter = packet.id < 300;
                    const baseSignalId = isEnter ? packet.id : packet.id - 203;

                    // Update active signals
                    if (isEnter) {
                        handleSignals.set(baseSignalId, 1);
                    } else {
                        handleSignals.delete(baseSignalId);
                    }
                }

                // Get or create tick map
                let tickMap = tickSignals.get(tick) || new Map();
                tickSignals.set(tick, tickMap);

                // Get or create handle map for this tick
                let handleTickSignals = tickMap.get(handle) || new Map();
                tickMap.set(handle, handleTickSignals);

                // Set all active signals for this handle at this tick
                handleSignals.forEach((value, signalId) => {
                    handleTickSignals.set(signalId, value);
                });
            });

            // Merge new ticks into buffered signals
            tickSignals.forEach((tickMap, tick) => {
                bufferedSignals.current.set(tick, tickMap);
            });
        });
    }, [lastMessage]);

    // Update signals periodically
    useEffect(() => {
        const intervalId = setInterval(() => {
            setSignals(new Map(bufferedSignals.current));
        }, UPDATE_INTERVAL);

        return () => clearInterval(intervalId);
    }, []);

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
    const chartConfigs = useMemo(() => ({
        line: createLineConfig(signals, selectedIds, selectedHandles),
        // bar: createBarConfig(signals, selectedIds, selectedHandles),
        // pie: createPieConfig(signals, selectedIds, selectedHandles)
    }), [signals, selectedIds, selectedHandles]);

    const charts: ChartConfig[] = [
        {
            title: 'Line Chart',
            config: chartConfigs.line
        },
    ];

    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth={false} disableGutters>
                <Box sx={{p: 2, minHeight: '100vh', bgcolor: 'grey.100'}}>
                    <Grid sx={{mb: 2}}>
                        <StatFilters
                            selectedIds={selectedIds}
                            onChange={setSelectedIds}
                        />
                        <HandleFilters
                            availableHandles={availableHandles}
                            selectedHandles={selectedHandles}
                            onChange={setSelectedHandles}
                        />
                    </Grid>
                    <Grid container spacing={2}>
                        {charts.map(({title, config}) => (
                            <Grid item xs={12} md={6} key={title}>
                                <Paper sx={{height: '400px', p: 2}}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 1
                                    }}>
                                        <Typography variant="h6">{title}</Typography>
                                    </Box>
                                    <Box sx={{height: 'calc(100% - 40px)'}}>
                                        <ReactECharts
                                            option={config}
                                            notMerge={shouldNotMerge}
                                            style={{height: '100%', width: '100%'}}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
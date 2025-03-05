'use client'
import {ThemeProvider, createTheme} from '@mui/material';
import {Box, Container, Grid, Paper, Typography} from '@mui/material';
import useWebSocket from "react-use-websocket";
import {useEffect, useState, useMemo, useRef} from "react";
import {SignalMap} from "@/app/types/types";
import {processPackets} from "@/app/utils/packet";
import {createLineConfig} from '@/app/configs/eChartsConfigs';
import StatFilters from '@/app/components/StatFilters';
import HandleFilters from '@/app/components/HandleFilters';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), {ssr: false});

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

    // Process incoming WebSocket data
    const activeHandles = useRef(new Set<number>());

// Then update the packet processing logic:
    useEffect(() => {
        if (lastMessage === null) return;

        (lastMessage.data as Blob).arrayBuffer().then(buffer => {
            const packets = processPackets(buffer);
            if (packets.length === 0) return;

            // Process each packet
            packets.forEach(packet => {
                const tick = packet.tickCount;
                const handle = packet.handle;

                // Get or create tick map
                let tickMap = bufferedSignals.current.get(tick) || new Map();
                bufferedSignals.current.set(tick, tickMap);

                // Get or create handle map for this tick
                let handleSignals = tickMap.get(handle) || new Map();
                tickMap.set(handle, handleSignals);

                // Handle special case for start/end signals
                if (packet.id === 94 || packet.id === 95) {
                    if (packet.id === 94) {
                        // Start signal
                        handleSignals.set(121, 1);
                        activeHandles.current.add(handle);
                    } else if (packet.id === 95) {
                        // End signal
                        handleSignals.set(121, 0);
                        activeHandles.current.delete(handle);
                    }
                    // console.log(packet.id, packet.tickCount, packet.handle);
                }
                console.log(packet.id, packet.tickCount, packet.handle);
                for (const activeHandle of activeHandles.current) {
                    // Get or create handle map for this tick if it doesn't exist yet
                    let activeHandleSignals = tickMap.get(activeHandle) || new Map();
                    tickMap.set(activeHandle, activeHandleSignals);

                    // Set signal 121 to 1 for this active handle
                    activeHandleSignals.set(121, 1);
                }
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

    // Initialize selected handles with all available handles
    useEffect(() => {
        if (availableHandles.length > 0 && selectedHandles.length === 0) {
            setSelectedHandles(availableHandles);
        }
    }, [availableHandles, selectedHandles]);

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
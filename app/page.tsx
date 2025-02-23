'use client'
import {ThemeProvider, createTheme, Switch} from '@mui/material';
import {Box, Container, Grid, Paper, Typography} from '@mui/material';
import useWebSocket from "react-use-websocket";
import {useEffect, useState, useMemo, useRef} from "react";
import {SignalMap} from "@/app/types/types";
import {processPackets} from "@/app/utils/packet";
import {createLineConfig, createBarConfig, createPieConfig} from '@/app/configs/eChartsConfigs';
import StatFilters from '@/app/components/StatFilters';
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
    cumulative: boolean;
    setCumulative: (value: boolean) => void;
};

export default function Home() {
    const {lastMessage} = useWebSocket("ws://localhost:8080", {
        onOpen: () => console.log('opened'),
        shouldReconnect: () => true,
    });

    const [signals, setSignals] = useState<SignalMap>(new Map());
    const bufferedSignals = useRef<SignalMap>(new Map());
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [shouldNotMerge, setShouldNotMerge] = useState(false);

    const [chartStates, setChartStates] = useState({
        line: true,
        bar: false,
        pie: false
    });

    // Process incoming WebSocket data
    useEffect(() => {
        if (lastMessage === null) return;

        (lastMessage.data as Blob).arrayBuffer().then(buffer => {
            const packets = processPackets(buffer);
            if (packets.length === 0) return;

            const currentTick = packets[0].tick;
            const tickSignals = bufferedSignals.current.get(currentTick) || new Map();

            packets.forEach(packet => {
                const currentCount = tickSignals.get(packet.id) || 0;
                tickSignals.set(packet.id, currentCount + 1);
            });

            bufferedSignals.current.set(currentTick, tickSignals);
        });
    }, [lastMessage]);

    // Update signals periodically
    useEffect(() => {
        const intervalId = setInterval(() => {
            setSignals(new Map(bufferedSignals.current));
        }, UPDATE_INTERVAL);

        return () => clearInterval(intervalId);
    }, []);

    // Little hack to prevent chart caching
    useEffect(() => {
        setShouldNotMerge(true);
        const timer = setTimeout(() => setShouldNotMerge(false), 100);
        return () => clearTimeout(timer);
    }, [selectedIds]);

    // Prepare chart configurations
    const chartConfigs = useMemo(() => ({
        line: createLineConfig(signals, selectedIds, chartStates.line),
        bar: createBarConfig(signals, selectedIds, chartStates.bar),
        pie: createPieConfig(signals, selectedIds, chartStates.pie)
    }), [signals, selectedIds, chartStates.line, chartStates.bar, chartStates.pie]);

    const charts: ChartConfig[] = [
        {
            title: 'Line Chart',
            config: chartConfigs.line,
            cumulative: chartStates.line,
            setCumulative: (value) => setChartStates(prev => ({...prev, line: value}))
        },
        {
            title: 'Bar Chart',
            config: chartConfigs.bar,
            cumulative: chartStates.bar,
            setCumulative: (value) => setChartStates(prev => ({...prev, bar: value}))
        },
        {
            title: 'Pie Chart',
            config: chartConfigs.pie,
            cumulative: chartStates.pie,
            setCumulative: (value) => setChartStates(prev => ({...prev, pie: value}))
        }
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
                    </Grid>
                    <Grid container spacing={2}>
                        {charts.map(({title, config, cumulative, setCumulative}) => (
                            <Grid item xs={12} md={6} key={title}>
                                <Paper sx={{height: '400px', p: 2}}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 1
                                    }}>
                                        <Typography variant="h6">{title}</Typography>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <Typography>Per Tick</Typography>
                                            <Switch
                                                checked={cumulative}
                                                onChange={(e) => setCumulative(e.target.checked)}
                                            />
                                            <Typography>Cumulative</Typography>
                                        </Box>
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
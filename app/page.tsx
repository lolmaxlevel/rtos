'use client'
import {ThemeProvider, createTheme} from '@mui/material';
import {Box, Container, Grid, Paper, Typography} from '@mui/material';
import useWebSocket from "react-use-websocket";
import {useEffect, useState, useMemo, useRef} from "react";
import {CumulativeSignals} from "@/app/types/types";
import {processPackets} from "@/app/utils/packet";
import {
    createLineConfig,
    createBarConfig,
    createPieConfig
} from '@/app/configs/eChartsConfigs';
import StatFilters from '@/app/components/StatFilters';
import {traceLabels} from '@/app/dict';
import dynamic from 'next/dynamic';
// import {EChart, useECharts} from '@kbox-labs/react-echarts'


const theme = createTheme({
    components: {
        MuiPaper: {
            defaultProps: {
                elevation: 2
            }
        }
    }
});

const ReactECharts = dynamic(() => import('echarts-for-react'), {ssr: false});
const UPDATE_INTERVAL = 500; // 0.5 second

const getLastFromMap = (map: CumulativeSignals) => {
    return Array.from(map.values()).pop() ?? new Map();
}

export default function Home() {
    const {lastMessage} = useWebSocket("ws://localhost:8080", {
        onOpen: () => console.log('opened'),
        shouldReconnect: (closeEvent) => true,
    });

    const [cumulativeSignals, setCumulativeSignals] = useState<CumulativeSignals>(new Map());
    const bufferedSignals = useRef<CumulativeSignals>(new Map());

    const [selectedIds, setSelectedIds] = useState<number[]>(
        Object.keys(traceLabels).map(Number)
    );

    // Process incoming data without updating state
    useEffect(() => {
        if (lastMessage !== null) {
            (lastMessage.data as Blob).arrayBuffer().then(buffer => {
                const packets = processPackets(buffer);

                packets.forEach(({tick, id}) => {
                    if (!bufferedSignals.current.has(tick)) {
                        const prevTick = tick - 1;
                        const prevSignals = prevTick >= 0
                            ? bufferedSignals.current.get(prevTick)
                            : new Map();
                        bufferedSignals.current.set(tick, new Map(prevSignals));
                    }
                    const tickSignals = bufferedSignals.current.get(tick)!;
                    tickSignals.set(id, (tickSignals.get(id) || 0) + 1);
                });
            });
        }
    }, [lastMessage]);
    // Update state once per second
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCumulativeSignals(new Map(bufferedSignals.current));
        }, UPDATE_INTERVAL);

        return () => clearInterval(intervalId);
    }, []);

    // Memoize chart configs
    const chartConfigs = useMemo(() => {
        const lastSignals = getLastFromMap(cumulativeSignals);
        return {
            line: createLineConfig(cumulativeSignals, selectedIds),
            bar: createBarConfig(lastSignals, selectedIds),
            pie: createPieConfig(lastSignals, selectedIds)
        };
    }, [cumulativeSignals, selectedIds]);


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
                        {[
                            {title: 'Line Chart', config: chartConfigs.line},
                            {title: 'Bar Chart', config: chartConfigs.bar},
                            {title: 'Pie Chart', config: chartConfigs.pie}
                        ].map(({title, config}) => (
                            <Grid item xs={12} md={6} key={title}>
                                <Paper sx={{height: '400px', p: 2}}>
                                    <Typography variant="h6" gutterBottom>
                                        {title}
                                    </Typography>
                                    <Box sx={{height: 'calc(100% - 40px)'}}>
                                        {/*Should be fixed\rewritten for better performance*/}
                                        <ReactECharts
                                            option={config}
                                            notMerge={selectedIds.length === 0}
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
'use client'
import styles from "./page.module.css";
import useWebSocket from "react-use-websocket";
import {useEffect, useState, useMemo} from "react";
import {processPackets} from "@/app/utils/packet";
import {
    createLineConfig,
    // createBarConfig,
    // createHeatmapConfig,
    // createPieConfig
} from '@/app/configs/eChartsConfigs';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), {ssr: false});

interface TickSignals {
    [tick: number]: {
        [id: number]: number;
    };
}

interface TotalSignalCounts {
    [id: number]: number;
}

interface CumulativeSignals {
    [tick: number]: {
        [id: number]: number;
    };
}

export default function Home() {
    const {lastMessage} = useWebSocket("ws://localhost:8080", {
        onOpen: () => console.log('opened'),
        shouldReconnect: (closeEvent) => true,
    });
    const [tickSignals, setTickSignals] = useState<TickSignals>({});
    const [cumulativeSignals, setCumulativeSignals] = useState<CumulativeSignals>({});

    const chartData = useMemo(() =>
            Object.keys(cumulativeSignals).map(tick => ({
                tick: Number(tick),
                ...cumulativeSignals[Number(tick)]
            }))
        , [cumulativeSignals]);

    useEffect(() => {
        if (lastMessage !== null) {
            (lastMessage.data as Blob).arrayBuffer().then(buffer => {
                const packets = processPackets(buffer);
                const newTickSignals = {...tickSignals};
                const newCumulativeSignals = {...cumulativeSignals};

                packets.forEach(({tick, id}) => {
                    // Update current tick signals
                    if (!newTickSignals[tick]) {
                        newTickSignals[tick] = {};
                    }
                    newTickSignals[tick][id] = (newTickSignals[tick][id] || 0) + 1;

                    // Update cumulative signals
                    if (!newCumulativeSignals[tick]) {
                        const prevTick = tick - 1;
                        newCumulativeSignals[tick] = prevTick >= 0
                            ? {...newCumulativeSignals[prevTick]}
                            : {};
                    }
                    newCumulativeSignals[tick][id] = (newCumulativeSignals[tick][id] || 0) + 1;
                });

                setTickSignals(newTickSignals);
                setCumulativeSignals(newCumulativeSignals);
            });
        }
    }, [lastMessage]);

    return (
        <div className={styles.page}>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', height: '100%', width: '100%'}}>
                <div style={{height: '300px'}}>
                    <h3>Line Chart</h3>
                    <ReactECharts
                        option={createLineConfig(chartData)}
                        style={{height: '100%'}}
                    />
                </div>
                {/*<div style={{height: '300px'}}>*/}
                {/*    <h3>Bar Chart</h3>*/}
                {/*    <ReactECharts*/}
                {/*        option={createBarConfig(chartData)}*/}
                {/*        style={{height: '100%'}}*/}
                {/*    />*/}
                {/*</div>*/}
                {/*<div style={{height: '300px'}}>*/}
                {/*    <h3>Heatmap</h3>*/}
                {/*    <ReactECharts*/}
                {/*        option={createHeatmapConfig(chartData)}*/}
                {/*        style={{height: '100%'}}*/}
                {/*    />*/}
                {/*</div>*/}
                {/*<div style={{height: '300px'}}>*/}
                {/*    <h3>Pie Chart</h3>*/}
                {/*    <ReactECharts*/}
                {/*        option={createPieConfig(chartData)}*/}
                {/*        style={{height: '100%'}}*/}
                {/*    />*/}
                {/*</div>*/}
            </div>
        </div>
    );
}
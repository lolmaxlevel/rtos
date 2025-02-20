'use client'
import styles from "./page.module.css";
import {CumulativeSignals} from "@/app/types/types";
import useWebSocket from "react-use-websocket";
import {useEffect, useState, useMemo, useRef} from "react";
import {processPackets} from "@/app/utils/packet";
import {
    createLineConfig,
    createBarConfig,
    createHeatmapConfig,
    createPieConfig
} from '@/app/configs/eChartsConfigs';
import dynamic from 'next/dynamic';

const ReactECharts = dynamic(() => import('echarts-for-react'), {ssr: false});
const UPDATE_INTERVAL = 500; // 1 second

export default function Home() {
    const {lastMessage} = useWebSocket("ws://localhost:8080", {
        onOpen: () => console.log('opened'),
        shouldReconnect: (closeEvent) => true,
    });

    const [cumulativeSignals, setCumulativeSignals] = useState<CumulativeSignals>({});
    const bufferedSignals = useRef<CumulativeSignals>({});

    // Process incoming data without updating state
    useEffect(() => {
        if (lastMessage !== null) {
            (lastMessage.data as Blob).arrayBuffer().then(buffer => {
                const packets = processPackets(buffer);

                packets.forEach(({tick, id}) => {
                    if (!bufferedSignals.current[tick]) {
                        const prevTick = tick - 1;
                        bufferedSignals.current[tick] = prevTick >= 0
                            ? {...bufferedSignals.current[prevTick]}
                            : {};
                    }
                    bufferedSignals.current[tick][id] = (bufferedSignals.current[tick][id] || 0) + 1;
                });
            });
        }
    }, [lastMessage]);

    // Update state once per second
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCumulativeSignals({...bufferedSignals.current});
        }, UPDATE_INTERVAL);

        return () => clearInterval(intervalId);
    }, []);

    // Memoize chart configs
    const chartConfigs = useMemo(() => ({
        line: createLineConfig(cumulativeSignals),
        bar: createBarConfig(cumulativeSignals),
        heatmap: createHeatmapConfig(cumulativeSignals),
        pie: createPieConfig(cumulativeSignals)
    }), [cumulativeSignals]);

    return (
        <div className={styles.page}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                padding: '20px',
                height: '100%',
                width: '100%'
            }}>
                {[
                    { title: 'Line Chart', config: chartConfigs.line },
                    { title: 'Bar Chart', config: chartConfigs.bar },
                    { title: 'Heatmap', config: chartConfigs.heatmap },
                    { title: 'Pie Chart', config: chartConfigs.pie }
                ].map(({ title, config }) => (
                    <div key={title} style={{height: '300px'}}>
                        <h3>{title}</h3>
                        <ReactECharts option={config} style={{height: '100%'}} />
                    </div>
                ))}
            </div>
        </div>
    );
}
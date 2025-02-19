'use client'
import styles from "./page.module.css";
import useWebSocket from "react-use-websocket";
import {useEffect, useMemo, useState} from "react";
import {processPackets} from "@/app/utils/packet";
import { createApexLineConfig } from '@/app/configs/apexChartConfigs';
import { createEChartsConfig } from '@/app/configs/eChartsConfigs';
import { createHighchartsConfig } from '@/app/configs/highchartsConfig';
import { CumulativeData } from '@/app/types/types';
import '@/app/configs/chartSetup';
import { Line } from 'react-chartjs-2';
import { createLineChartConfig } from '@/app/configs/chartConfigs';
import ReactApexChart from 'react-apexcharts';
import ReactECharts from 'echarts-for-react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';

export default function Home() {
    const {lastMessage} = useWebSocket("ws://localhost:8080", {
        onOpen: () => console.log('opened'),
        shouldReconnect: (closeEvent) => true,
    });
    const [cumulativeCounts, setCumulativeCounts] = useState<{ [id: number]: number }>({});
    const [chartData, setChartData] = useState<CumulativeData[]>([]);

    const apexConfig = createApexLineConfig(chartData);
    const echartsConfig = createEChartsConfig(chartData);
    const chartjsConfig = createLineChartConfig(chartData);

    useEffect(() => {
        if (lastMessage !== null) {
            (lastMessage.data as Blob).arrayBuffer()
                .then(buffer => {
                    const packets = processPackets(buffer);
                    const newCounts = {...cumulativeCounts};
                    const newPoints: CumulativeData[] = [];

                    packets.forEach(({tick, id}) => {
                        newCounts[id] = (newCounts[id] || 0) + 1;
                        newPoints.push({
                            tick,
                            ...newCounts
                        });
                    });

                    setCumulativeCounts(newCounts);
                    setChartData([...chartData, ...newPoints]);
                });
        }
    }, [lastMessage]);


    const highchartsConfig = useMemo(() =>
            createHighchartsConfig(chartData),
        [chartData]
    );

    return (
        <div className={styles.page}>
            <div style={{ height: '300px', marginBottom: '20px', width: '500px' }}>
                <Line data={chartjsConfig.data} options={chartjsConfig.options} />
            </div>
            {/*<div style={{ width: '100%', height: '300px', marginBottom: '20px' }}>*/}
            {/*    <ReactApexChart*/}
            {/*        options={apexConfig}*/}
            {/*        series={apexConfig.series}*/}
            {/*        height={300}*/}
            {/*        type="line"*/}
            {/*    />*/}
            {/*</div>*/}
            {/*<div style={{ width: '100%', height: '300px', marginBottom: '20px' }}>*/}
            {/*    <ReactECharts*/}
            {/*        option={echartsConfig}*/}
            {/*        style={{ height: '300px' }}*/}
            {/*    />*/}
            {/*</div>*/}
            {/*<div style={{ width: '100%', height: '300px' }}>*/}
            {/*    <HighchartsReact*/}
            {/*        highcharts={Highcharts}*/}
            {/*        options={highchartsConfig}*/}
            {/*        updateArgs={[true, true, true]}*/}
            {/*    />*/}
            {/*</div>*/}
        </div>
    );
}
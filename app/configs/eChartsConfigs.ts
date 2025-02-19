import type { EChartsOption } from 'echarts';
import { CumulativeData } from '@/app/types/types';
import { traceLabels } from '@/app/dict';

export const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#e8c3b9",
    "#1f77b4", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"
];

export const createEChartsConfig = (chartData: CumulativeData[]): EChartsOption => ({
    color: COLORS,
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        }
    },
    legend: {
        top: 0,
        data: Object.values(traceLabels).slice(0, 10)
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '40px',
        containLabel: true
    },
    toolbox: {
        feature: {
            dataZoom: {
                yAxisIndex: 'none'
            },
            restore: {},
            saveAsImage: {}
        }
    },
    xAxis: {
        type: 'value',
        min: 0,
        name: 'Tick'
    },
    yAxis: {
        type: 'value',
        min: 0
    },
    series: Object.keys(traceLabels)
        .slice(0, 10)
        .map((key, index) => ({
            name: traceLabels[+key],
            type: 'line',
            smooth: true,
            symbol: 'none',
            data: chartData.map(point => [point.tick, point[+key] || 0])
        }))
});
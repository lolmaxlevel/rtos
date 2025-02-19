import type { EChartsOption } from 'echarts';
import { CumulativeData } from '@/app/types/types';
import { traceLabels } from '@/app/dict';

export const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#e8c3b9",
    "#1f77b4", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"
];

export const createLineConfig = (tickSignals: Record<number, Record<number, number>>): EChartsOption => ({
    color: COLORS,
    legend: {
        bottom: 0,
        data: Object.values(traceLabels).slice(0, 10)
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            animation: false
        }
    },
    toolbox: {
        feature: {
            dataZoom: {
                yAxisIndex: 'none'
            },
            restore: {},
        }
    },
    xAxis: {
        type: 'value',
        min: 0,
        name: 'Tick',
    },
    yAxis: {
        type: 'value',
        min: 0,
    },
    series: Object.keys(traceLabels)
        .slice(0, 10)
        .map((id) => {
            let accumulator = 0;
            return {
                name: traceLabels[+id],
                type: 'line',
                smooth: false,
                symbol: 'none',
                data: Object.entries(tickSignals)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([tick, signals]) => {
                        accumulator += (signals[+id] || 0);
                        return [Number(tick), accumulator];
                    })
            };
        })
});
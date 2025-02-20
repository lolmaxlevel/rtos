import type {EChartsOption} from 'echarts';
import {traceLabels} from '@/app/dict';
import type {CumulativeSignals} from '@/app/types/types';

export const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#e8c3b9",
    "#1f77b4", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"
];

export const createLineConfig = (chartData: CumulativeSignals): EChartsOption => ({
    color: COLORS,
    legend: {
        bottom: 0,
        data: Object.keys(traceLabels).map(k => traceLabels[+k])
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
        .map(key => ({
            name: traceLabels[+key],
            type: 'line',
            smooth: false,
            symbol: 'none',
            data: Object.entries(chartData)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([tick, signals]) => [Number(tick), signals[+key] || 0])
        }))
});

export const createBarConfig = (chartData: CumulativeSignals): EChartsOption => {
    const lastTick = Math.max(...Object.keys(chartData).map(Number));
    return {
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            data: Object.keys(traceLabels).map(k => traceLabels[+k])
        },
        yAxis: {
            type: 'value'
        },
        series: [{
            type: 'bar',
            data: Object.keys(traceLabels)
                .map(key => chartData[lastTick]?.[+key] || 0)
        }]
    };
};

export const createHeatmapConfig = (chartData: CumulativeSignals): EChartsOption => ({
    tooltip: {
        position: 'top'
    },
    grid: {
        height: '50%',
        top: '10%'
    },
    xAxis: {
        type: 'category',
        data: Object.keys(chartData).map(tick => Number(tick)).sort((a, b) => a - b)
    },
    yAxis: {
        type: 'category',
        data: Object.keys(traceLabels).map(k => traceLabels[+k])
    },
    visualMap: {
        min: 0,
        max: 10,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%'
    },
    series: [{
        type: 'heatmap',
        data: Object.entries(chartData)
            .sort(([a], [b]) => Number(a) - Number(b))
            .flatMap(([tick, signals]) =>
                Object.keys(traceLabels)
                    .map((key, j) => [Number(tick), j, signals[+key] || 0])
            )
    }]
});

export const createPieConfig = (chartData: CumulativeSignals): EChartsOption => ({
    tooltip: {
        trigger: 'item'
    },
    legend: {
        orient: 'horizontal',
        bottom: 0
    },
    series: [{
        type: 'pie',
        radius: '50%',
        data: Object.keys(traceLabels)
            .map(key => {
                const lastTick = Math.max(...Object.keys(chartData).map(Number));
                return {
                    name: traceLabels[+key],
                    value: chartData[lastTick]?.[+key] || 0
                };
            })
    }]
});
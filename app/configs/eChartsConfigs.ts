import type {EChartsOption} from 'echarts';
import {traceLabels} from '@/app/dict';
import type {CumulativeSignals} from '@/app/types/types';

export const createLineConfig = (chartData: CumulativeSignals, selectedIds: number[]): EChartsOption => {
    // If no data or no selected filters, return empty config
    if (Object.keys(chartData).length === 0) {
        return {
            xAxis: { type: 'value', min: 0, name: 'Tick' },
            yAxis: { type: 'value', min: 0 },
            series: [{
                type: 'line',
                smooth: false,
                symbol: 'none',
                data: []
            }]
        };
    }

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: { animation: false }
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            show: true
        },
        toolbox: {
            feature: {
                dataZoom: { yAxisIndex: 'none' },
                restore: {}
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
        series: selectedIds.map(id => ({
            name: traceLabels[id],
            type: 'line',
            smooth: false,
            symbol: 'none',
            data: Object.entries(chartData)
                .map(([tick, signals]) => [Number(tick), signals[id] || 0])
        }))
    };
};

export const createBarConfig = (chartData: CumulativeSignals): EChartsOption => {
    const lastTick = Math.max(...Object.keys(chartData).map(Number));
    const activeSignals = chartData[lastTick] || {};
    const activeIds = Object.keys(activeSignals);

    // Return empty config if no data
    if (activeIds.length === 0) {
        return {
            xAxis: { type: 'category', data: [] },
            yAxis: { type: 'value' },
            series: [{ type: 'bar', data: [] }]
        };
    }

    const data = activeIds.map(key => ({
        name: traceLabels[Number(key)],
        value: activeSignals[Number(key)] || 0
    }));

    return {
        tooltip: { trigger: 'axis' },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            show: true
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.name)
        },
        yAxis: { type: 'value' },
        series: [{
            type: 'bar',
            name: 'Value',
            data: data.map(item => item.value)
        }]
    };
};

export const createPieConfig = (chartData: CumulativeSignals): EChartsOption => {
    const lastTick = Math.max(...Object.keys(chartData).map(Number));
    const activeSignals = chartData[lastTick] || {};

    // Return empty config if no data
    if (Object.keys(activeSignals).length === 0) {
        return {
            series: [{
                type: 'pie',
                radius: '50%',
                data: []
            }]
        };
    }

    const data = Object.keys(activeSignals).map(key => ({
        name: traceLabels[Number(key)],
        value: activeSignals[Number(key)] || 0
    }));

    return {
        tooltip: { trigger: 'item' },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            show: true
        },
        series: [{
            name: 'Statistics',
            type: 'pie',
            radius: '50%',
            data: data
        }]
    };
};
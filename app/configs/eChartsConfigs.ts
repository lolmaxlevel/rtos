import type {EChartsOption} from 'echarts';
import {CumulativeData} from '@/app/types/types';
import {traceLabels} from '@/app/dict';

export const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#e8c3b9",
    "#1f77b4", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"
];

export const createLineConfig = (chartData: CumulativeData[]): EChartsOption => ({
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
        .map((key, index) => ({
            name: traceLabels[+key],
            type: 'line',
            smooth: false,
            symbol: 'none',
            data: chartData.map(point => [point.tick, point[+key] || 0])
        }))
});
//
// export const createBarConfig = (chartData: CumulativeData[]): EChartsOption => ({
//     tooltip: {
//         trigger: 'axis'
//     },
//     xAxis: {
//         type: 'category',
//         data: Object.keys(traceLabels).slice(0, 10).map(k => traceLabels[+k])
//     },
//     yAxis: {
//         type: 'value'
//     },
//     series: [{
//         type: 'bar',
//         data: Object.keys(traceLabels).slice(0, 10)
//             .map(key => chartData.reduce((sum, point) => sum + (point[+key] || 0), 0))
//     }]
// });
//
// export const createHeatmapConfig = (chartData: CumulativeData[]): EChartsOption => ({
//     tooltip: {
//         position: 'top'
//     },
//     grid: {
//         height: '50%',
//         top: '10%'
//     },
//     xAxis: {
//         type: 'category',
//         data: chartData.map(d => d.tick)
//     },
//     yAxis: {
//         type: 'category',
//         data: Object.keys(traceLabels).slice(0, 10).map(k => traceLabels[+k])
//     },
//     visualMap: {
//         min: 0,
//         max: 10,
//         calculable: true,
//         orient: 'horizontal',
//         left: 'center',
//         bottom: '15%'
//     },
//     series: [{
//         type: 'heatmap',
//         data: chartData.flatMap((point, i) =>
//             Object.keys(traceLabels).slice(0, 10)
//                 .map((key, j) => [i, j, point[+key] || 0])
//         )
//     }]
// });
//
// export const createPieConfig = (chartData: CumulativeData[]): EChartsOption => ({
//     tooltip: {
//         trigger: 'item'
//     },
//     legend: {
//         orient: 'horizontal',
//         bottom: 0
//     },
//     series: [{
//         type: 'pie',
//         radius: '50%',
//         data: Object.keys(traceLabels).slice(0, 10).map(key => ({
//             name: traceLabels[+key],
//             value: chartData.reduce((sum, point) => sum + (point[+key] || 0), 0)
//         }))
//     }]
// });
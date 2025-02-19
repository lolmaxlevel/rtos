import { Options } from 'highcharts';
import { CumulativeData } from '@/app/types/types';
import { traceLabels } from '@/app/dict';

export const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#e8c3b9",
    "#1f77b4", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"
];

export const createHighchartsConfig = (chartData: CumulativeData[]): Options => ({
    chart: {
        type: 'line',
        zoomType: 'xy',
        height: 300,
        panning: true,
        panKey: 'shift',
        resetZoomButton: {
            position: {
                align: 'right',
                verticalAlign: 'top',
                x: -10,
                y: 10
            }
        }
    },
    mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: true
    },
    title: {
        text: undefined
    },
    xAxis: {
        title: {
            text: 'Tick'
        },
        min: 0
    },
    yAxis: {
        title: {
            text: 'Count'
        },
        min: 0
    },
    colors: COLORS,
    plotOptions: {
        line: {
            marker: {
                enabled: false
            }
        }
    },
    legend: {
        align: 'center',
        verticalAlign: 'top',
        layout: 'horizontal'
    },
    series: Object.keys(traceLabels)
        .slice(0, 10)
        .map((key, index) => ({
            type: 'line',
            name: traceLabels[+key],
            data: chartData.map(point => [point.tick, point[+key] || 0])
        }))
});
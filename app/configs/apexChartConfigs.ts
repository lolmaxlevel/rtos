import { ApexOptions } from "apexcharts";
import { CumulativeData } from '@/app/types/types';
import { traceLabels } from '@/app/dict';

export const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#e8c3b9",
    "#1f77b4", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"
];

export const createApexLineConfig = (chartData: CumulativeData[]): ApexOptions => ({
    chart: {
        type: 'line',
        zoom: {
            enabled: true,
            type: 'xy'
        },
        toolbar: {
            show: true
        }
    },
    stroke: {
        curve: 'smooth',
        width: 2
    },
    markers: {
        size: 0
    },
    xaxis: {
        type: 'numeric',
        min: 0,
        title: {
            text: 'Tick'
        }
    },
    yaxis: {
        min: 0
    },
    colors: COLORS,
    series: Object.keys(traceLabels)
        .slice(0, 10)
        .map((key, index) => ({
            name: traceLabels[+key],
            data: chartData.map(point => ({
                x: point.tick,
                y: point[+key] || 0
            }))
        }))
});
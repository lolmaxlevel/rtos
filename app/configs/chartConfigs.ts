import { ChartConfiguration, ChartData, ScaleOptionsByType } from 'chart.js';
import { CumulativeData } from '@/app/types/types';
import { traceLabels } from '@/app/dict';

export const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#e8c3b9",
    "#1f77b4", "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"
];

export const createLineChartConfig = (chartData: CumulativeData[]): ChartConfiguration<'line'> => ({
    type: 'line',
    data: {
        labels: chartData.map(point => point.tick),
        datasets: Object.keys(traceLabels)
            .slice(0, 10)
            .map((key, index) => ({
                label: traceLabels[+key],
                data: chartData.map(point => point[+key] || 0),
                borderColor: COLORS[index % COLORS.length],
                backgroundColor: COLORS[index % COLORS.length],
                tension: 0.1,
                pointRadius: 0,
                fill: false
            }))
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    mode: 'xy',
                },
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
            }
        },
        scales: {
            x: {
                type: 'linear' as const,
                display: true,
                min: 0,
            },
            y: {
                type: 'linear' as const,
                display: true,
                beginAtZero: true
            }
        }
    }
});
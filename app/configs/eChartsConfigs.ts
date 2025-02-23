import type {EChartsOption} from 'echarts';
import {traceLabels} from '@/app/dict';
import {CumulativeSignals} from "@/app/types/types";

export const createLineConfig = (chartData: CumulativeSignals, selectedIds: number[]): EChartsOption => {

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {animation: false},
            enterable: true,
            className: 'tooltip'
        },
        grid: {
            left: '0%',
            right: '22%',
            top: '5%',
            bottom: '15%',
            containLabel: true
        },
        legend: {
            animation: false,
            type: 'scroll',
            orient: 'vertical',
            right: 0,
            top: 20,
            show: true,
            data: selectedIds.map(id => traceLabels[id]), // Explicitly define legend data
            pageButtonPosition: 'end',
            selector: false
        },
        toolbox: {
            feature: {
                restore: {},
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

        dataZoom: [
            {
                type: 'slider',
                xAxisIndex: 0,
                filterMode: 'none'
            },
            {
                type: 'inside',
                xAxisIndex: 0,
                filterMode: 'none'
            },
            {
                type: 'inside',
                yAxisIndex: 0,
                filterMode: 'none'
            }
        ],

        dataset: [{
            id: 'dataset',
            source: selectedIds.length == 0 ? [] : Array.from(chartData.entries()).map(([tick, signals]) => {
                const data: Record<string, number> = {tick};
                // Создаем Map для быстрого доступа к меткам
                const selectedLabels = new Map(
                    selectedIds.map(id => [id, traceLabels[id]])
                );
                // Используем for...of вместо forEach
                for (const [id, label] of selectedLabels) {
                    data[label] = signals.get(id) ?? 0;
                }
                return data;
            })
        }],

        series: selectedIds.length ? selectedIds.map(id => ({
            sampling: 'average',
            name: traceLabels[id],
            type: 'line',
            smooth: false,
            symbol: 'none',
            datasetId: 'dataset',
            encode: { x: 'tick', y: traceLabels[id] },
        })) : []
    };
};

export const createBarConfig = (signals: Map<number, number>, selectedIds: number[]): EChartsOption => {
    if (signals.size === 0) {
        return {
            xAxis: {type: 'category', data: []},
            yAxis: {type: 'value'},
            series: [{type: 'bar', data: []}]
        };
    }

    const data = selectedIds.map(id => ({
        name: traceLabels[id],
        value: signals.get(id) || 0
    }));

    return {
        tooltip: {trigger: 'axis'},
        legend: {
            orient: 'horizontal',
            bottom: 0,
            show: true
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.name),
        },
        yAxis: {type: 'value'},
        series: [
            {
                data: data.map(item => ({
                    name: item.name,
                    value: item.value
                })),
                type: 'bar'
            }
        ]
    };
};

export const createPieConfig = (signals: Map<number, number>, selectedIds: number[]): EChartsOption => {

    if (signals.size === 0) {
        return {
            series: [{
                type: 'pie',
                radius: '50%',
                data: []
            }]
        };
    }

    const data = selectedIds
        .filter(id => signals.has(id))
        .map(id => ({
            name: traceLabels[id],
            value: signals.get(id)
        }));

    return {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
        },

        legend: {
            type: "scroll",
            orient: 'vertical',
            right: 10,
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

import type {EChartsOption} from 'echarts';
import {traceLabels} from '@/app/dict';
import {SignalMap} from "@/app/types/types";

const createEmptyConfig = (type: 'bar' | 'pie'): EChartsOption => {
    if (type === 'bar') {
        return {
            xAxis: {type: 'category', data: []},
            yAxis: {type: 'value'},
            series: [{type: 'bar', data: []}]
        };
    }
    return {
        series: [{
            type: 'pie',
            radius: '50%',
            data: []
        }]
    };
};

const prepareChartData = (signals: SignalMap, selectedIds: number[], lastTick: number) => {
    return selectedIds.map(id => ({
        name: traceLabels[id],
        value: signals.get(lastTick)?.get(id) || 0
    }));
};

export const createLineConfig = (signals: SignalMap, selectedIds: number[], isCumulative: boolean): EChartsOption => {
    const ticks = Array.from(signals.keys());
    if (ticks.length === 0) return createEmptyConfig('bar');

    const minTick = Math.min(...ticks);

    return {
        tooltip: {
            confine: true,
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
            type: 'scroll',
            orient: 'vertical',
            right: 0,
            top: 20,
            show: true,
            pageButtonPosition: 'end',
            selector: false
        },
        toolbox: {
            feature: {
                restore: {}
            }
        },
        xAxis: {
            type: 'value',
            name: 'Tick',
            min: minTick
        },
        yAxis: {
            type: 'value'
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
            source: selectedIds.length === 0 ? [] : Array.from(signals.entries()).map(([tick, tickSignals]) => {
                const data: Record<string, number> = {tick};
                const selectedLabels = new Map(selectedIds.map(id => [id, traceLabels[id]]));

                for (const [id, label] of selectedLabels) {
                    if (isCumulative) {
                        let sum = 0;
                        for (const [t, s] of signals) {
                            if (t <= tick) {
                                sum += s.get(id) ?? 0;
                            }
                        }
                        data[label] = sum;
                    } else {
                        data[label] = tickSignals.get(id) ?? 0;
                    }
                }
                return data;
            })
        }],
        series: selectedIds.map(id => ({
            step: 'start',
            sampling: 'average',
            name: traceLabels[id],
            type: 'line',
            smooth: false,
            symbol: 'none',
            datasetId: 'dataset',
            encode: {x: 'tick', y: traceLabels[id]}
        }))
    };
};

export const createBarConfig = (signals: SignalMap, selectedIds: number[], isCumulative: boolean): EChartsOption => {
    if (signals.size === 0) return createEmptyConfig('bar');

    const lastTick = Math.max(...Array.from(signals.keys()));
    const data = selectedIds.map(id => {
        let value = 0;
        if (isCumulative) {
            for (const [_, tickSignals] of signals) {
                value += tickSignals.get(id) || 0;
            }
        } else {
            value = signals.get(lastTick)?.get(id) || 0;
        }
        return {
            name: traceLabels[id],
            value: value
        };
    });

    return {
        tooltip: {trigger: 'axis'},
        legend: {
            orient: 'horizontal',
            bottom: 0,
            show: true
        },
        xAxis: {
            type: 'category',
            data: data.map(item => item.name)
        },
        yAxis: {type: 'value'},
        series: [{
            data,
            type: 'bar',
            realtimeSort: true
        }]
    };
};

export const createPieConfig = (signals: SignalMap, selectedIds: number[], isCumulative: boolean): EChartsOption => {
    if (signals.size === 0) return createEmptyConfig('pie');

    const lastTick = Math.max(...Array.from(signals.keys()));
    const data = prepareChartData(signals, selectedIds, lastTick);

    const filteredData = isCumulative
        ? data.filter(item => {
            const value = Array.from(signals.values()).reduce((sum, tickSignals) =>
                sum + (tickSignals.get(selectedIds[data.indexOf(item)]) || 0), 0);
            return value > 0;
        }).map(item => ({
            ...item,
            value: Array.from(signals.values()).reduce((sum, tickSignals) =>
                sum + (tickSignals.get(selectedIds[data.indexOf(item)]) || 0), 0)
        }))
        : data.filter(item => item.value > 0);

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
            data: filteredData
        }]
    };
};
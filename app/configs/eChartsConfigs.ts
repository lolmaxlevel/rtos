import type {EChartsOption} from 'echarts';
import {traceLabels} from '@/app/dict';
import {SignalMap} from "@/app/types/types";
import {processStore} from "@/app/store/processStore";

const getProcessName = (handle: number) => processStore.getState().getProcessName(handle);

export const createLineConfig = (signals: SignalMap, selectedIds: number[], selectedHandles: number[] = []): EChartsOption => {
    const ticks = Array.from(signals.keys());

    const minTick = Math.min(...ticks);

    // Find all unique handles across all ticks
    const allHandles = new Set<number>();
    for (const [_, tickMap] of signals.entries()) {
        for (const handle of tickMap.keys()) {
            if (selectedHandles.includes(handle)) {
                allHandles.add(handle);
            }
        }
    }

    // Create a mapping from handle to vertical position
    const handlePositions = new Map<number, number>();
    Array.from(allHandles).sort().forEach((handle, index) => {
        handlePositions.set(handle, index * 2); // Each handle gets a 2-unit band
    });

    // Prepare dataset source
    const datasetSource = Array.from(signals.entries())
        .sort(([a], [b]) => a - b)
        .map(([tick, tickMap]) => {
            const dataPoint: Record<string, number> = {tick};

            // For each handle and selected signal ID
            for (const handle of allHandles) {
                for (const id of selectedIds) {
                    const key = `${traceLabels[id]}_${handle}`;
                    const value = tickMap.get(handle)?.get(id) || 0;

                    // For signal 121 (active state), place it at the handle's position + value
                    if (id === 121) {
                        const basePosition = handlePositions.get(handle) || 0;
                        dataPoint[key] = basePosition + value;
                    } else {
                        // For other signals, we could either skip or use a different visualization
                        dataPoint[key] = value > 0 ? (handlePositions.get(handle) || 0) + 1 : 0;
                    }
                }
            }
            return dataPoint;
        });

    // Create series for each signal-handle combination
    const series = [];
    for (const id of selectedIds) {
        for (const handle of allHandles) {
            const seriesName = `${traceLabels[id]} (${getProcessName(handle)})`;
            series.push({
                name: seriesName,
                type: 'line',
                connectNulls: true,
                step: 'end',
                smooth: false,
                symbol: 'none',
                datasetId: 'dataset',
                encode: {x: 'tick', y: `${traceLabels[id]}_${handle}`},
            });
        }
    }

    const maxPosition = Math.max(...Array.from(handlePositions.values())) + 1;

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
        toolbox: {feature: {restore: {}}},
        xAxis: {
            name: 'Tick',
            min: minTick
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: maxPosition,
            interval: 2,
            axisLabel: {
                formatter: function (value: number) {
                    // Convert position back to handle
                    const handleEntry = Array.from(handlePositions.entries())
                        .find(([_, pos]) => pos === value);
                    return handleEntry ? getProcessName(handleEntry[0]) : '';
                }
            },
            splitLine: {
                show: true,
                lineStyle: {type: 'dashed'}
            }
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
            }
        ],
        dataset: [{
            id: 'dataset',
            source: datasetSource
        }],
        series: series
    };
};
//
// export const createBarConfig = (signals: SignalMap, selectedIds: number[]): EChartsOption => {
//     if (signals.size === 0) return createEmptyConfig('bar');
//
//     const lastTick = Math.max(...Array.from(signals.keys()));
//     const data = [];
//
//     // Get all handles
//     const allHandles = new Set<number>();
//     for (const tickMap of signals.values()) {
//         for (const handle of tickMap.keys()) {
//             allHandles.add(handle);
//         }
//     }
//
//     // Create data points for each signal-handle combination
//     for (const id of selectedIds) {
//         for (const handle of allHandles) {
//             // Get value from last tick
//             const lastTickMap = signals.get(lastTick);
//             let value = 0;
//
//             if (lastTickMap && lastTickMap.has(handle)) {
//                 value = lastTickMap.get(handle)?.get(id) || 0;
//             }
//
//             if (value > 0) {
//                 data.push({
//                     name: `${traceLabels[id]} (Process ${handle})`,
//                     value,
//                     itemStyle: {color: getHandleColor(handle)}
//                 });
//             }
//         }
//     }
//
//     return {
//         tooltip: {trigger: 'axis'},
//         legend: {
//             orient: 'horizontal',
//             bottom: 0,
//             show: true
//         },
//         xAxis: {
//             type: 'category',
//             data: data.map(item => item.name),
//             axisLabel: {interval: 0, rotate: 30}
//         },
//         yAxis: {type: 'value'},
//         series: [{
//             data,
//             type: 'bar'
//         }]
//     };
// };
//
// export const createPieConfig = (signals: SignalMap, selectedIds: number[]): EChartsOption => {
//     if (signals.size === 0) return createEmptyConfig('pie');
//
//     const lastTick = Math.max(...Array.from(signals.keys()));
//     const data = [];
//
//     // Get all handles
//     const allHandles = new Set<number>();
//     for (const tickMap of signals.values()) {
//         for (const handle of tickMap.keys()) {
//             allHandles.add(handle);
//         }
//     }
//
//     // Process data for each signal-handle combination
//     for (const id of selectedIds) {
//         for (const handle of allHandles) {
//             const lastTickMap = signals.get(lastTick);
//             let value = 0;
//
//             if (lastTickMap && lastTickMap.has(handle)) {
//                 value = lastTickMap.get(handle)?.get(id) || 0;
//             }
//
//             if (value > 0) {
//                 data.push({
//                     name: `${traceLabels[id]} (Process ${handle})`,
//                     value,
//                     itemStyle: {color: getHandleColor(handle)}
//                 });
//             }
//         }
//     }
//
//     return {
//         tooltip: {
//             trigger: 'item',
//             formatter: '{a} <br/>{b} : {c} ({d}%)'
//         },
//         legend: {
//             type: "scroll",
//             orient: 'vertical',
//             right: 10,
//             show: true
//         },
//         series: [{
//             name: 'Statistics',
//             type: 'pie',
//             radius: '50%',
//             data
//         }]
//     };
// };
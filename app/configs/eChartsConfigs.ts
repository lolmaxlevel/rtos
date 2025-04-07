import type {EChartsOption} from 'echarts';
import {traceLabels} from '@/app/dict';
import {SignalMap} from "@/app/types/types";
import {processStore} from "@/app/store/processStore";

const getProcessName = (handle: number) => processStore.getState().getProcessName(handle);

// Global tick-to-time conversion utility
export const tickToTime = (tick: number): string => {
    try {
        // Convert Windows FILETIME tick to JavaScript Date
        const date = new Date(+(BigInt(tick) / 10_000n - 11644473600000n).toString());

        // Format with milliseconds
        return new Intl.DateTimeFormat('default', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
            hour12: false
        }).format(date);
    } catch (e) {
        return "Invalid time";
    }
};

export const createLineConfig = (signals: SignalMap, selectedIds: number[], selectedHandles: number[] = []): EChartsOption => {
    // We're focusing on one handle per chart
    const handle = selectedHandles[0];

    // Sort selected IDs for consistent ordering
    const sortedSelectedIds = [...selectedIds].sort();

    // Create signal keys with vertical positioning information
    const signalKeys = new Map(
        sortedSelectedIds.map((id, index) => [
            `${traceLabels[id]}_${handle}`,
            {
                handle,
                id,
                basePosition: index * 2 // Each signal gets its own vertical position
            }
        ])
    );

    // Create dataset source for this handle
    const datasetSource = Array.from(signals)
        .sort(([a], [b]) => a - b)
        .map(([tick, tickMap]) => {
            const dataPoint: Record<string, number> = {tick};
            const handleTickMap = tickMap.get(handle);

            if (handleTickMap) {
                for (const [key, {id, basePosition}] of signalKeys) {
                    // Position signal at its base level when active, slightly below when inactive
                    const isActive = handleTickMap.get(id) > 0;
                    dataPoint[key] = basePosition + (isActive ? 1 : 0);
                }
            } else {
                // If no data for this tick, use previous values or zero
                for (const [key, {basePosition}] of signalKeys) {
                    dataPoint[key] = basePosition; // Inactive state
                }
            }

            return dataPoint;
        });

    // Create series for each signal with specific display settings
    const series = Array.from(signalKeys, ([key, {id, basePosition}]) => ({
        name: `${traceLabels[id]}`,
        type: 'line' as const,
        step: 'end',
        smooth: false,
        symbol: 'none',
        datasetId: 'dataset',
        encode: {x: 'tick', y: key},
        animation: false,
        large: true,
        largeThreshold: 1000,
    }));

    // Calculate max Y value based on number of signals
    const maxPosition = sortedSelectedIds.length * 2;

    // Create the config with vertical stacking
    return {
        animation: false,
        tooltip: {
            confine: true,
            trigger: 'axis',
            className: 'tooltip',
            formatter: (params: any[]) => {
                if (!params?.length) return '';

                const tick = params[0].value.tick;
                const timeString = tickToTime(tick);

                return `Time: ${timeString}<br/>Tick: ${tick}<br/>` +
                    params.map(param => {
                        // Get the series name (like "ACTIVE_STATE")
                        const seriesName = param.seriesName;

                        // Find the key in value object that starts with this series name
                        const matchingKey = Object.keys(param.value).find(key =>
                            key.startsWith(seriesName + '_'));

                        // Get the value if we found a matching key
                        const value = matchingKey ? param.value[matchingKey] : null;

                        // Check if active (non-zero)
                        const isActive = value % 2 === 1;

                        return `${seriesName}: <b>${isActive ? 'active' : 'not active'}</b>`;
                    }).join('<br/>');
            }
        },
        grid: {
            left: '3%',
            right: '5%',
            top: '15%',
            bottom: '15%',
            containLabel: true
        },
        legend: {
            type: 'scroll',
            orient: 'horizontal',
            bottom: 0,
            show: true,
        },
        xAxis: {
            name: 'Time',
            min: Math.min(...signals.keys()),
            type: 'value',
            axisLabel: {
                formatter: (tick: number) => tickToTime(tick),
                showMaxLabel: true
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: maxPosition,
            interval: 2,
            axisLabel: {
                formatter: (value: number) => {
                    // Show signal names at their base positions
                    const index = Math.floor(value / 2);
                    if (value % 2 === 0 && index < sortedSelectedIds.length) {
                        return traceLabels[sortedSelectedIds[index]];
                    }
                    return '';
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
        series
    };
};
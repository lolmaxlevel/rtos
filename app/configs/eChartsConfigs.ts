import type {EChartsOption} from 'echarts';
import {traceLabels} from '@/app/dict';
import {SignalMap} from "@/app/types/types";
import {processStore} from "@/app/store/processStore";

const getProcessName = (handle: number) => processStore.getState().getProcessName(handle);

export const createLineConfig = (signals: SignalMap, selectedIds: number[], selectedHandles: number[] = []): EChartsOption => {
    // Pre-calculate handles and positions once
    const allHandles = new Set(
        Array.from(signals.values())
            .flatMap(tickMap => Array.from(tickMap.keys()))
            .filter(handle => selectedHandles.includes(handle))
    );
    const handleArray = Array.from(allHandles).sort();
    const handlePositions = new Map(handleArray.map((handle, index) => [handle, index * 2]));

    // Pre-calculate signal keys
    const signalKeys = new Map(
        handleArray.flatMap(handle =>
            selectedIds.map(id => [`${traceLabels[id]}_${handle}`, { handle, id }])
        )
    );

    // Optimize dataset creation
    const datasetSource = Array.from(signals)
        .sort(([a], [b]) => a - b)
        .map(([tick, tickMap]) => {
            const dataPoint: Record<string, number> = { tick };

            for (const [key, { handle, id }] of signalKeys) {
                const basePosition = handlePositions.get(handle) || 0;
                dataPoint[key] = basePosition + (tickMap.get(handle)?.get(id) || 0);
            }

            return dataPoint;
        });

    // Create series efficiently
    const series = Array.from(signalKeys, ([key, { handle, id }]) => ({
        name: `${traceLabels[id]} (${getProcessName(handle)})`,
        type: 'line' as const,
        step: 'end',
        smooth: false,
        symbol: 'none',
        datasetId: 'dataset',
        encode: { x: 'tick', y: key },
        animation: false,
        // large: true,
        // largeThreshold: 1000,
        sampling: 'lttb'
    }));

    const maxPosition = handleArray.length * 2;

    return {
        animation: false,
        tooltip: {
            confine: true,
            trigger: 'axis',
            axisPointer: {
                animation: false,
            },
            enterable: true,
            className: 'tooltip',
            formatter: (params: any[]) => {
                if (!params?.length) return '';

                const tick = params[0].value.tick;
                return `Tick: ${tick}<br/>` +
                    params.map(param => {
                        const value = param.value[param.encode.y];
                        const isActive = (value - Math.floor(value)) > 0;
                        return `${param.seriesName}: <b>${isActive ? 'active' : 'not active'}</b>`;
                    }).join('<br/>');
            }
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
        toolbox: { feature: { restore: {} } },
        xAxis: {
            name: 'Tick',
            min: Math.min(...signals.keys()),
            type: 'value',
            axisLabel: { showMaxLabel: true },
            axisTick: { alignWithLabel: true }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: maxPosition,
            interval: 2,
            axisLabel: {
                formatter: (value: number) => {
                    const handle = handleArray[value / 2];
                    return handle ? getProcessName(handle) : '';
                }
            },
            splitLine: {
                show: true,
                lineStyle: { type: 'dashed' }
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
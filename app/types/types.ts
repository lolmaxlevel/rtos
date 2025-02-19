export interface CumulativeSignals {
    [tick: number]: {
        [id: number]: number;
    };
}
import {processStore} from "@/app/store/processStore";

export interface PacketData {
    id: number;
    tickCount: number;
    handle: number;
}

export interface ParseResult {
    packet: PacketData;
    bytesProcessed: number;
}

export function parsePacket(data: Uint8Array, offset: number = 0): ParseResult {
    if (data.length < offset + 14) {
        console.log('Packet too short', data.length, offset + 14);
    }
    const id = (data[offset] << 8) |
                        data[offset + 1];

    const tickCountHigh =
        (BigInt(data[offset + 2]) << 24n) |
        (BigInt(data[offset + 3]) << 16n) |
        (BigInt(data[offset + 4]) << 8n) |
        BigInt(data[offset + 5]);
    const tickCountLow =
        (BigInt(data[offset + 6]) << 24n) |
        (BigInt(data[offset + 7]) << 16n) |
        (BigInt(data[offset + 8]) << 8n) |
        BigInt(data[offset + 9]);
    const tickCount = Number(((tickCountHigh << 32n) | tickCountLow) % BigInt(Number.MAX_SAFE_INTEGER));

    const handle =
        (data[offset + 10] << 24) |
        (data[offset + 11] << 16) |
        (data[offset + 12] << 8) |
        data[offset + 13];

    let name = '';
    if (id == 48) {
        const handle =
            (data[offset + 15] << 24) |
            (data[offset + 16] << 16) |
            (data[offset + 17] << 8) |
            data[offset + 18];

        let i = 0;
        while (data[offset + 19 + i] !== 0 && offset + 19 + i < data.length) {
            name += String.fromCharCode(data[offset + 19 + i]);
            i++;
        }
        processStore.getState().setProcessName(handle, name + ` (${handle})`);
        // console.log("Detected name at", offset + 18, "=", name);
    }

    const bytesProcessed = 14 + (name.length > 0 ? name.length + 6 : 0);
    return { packet: { id, tickCount, handle }, bytesProcessed };
}

export function processPackets(buffer: ArrayBuffer): PacketData[] {
    const data = new Uint8Array(buffer);
    const packets: PacketData[] = [];
    let offset = 0;

    while (offset < data.length) {
        const { packet, bytesProcessed } = parsePacket(data, offset);
        packets.push(packet);
        offset += bytesProcessed;
    }

    return packets;
}
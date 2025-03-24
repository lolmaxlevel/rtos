// Global buffer to store incomplete packets
import {processStore} from "@/app/store/processStore";

let globalBuffer: Uint8Array = new Uint8Array(0);

export interface PacketData {
    id: number;
    tickCount: number;
    handle: number;
    name: string;
}

export interface ParseResult {
    packet: PacketData | null; // Null if packet is incomplete
    bytesProcessed: number;    // Bytes consumed from the input buffer
}

/**
 * Parses a single packet from the given data starting at the specified offset.
 */
export function parsePacket(data: Uint8Array, offset: number = 0): ParseResult {
    if (data.length < offset + 14) {
        // Packet too short, return null and process later
        return {packet: null, bytesProcessed: 0};
    }

    const id =
        ((data[offset] & 0xF7) << 8)  |
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
    let nameLength = 0;

    if (id === 48 && data[offset + 14] === 0) {
        const additionalHandle =
            (data[offset + 15] << 24) |
            (data[offset + 16] << 16) |
            (data[offset + 17] << 8) |
            data[offset + 18];

        let i = 0;
        while (offset + 19 + i < data.length && data[offset + 19 + i] !== 0) {
            name += String.fromCharCode(data[offset + 19 + i]);
            i++;
        }
        // console.log(name, handle, additionalHandle);
        processStore.getState().setProcessName(additionalHandle, name + ` (${additionalHandle})`);
        nameLength = i; // Include null terminator
    }

    const basePacketSize = 14; // Fixed size for ID, tick count, and handle
    const totalPacketSize = basePacketSize + (name ? nameLength + 6 : 0);

    if (data.length < offset + totalPacketSize) {
        // Packet is incomplete, return null and process later
        return {packet: null, bytesProcessed: 0};
    }

    return {
        packet: {
            id,
            tickCount,
            handle,
            name,
        },
        bytesProcessed: totalPacketSize,
    };
}

/**
 * Processes all packets in the given buffer, handling incomplete packets.
 */
export function processPackets(buffer: ArrayBuffer): PacketData[] {
    const data = new Uint8Array(buffer);

    // Prepend any leftover data from the previous buffer
    const combinedData = new Uint8Array(globalBuffer.length + data.length);
    combinedData.set(globalBuffer, 0);
    combinedData.set(data, globalBuffer.length);

    const packets: PacketData[] = [];
    let offset = 0;

    while (offset < combinedData.length) {
        const {packet, bytesProcessed} = parsePacket(combinedData, offset);

        if (packet === null) {
            // Incomplete packet, save the remaining data for next time
            globalBuffer = combinedData.slice(offset);
            break;
        }

        packets.push(packet);
        offset += bytesProcessed;
    }

    // If we processed all data, clear the global buffer
    if (offset === combinedData.length) {
        globalBuffer = new Uint8Array(0);
    }

    return packets;
}
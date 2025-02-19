// app/utils/packet.ts
export const PAYLOAD_SIZE = 5;

export interface PacketData {
    tick: number;
    id: number;
}

export function parsePacket(data: Uint8Array, offset: number = 0): PacketData {
    const tick = (data[offset] << 24) |
        (data[offset + 1] << 16) |
        (data[offset + 2] << 8) |
        data[offset + 3];
    const id = data[offset + 4];

    return { tick, id };
}

export function processPackets(buffer: ArrayBuffer): PacketData[] {
    const data = new Uint8Array(buffer);
    const packets: PacketData[] = [];

    for (let i = 0; i < data.length / PAYLOAD_SIZE; i++) {
        packets.push(parsePacket(data, i * PAYLOAD_SIZE));
    }

    return packets;
}
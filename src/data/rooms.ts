import type { Room, RoomId } from '../types/agenda';

export const rooms: Room[] = [
  { id: 'hall', name: '國際會議廳', short: '國際會議廳', kind: 'hall' },
  { id: 'key', name: '關鍵中心', short: '關鍵中心', kind: 'center' },
  { id: 'abrc', name: '農生中心', short: '農生中心', kind: 'center' },
  { id: 'outA', name: '場外活動 A', short: '場外 A', kind: 'outdoor' },
  { id: 'outB', name: '場外活動 B', short: '場外 B', kind: 'outdoor' },
  { id: 'm60', name: '會議室（60 人）', short: '會議室 60', kind: 'meeting', capacity: 60 },
  { id: 'm38', name: '會議室（38 人）', short: '會議室 38', kind: 'meeting', capacity: 38 },
  { id: 'm50', name: '會議室（50 人）', short: '會議室 50', kind: 'meeting', capacity: 50 },
  { id: 'm27', name: '會議室（27 人）', short: '會議室 27', kind: 'meeting', capacity: 27 },
  { id: 'outC', name: '場外活動 C', short: '場外 C', kind: 'outdoor' },
];

export const roomIndex = new Map<RoomId, number>(rooms.map((room, i) => [room.id, i]));

export function roomById(id: RoomId): Room {
  const room = rooms.find((r) => r.id === id);
  if (!room) throw new Error(`Unknown room: ${id}`);
  return room;
}


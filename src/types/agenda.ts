export type SessionType =
  | 'plenary'
  | 'keynote'
  | 'talk'
  | 'lightning'
  | 'workshop'
  | 'submission'
  | 'debate'
  | 'roundtable'
  | 'activity'
  | 'exhibit'
  | 'screening'
  | 'break';

export type RoomKind = 'hall' | 'center' | 'meeting' | 'outdoor';

export interface Room {
  id: RoomId;
  
  name: string;
  
  short: string;
  kind: RoomKind;
  capacity?: number;
}

export type RoomId =
  | 'hall'
  | 'key'
  | 'abrc'
  | 'outA'
  | 'outB'
  | 'm60'
  | 'm38'
  | 'm50'
  | 'm27'
  | 'outC';

export interface Session {
  
  id: string;
  title: string;
  type: SessionType;
  
  start: string;
  end: string;
  
  rooms: RoomId[] | 'all';
  speakerIds: string[];
  tags: string[];
  
  abstract?: string;
  
  note?: string;
  slidesUrl?: string;
  videoUrl?: string;
}

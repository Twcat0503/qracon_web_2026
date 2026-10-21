import type { Session, SessionType } from '../types/agenda';

const DAY = '2026-12-05';
const at = (hhmm: string) => `${DAY}T${hhmm}:00+08:00`;

type Draft = Omit<Session, 'start' | 'end' | 'speakerIds' | 'tags'> & {
  from: string;
  to: string;
};

const drafts: Draft[] = [
  { id: 'check-in', title: '報到', type: 'break', from: '08:00', to: '09:00', rooms: 'all' },
  { id: 'opening', title: '開幕', type: 'plenary', from: '09:00', to: '09:30', rooms: 'all' },
  {
    id: 'keynote-dialogue',
    title: '主題對談',
    type: 'keynote',
    from: '09:30',
    to: '10:00',
    rooms: 'all',
    note: '兩位大佬對談，加一位主持人',
  },
  {
    id: 'keynote',
    title: '主題演講',
    type: 'keynote',
    from: '10:00',
    to: '10:30',
    rooms: 'all',
    note: '一位大佬',
  },

  { id: 'qc-basics', title: '量子電腦的基礎簡介或原理', type: 'talk', from: '10:30', to: '11:30', rooms: ['hall'] },
  { id: 'vendor-lightning', title: '廠商閃電講', type: 'lightning', from: '11:30', to: '12:00', rooms: ['hall'] },
  {
    id: 'screening',
    title: '影片放映',
    type: 'screening',
    from: '12:00',
    to: '13:30',
    rooms: ['hall'],
    note: '量子熊之類的嗎',
  },
  { id: 'enterprise-optimization', title: '企業應用量子優化實際案例', type: 'talk', from: '13:30', to: '14:00', rooms: ['hall'] },
  { id: 'enterprise-strategy', title: '量子計算企業布局', type: 'talk', from: '14:00', to: '14:30', rooms: ['hall'] },
  { id: 'taiwan-qc-research', title: '台灣量子電腦研究方向', type: 'talk', from: '14:30', to: '15:00', rooms: ['hall'] },
  { id: 'hpc-quantum', title: 'HPC＋量子', type: 'talk', from: '15:00', to: '16:00', rooms: ['hall'] },
  { id: 'open-lightning', title: '任意閃電講', type: 'lightning', from: '16:00', to: '16:30', rooms: ['hall', 'key', 'abrc'] },

  { id: 'quantum-ai', title: '量子＆AI 介紹與應用', type: 'talk', from: '10:30', to: '11:00', rooms: ['key'] },
  { id: 'quantum-annealing', title: '量子退火介紹或應用', type: 'talk', from: '11:00', to: '11:30', rooms: ['key'] },
  { id: 'lunch-centers', title: '午餐', type: 'break', from: '12:00', to: '13:30', rooms: ['key', 'abrc'] },
  { id: 'quantum-journey', title: '認識量子心路歷程', type: 'talk', from: '13:30', to: '14:00', rooms: ['key'] },
  { id: 'industry-and-study', title: '量子產業／升學現況與未來', type: 'talk', from: '14:00', to: '14:30', rooms: ['key'] },
  { id: 'quantum-security', title: '量子＆資安的發展與現況', type: 'talk', from: '14:30', to: '15:00', rooms: ['key'] },
  { id: 'drug-discovery', title: '量子 in 藥物開發／分子模擬', type: 'talk', from: '15:00', to: '16:00', rooms: ['key'] },

  { id: 'hs-intro', title: 'For 高中生知識的演講', type: 'talk', from: '10:30', to: '11:00', rooms: ['abrc'] },
  { id: 'sampling', title: '量子計算／量子抽樣', type: 'talk', from: '11:00', to: '11:30', rooms: ['abrc'] },
  { id: 'photonic-materials', title: '光電材料在量子通訊或計算的角色', type: 'talk', from: '13:30', to: '14:30', rooms: ['abrc'] },
  {
    id: 'quantum-sensing',
    title: '量子感測目前的研究成果',
    type: 'talk',
    from: '14:30',
    to: '15:30',
    rooms: ['abrc'],
    note: '稍微偏材料突破方面',
  },

  { id: 'rpg-tour', title: '場外 RPG／導遊團', type: 'activity', from: '10:30', to: '16:00', rooms: ['outA'] },
  { id: 'quantum-battle', title: '量子對戰遊戲／量子進程展', type: 'activity', from: '10:30', to: '16:00', rooms: ['outB'] },
  { id: 'graffiti-hide-and-seek', title: '量子塗鴉躲貓貓', type: 'activity', from: '10:30', to: '16:30', rooms: ['outC'] },

  { id: 'vendor-exhibit', title: '廠商量子電腦概念元件／案例展示', type: 'exhibit', from: '13:30', to: '16:00', rooms: ['m60'] },

  { id: 'submission-1', title: '學生投稿 1', type: 'submission', from: '10:30', to: '11:00', rooms: ['m38'] },
  { id: 'submission-2', title: '學生投稿 2', type: 'submission', from: '11:00', to: '11:30', rooms: ['m38'] },
  { id: 'submission-3', title: '學生投稿 3', type: 'submission', from: '11:30', to: '12:00', rooms: ['m38'] },
  { id: 'submission-4', title: '學生投稿 4', type: 'submission', from: '12:00', to: '12:30', rooms: ['m38'] },
  { id: 'submission-5', title: '學生投稿 5', type: 'submission', from: '12:30', to: '13:00', rooms: ['m38'] },
  { id: 'qc-workshop', title: '量子電腦工作坊', type: 'workshop', from: '13:30', to: '15:00', rooms: ['m38'] },
  { id: 'project-sharing', title: '實作／專案／論文經驗分享', type: 'talk', from: '15:00', to: '15:30', rooms: ['m38'] },

  { id: 'cafe-morning', title: '咖啡廳', type: 'break', from: '10:30', to: '12:00', rooms: ['m50'] },
  { id: 'lunch-rooms', title: '午餐', type: 'break', from: '12:00', to: '13:30', rooms: ['m50', 'm27'] },
  { id: 'cafe-afternoon', title: '咖啡廳', type: 'break', from: '13:30', to: '16:30', rooms: ['m50'] },
  { id: 'table-host-1', title: '桌長 1', type: 'roundtable', from: '11:30', to: '12:00', rooms: ['m27'] },
  { id: 'table-host-2', title: '桌長 2／辯論', type: 'roundtable', from: '13:30', to: '15:00', rooms: ['m27'] },
  { id: 'debate-1', title: '量子辯論 1', type: 'debate', from: '15:00', to: '15:30', rooms: ['m27'] },
  { id: 'debate-2', title: '量子辯論 2', type: 'debate', from: '15:30', to: '16:00', rooms: ['m27'] },
  { id: 'debate-3', title: '量子辯論 3', type: 'debate', from: '16:00', to: '16:30', rooms: ['m27'] },

  { id: 'closing', title: '閉幕', type: 'plenary', from: '16:30', to: '17:00', rooms: 'all' },
  { id: 'departure', title: '賦歸', type: 'break', from: '17:00', to: '17:30', rooms: 'all' },
];

export const sessions: Session[] = drafts.map(({ from, to, ...rest }) => ({
  ...rest,
  start: at(from),
  end: at(to),
  speakerIds: [],
  tags: [],
}));

export const typeLabels: Record<SessionType, string> = {
  plenary: '典禮',
  keynote: '主題',
  talk: '演講',
  lightning: '閃電講',
  workshop: '工作坊',
  submission: '學生投稿',
  debate: '辯論',
  roundtable: '桌長',
  activity: '場外活動',
  exhibit: '展示',
  screening: '放映',
  break: '休息',
};

export const isListed = (s: Session) => s.type !== 'break';
export const canBookmark = (s: Session) => isListed(s) && s.rooms !== 'all';

export const phases = [
  { id: 'phase-arrival', label: '報到與開幕', from: '08:00', to: '10:30' },
  { id: 'phase-morning', label: '上午分軌', from: '10:30', to: '12:00' },
  { id: 'phase-noon', label: '午間', from: '12:00', to: '13:30' },
  { id: 'phase-afternoon', label: '下午分軌', from: '13:30', to: '16:30' },
  { id: 'phase-closing', label: '閉幕與賦歸', from: '16:30', to: '17:30' },
] as const;


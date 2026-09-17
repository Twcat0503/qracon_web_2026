
export type RegistrationStatus = 'soon' | 'open' | 'closed';

interface SiteInfo {
  name: string;
  nameZh: string;
  nameEn: string;
  edition: number;
  editionLabel: string;
  
  date: string;
  dateLabel: string;
  weekday: string;
  weekdayEn: string;
  
  rocDate: string;
  checkIn: string;
  timeZone: string;
  venue: { org: string; name: string; city: string; address: string | null };
  advisor: string;
  organizers: string[] | null;
  theme: { title: string | null; tagline: string | null };
  registration: { status: RegistrationStatus; url: string | null; price: string | null };
  contactEmail: string | null;
  social: { label: string; url: string }[];
  description: string;
}

export const site: SiteInfo = {
  name: 'QRACON 2026',
  nameZh: '學生量子電腦年會',
  nameEn: 'Quantum Revolution Assembly CONvention',
  edition: 4,
  editionLabel: '第四屆',
  date: '2026-12-05',
  dateLabel: '2026.12.05',
  weekday: '六',
  weekdayEn: 'SAT',
  rocDate: '115.12.05',
  checkIn: '08:00',
  timeZone: 'Asia/Taipei',
  venue: {
    org: '中央研究院',
    name: '南部院區',
    city: '臺南',
    address: null,
  },
  advisor: 'EntangleTech',
  organizers: null,
  theme: {
    title: null,
    tagline: null,
  },
  registration: {
    status: 'soon',
    url: null,
    price: null,
  },
  contactEmail: null,
  social: [],
  description:
    'QRACON 2026 學生量子電腦年會，2026 年 12 月 5 日（六）在中央研究院南部院區舉行。第四屆，由學生主導，讓量子科技的學術界、產業界與教育端在同一天交流。',
};


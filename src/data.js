export const KEY = 'acl-service-hours-v1';

// Fictional volunteering programs. Staff names, partners and descriptions are examples, not real records.
export const PROGRAMS = {
  ENV110: {
    name: 'Campus Green Team',
    partner: 'University Sustainability Office',
    description: 'Weekly tree planting, recycling audits and awareness stands that help the campus reduce its waste and energy use.',
    history: [
      {year: '2025/26', supervisors: ['Dr. Heba Lotfy'], coordinators: ['Malak Ashraf', 'Ziad Hamdy']},
      {year: '2024/25', supervisors: ['Dr. Sherif Galal'], coordinators: ['Jana Wael', 'Seif Mostafa']},
    ],
  },
  EDU210: {
    name: 'Peer Tutoring Circle',
    partner: 'Student Learning Center',
    description: 'Senior students run small study groups for first-year courses, preparing worked examples and answering questions.',
    history: [
      {year: '2025/26', supervisors: ['Dr. Nermine Aly'], coordinators: ['Hana Kamal', 'Marwan Essam']},
      {year: '2024/25', supervisors: ['Dr. Waleed Fouad'], coordinators: ['Laila Samy', 'Kareem Ayman']},
    ],
  },
  HLT150: {
    name: 'Blood Drive Crew',
    partner: 'Regional Blood Bank',
    description: 'Volunteers organise campus donation days, register donors and support the medical team on site.',
    history: [
      {year: '2025/26', supervisors: ['Dr. Amr Zaki'], coordinators: ['Salma Reda', 'Omar Hesham']},
      {year: '2024/25', supervisors: ['Dr. Mona Sabry', 'Dr. Amr Zaki'], coordinators: ['Nadia Fikry', 'Tarek Adel']},
    ],
  },
  COM305: {
    name: 'Community Kitchen',
    partner: 'Neighbourhood Food Network',
    description: 'Preparing and packing meals for local families, managing donations and keeping the kitchen inventory up to date.',
    history: [
      {year: '2025/26', supervisors: ['Dr. Ghada Ibrahim'], coordinators: ['Yasmin Talaat', 'Hazem Farid']},
      {year: '2024/25', supervisors: ['Dr. Ghada Ibrahim'], coordinators: ['Rania Saleh', 'Mostafa Emad']},
    ],
  },
  TEC220: {
    name: 'Digital Skills for Seniors',
    partner: 'City Community Library',
    description: 'One-to-one sessions that help older adults use smartphones, video calls, online banking and e-government services safely.',
    history: [
      {year: '2025/26', supervisors: ['Dr. Khaled Mourad'], coordinators: ['Reem Atef', 'Ahmed Nabil']},
      {year: '2024/25', supervisors: ['Dr. Inas Farag'], coordinators: ['Mai Yehia', 'Bassem Hany']},
    ],
  },
};

export const getProgram = code => PROGRAMS[code?.toUpperCase()] || {
  name: 'Program details not yet added',
  partner: '—',
  description: 'This program does not have a profile in the example directory.',
  history: [],
};

export const seed = [
  {id:'e1',programCode:'ENV110',hours:3,reflection:'Planting day was well organised and the team lead explained every step.',owner:'you',name:'You',date:'2026-10-11'},
  {id:'e2',programCode:'EDU210',hours:2,reflection:'If you prepare examples in advance the sessions run smoothly.',owner:'other',name:'Habiba',date:'2026-10-08'},
  {id:'e3',programCode:'HLT150',hours:6,reflection:'Long shift but very rewarding. Bring water and snacks.',owner:'other',name:'Omar',date:'2026-10-03'},
  {id:'e4',programCode:'COM305',hours:4,reflection:'Packing went quickly once roles were clear.',owner:'you',name:'You',date:'2026-09-29'},
  {id:'e5',programCode:'TEC220',hours:2,reflection:'Patience matters more than technical knowledge here.',owner:'other',name:'Lina',date:'2026-09-25'},
  {id:'e6',programCode:'ENV110',hours:5,reflection:'Recycling audit took longer than planned.',owner:'other',name:'Youssef',date:'2026-09-19'},
  {id:'e7',programCode:'EDU210',hours:3,reflection:'Students asked great questions about recursion.',owner:'other',name:'Mariam',date:'2026-09-12'},
  {id:'e8',programCode:'HLT150',hours:8,reflection:'',owner:'other',name:'Ali',date:'2026-09-05'},
  {id:'e9',programCode:'COM305',hours:1,reflection:'Short orientation session only.',owner:'other',name:'Nour',date:'2026-08-28'},
  {id:'e10',programCode:'ENV110',hours:2,reflection:'Good for a first volunteering experience.',owner:'other',name:'Farah',date:'2026-08-20'},
];

export function loadEntries(){
  try{const s=JSON.parse(localStorage.getItem(KEY));return Array.isArray(s)?s:seed;}catch{return seed;}
}

export const meanHours = a => a.length ? (a.reduce((s,e)=>s+e.hours,0)/a.length).toFixed(1) : '—';
export const sumHours = a => a.reduce((s,e)=>s+e.hours,0);
export const formatDate = d => {
  const t = new Date(d+'T00:00:00');
  return isNaN(t) ? '' : t.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
};

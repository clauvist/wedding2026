
// ─── Shared mock data & design tokens ────────────────────────────────────────

const SAGE        = '#7a8c78';
const SAGE_LIGHT  = '#c8d4c6';
const SAGE_PALE   = '#eef2ed';
const GOLD        = '#b8935a';
const GOLD_LIGHT  = '#e8d5b0';
const CREAM       = '#faf8f4';
const CHARCOAL    = '#2c2c2c';
const MUTED       = '#7a7a7a';
const BORDER      = '#e8e4de';

const TABLES_META = [
  {id:'VIP 1', cx:170, cy:175, type:'vip'},
  {id:'1',  cx:75,  cy:175, type:'teal'},
  {id:'25', cx:505, cy:175, type:'teal'},
  {id:'26', cx:410, cy:175, type:'teal'},
  {id:'2',  cx:75,  cy:270, type:'teal'},
  {id:'12', cx:170, cy:270, type:'teal'},
  {id:'13', cx:410, cy:270, type:'teal'},
  {id:'23', cx:505, cy:270, type:'teal'},
  {id:'3',  cx:75,  cy:365, type:'teal'},
  {id:'11', cx:170, cy:365, type:'teal'},
  {id:'15', cx:410, cy:365, type:'teal'},
  {id:'22', cx:505, cy:365, type:'teal'},
  {id:'5',  cx:75,  cy:460, type:'teal'},
  {id:'10', cx:170, cy:460, type:'teal'},
  {id:'16', cx:410, cy:460, type:'teal'},
  {id:'21', cx:505, cy:460, type:'teal'},
  {id:'6',  cx:75,  cy:555, type:'teal'},
  {id:'9',  cx:170, cy:555, type:'teal'},
  {id:'17', cx:410, cy:555, type:'teal'},
  {id:'20', cx:505, cy:555, type:'teal'},
  {id:'7',  cx:75,  cy:650, type:'teal'},
  {id:'8',  cx:170, cy:650, type:'teal'},
  {id:'18', cx:410, cy:650, type:'teal'},
  {id:'19', cx:505, cy:650, type:'teal'},
];

const MOCK_GUESTS = [
  // VIP Table
  {name:'Siew Boon Keong', table:'VIP 1'},
  {name:'Lim Hui Ling',    table:'VIP 1'},
  {name:'Tan Chee Wei',    table:'VIP 1'},
  {name:'Wong Mei Fen',    table:'VIP 1'},
  {name:'Ong Swee Keat',   table:'VIP 1'},
  {name:'Ng Bak Leong',    table:'VIP 1'},
  {name:'Lim Su Lin',      table:'VIP 1'},
  {name:'Tan Ah Kow',      table:'VIP 1'},
  // Table 1
  {name:'Ahmad Farid',     table:'1'},
  {name:'Nurul Ain',       table:'1'},
  {name:'Zulkifli Hassan', table:'1'},
  {name:'Fatimah Zakaria', table:'1'},
  {name:'Hazrul Nizam',    table:'1'},
  {name:'Siti Rohani',     table:'1'},
  {name:'Ismail Bakar',    table:'1'},
  {name:'Rohana Md Isa',   table:'1'},
  // Table 2
  {name:'Chen Jian Ming',  table:'2'},
  {name:'Liu Yan',         table:'2'},
  {name:'Zhang Wei',       table:'2'},
  {name:'Wang Fang',       table:'2'},
  {name:'Li Xiao Hong',    table:'2'},
  {name:'Zhou Da Peng',    table:'2'},
  {name:'Huang Mei',       table:'2'},
  {name:'Wu Jun',          table:'2'},
  // Table 3
  {name:'Raj Kumar',       table:'3'},
  {name:'Priya Nair',      table:'3'},
  {name:'Suresh Pillai',   table:'3'},
  {name:'Kavitha Menon',   table:'3'},
  {name:'Anand Krishnan',  table:'3'},
  {name:'Deepa Rajan',     table:'3'},
  {name:'Vikram Sharma',   table:'3'},
  {name:'Meena Sundaram',  table:'3'},
  // Table 5
  {name:'James Tan',       table:'5'},
  {name:'Sarah Loh',       table:'5'},
  {name:'David Koh',       table:'5'},
  {name:'Michelle Goh',    table:'5'},
  {name:'Kevin Yeo',       table:'5'},
  {name:'Jessica Chua',    table:'5'},
  {name:'Bryan Sim',       table:'5'},
  {name:'Amanda Ng',       table:'5'},
  // Table 6
  {name:'Mark Lee',        table:'6'},
  {name:'Tracy Wong',      table:'6'},
  {name:'Gary Ong',        table:'6'},
  {name:'Linda Chan',      table:'6'},
  {name:'Chris Lim',       table:'6'},
  {name:'Diana Tan',       table:'6'},
  {name:'Eric Yap',        table:'6'},
  {name:'Fiona Tay',       table:'6'},
  // Table 7
  {name:'Henry Foo',       table:'7'},
  {name:'Irene Ng',        table:'7'},
  {name:'Jason Teo',       table:'7'},
  {name:'Karen Wee',       table:'7'},
  {name:'Leon Phua',       table:'7'},
  {name:'Mandy Ho',        table:'7'},
  {name:'Nelson Kua',      table:'7'},
  {name:'Olivia Tan',      table:'7'},
  // Table 8
  {name:'Paul Chew',       table:'8'},
  {name:'Queenie Soh',     table:'8'},
  {name:'Raymond Low',     table:'8'},
  {name:'Stephanie Ang',   table:'8'},
  {name:'Timothy Beh',     table:'8'},
  {name:'Ursula Chin',     table:'8'},
  {name:'Victor Goh',      table:'8'},
  {name:'Wendy Lim',       table:'8'},
  // Table 9
  {name:'Xavier Tan',      table:'9'},
  {name:'Yvonne Koh',      table:'9'},
  {name:'Zachary Ng',      table:'9'},
  {name:'Alice Chan',      table:'9'},
  {name:'Ben Yong',        table:'9'},
  {name:'Celine Toh',      table:'9'},
  {name:'Derrick Woo',     table:'9'},
  {name:'Elaine Sim',      table:'9'},
  // Table 10
  {name:'Felix Chia',      table:'10'},
  {name:'Grace Tan',       table:'10'},
  {name:'Harry Chua',      table:'10'},
  {name:'Iris Wong',       table:'10'},
  {name:'Jack Lee',        table:'10'},
  {name:'Kelly Lim',       table:'10'},
  {name:'Larry Ng',        table:'10'},
  {name:'Maggie Goh',      table:'10'},
  // Table 11
  {name:'Norman Poh',      table:'11'},
  {name:'Ophelia Siew',    table:'11'},
  {name:'Patrick Ooi',     table:'11'},
  {name:'Quinn Tee',       table:'11'},
  {name:'Rachel Yap',      table:'11'},
  {name:'Samuel Leong',    table:'11'},
  {name:'Tina Quek',       table:'11'},
  {name:'Ulric Fong',      table:'11'},
  // Table 12
  {name:'Vera Tng',        table:'12'},
  {name:'Walter Boo',      table:'12'},
  {name:'Xenia Pang',      table:'12'},
  {name:'Yusuf Rahman',    table:'12'},
  {name:'Zoe Toh',         table:'12'},
  {name:'Aaron Lew',       table:'12'},
  {name:'Belinda Koo',     table:'12'},
  {name:'Colin Mah',       table:'12'},
  // Table 13
  {name:'Doris Tan',       table:'13'},
  {name:'Edmund Yee',      table:'13'},
  {name:'Flora Siow',      table:'13'},
  {name:'Gerald Soo',      table:'13'},
  {name:'Hannah Tay',      table:'13'},
  {name:'Ivan Lau',        table:'13'},
  {name:'Joanna Khor',     table:'13'},
  {name:'Kenneth Pek',     table:'13'},
  // Table 15–26 abbreviated
  {name:'Lily Chen',       table:'15'},
  {name:'Mike Wu',         table:'15'},
  {name:'Nina Liu',        table:'15'},
  {name:'Oscar Yang',      table:'15'},
  {name:'Penny Zheng',     table:'15'},
  {name:'Quinn Li',        table:'15'},
  {name:'Ron Xu',          table:'16'},
  {name:'Sue Ma',          table:'16'},
  {name:'Tom He',          table:'16'},
  {name:'Uma Gao',         table:'16'},
  {name:'Val Zhu',         table:'16'},
  {name:'Will Hu',         table:'16'},
  {name:'Xin Bai',         table:'17'},
  {name:'Ying Cao',        table:'17'},
  {name:'Zen Deng',        table:'17'},
  {name:'Amy Fu',          table:'17'},
  {name:'Bob Gui',         table:'17'},
  {name:'Cara Han',        table:'17'},
  {name:'Dan Ji',          table:'18'},
  {name:'Eve Kai',         table:'18'},
  {name:'Frank Lang',      table:'18'},
  {name:'Gina Mo',         table:'18'},
  {name:'Hank Ni',         table:'18'},
  {name:'Ida Pan',         table:'18'},
  {name:'Joe Qi',          table:'19'},
  {name:'Kay Ran',         table:'19'},
  {name:'Leo Shao',        table:'19'},
  {name:'Mia Tang',        table:'19'},
  {name:'Ned Wen',         table:'19'},
  {name:'Ora Xin',         table:'19'},
  {name:'Pete Yi',         table:'20'},
  {name:'Rosa Zeng',       table:'20'},
  {name:'Sam An',          table:'20'},
  {name:'Tara Bo',         table:'20'},
  {name:'Uri Chen',        table:'20'},
  {name:'Vee Da',          table:'20'},
  {name:'Wade En',         table:'21'},
  {name:'Xora Fu',         table:'21'},
  {name:'Yara Ge',         table:'21'},
  {name:'Zack Han',        table:'21'},
  {name:'Akin Im',         table:'21'},
  {name:'Bela Jia',        table:'21'},
  {name:'Cade Ke',         table:'22'},
  {name:'Daya Li',         table:'22'},
  {name:'Echo Ma',         table:'22'},
  {name:'Finn Na',         table:'22'},
  {name:'Gale Pu',         table:'22'},
  {name:'Hana Qi',         table:'22'},
  {name:'Ilya Ru',         table:'23'},
  {name:'Jade Su',         table:'23'},
  {name:'Kael Tu',         table:'23'},
  {name:'Luna Vu',         table:'23'},
  {name:'Miko Wu',         table:'23'},
  {name:'Noel Xi',         table:'23'},
  {name:'Omar Ya',         table:'25'},
  {name:'Pita Za',         table:'25'},
  {name:'Remy Al',         table:'25'},
  {name:'Sara Bo',         table:'25'},
  {name:'Teo Ce',          table:'25'},
  {name:'Usha Di',         table:'25'},
  {name:'Vera El',         table:'26'},
  {name:'Wren Fi',         table:'26'},
  {name:'Xena Gi',         table:'26'},
  {name:'Yuki Hi',         table:'26'},
  {name:'Zuri Ii',         table:'26'},
  {name:'Aino Ji',         table:'26'},
];

// Pre-seed arrivals: roughly 60% checked in
const MOCK_ARRIVED = new Set(
  MOCK_GUESTS
    .filter((_, i) => i % 5 !== 0 && i % 7 !== 0)
    .map(g => g.table + '|' + g.name)
);

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');
}

function tableColor(t, tweaks) {
  const acc = tweaks?.accentColor || SAGE;
  return t.type === 'vip' ? '#e8b84b' : acc === SAGE ? '#4db8a0' : acc;
}

// Export all to window for cross-script access
Object.assign(window, {
  SAGE, SAGE_LIGHT, SAGE_PALE, GOLD, GOLD_LIGHT, CREAM, CHARCOAL, MUTED, BORDER,
  TABLES_META, MOCK_GUESTS, MOCK_ARRIVED, initials, tableColor
});

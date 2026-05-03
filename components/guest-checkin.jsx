
// ─── Guest Self Check-in Mobile View ─────────────────────────────────────────
// Screens: pin → search → confirm → success → table

function GuestCheckin({ tweaks = {}, screen = 'pin' }) {
  const acc    = tweaks.accentColor  || SAGE;
  const gold   = tweaks.goldColor    || GOLD;
  const serif  = tweaks.fontSerif    || 'Cormorant Garamond';
  const sans   = tweaks.fontSans     || 'DM Sans';

  const DEMO_GUEST = { name: 'Chen Jian Ming', table: '2' };
  const DEMO_MATCHES = [
    { name: 'Chen Jian Ming', table: '2' },
    { name: 'Celine Toh',     table: '9' },
  ];

  const s = {
    root: { width:'100%', height:'100%', background:CREAM, display:'flex', flexDirection:'column', fontFamily:sans, overflowY:'auto' },
    eventHeader: { textAlign:'center', padding:'40px 20px 24px', flexShrink:0 },
    eyebrow: { fontFamily:serif, fontSize:12, letterSpacing:'0.22em', textTransform:'uppercase', color:gold, marginBottom:8 },
    title: { fontFamily:serif, fontSize:32, fontWeight:400, color:CHARCOAL, lineHeight:1.15 },
    titleAcc: { fontStyle:'italic', color:gold },
    subtitle: { fontFamily:serif, fontSize:14, color:MUTED, marginTop:6, letterSpacing:'0.04em' },
    card: { margin:'0 20px 16px', background:'white', border:`1px solid ${BORDER}`, borderRadius:16, padding:24 },
    label: { fontSize:16, fontWeight:500, color:CHARCOAL, marginBottom:6 },
    hint: { fontSize:14, color:MUTED, marginBottom:18, lineHeight:1.6 },
    input: { width:'100%', padding:'15px 14px', fontFamily:sans, fontSize:17, border:`1.5px solid #e0dbd4`, borderRadius:10, background:CREAM, color:CHARCOAL, outline:'none', marginBottom:14 },
    btnPrimary: { width:'100%', padding:'18px 0', background:acc, border:'none', borderRadius:14, fontFamily:sans, fontSize:17, fontWeight:500, color:'white', cursor:'pointer', display:'block', textAlign:'center', textDecoration:'none' },
    btnSecondary: { width:'100%', padding:'15px 0', background:'white', border:`1.5px solid #e0dbd4`, borderRadius:14, fontFamily:sans, fontSize:15, fontWeight:400, color:MUTED, cursor:'pointer', display:'block', textAlign:'center', marginBottom:12 },
    btnGhost: { padding:'14px', background:'none', border:`1.5px solid ${BORDER}`, borderRadius:12, fontFamily:sans, fontSize:14, fontWeight:500, color:MUTED, cursor:'pointer', flex:1 },
  };

  // ── Event header shared across screens ────────────────────────────────────
  function EventHeader() {
    return (
      <div style={s.eventHeader}>
        <div style={s.eyebrow}>Welcome to</div>
        <div style={s.title}>
          Tristan <span style={s.titleAcc}>&amp;</span> Regina
        </div>
        <div style={s.subtitle}>Saturday, 2 May 2026</div>
      </div>
    );
  }

  // ── PIN Screen ────────────────────────────────────────────────────────────
  function PinScreen() {
    const pin = ['1','2','',''];
    return (
      <div style={s.root}>
        <EventHeader/>
        <div style={s.card}>
          <div style={s.label}>Enter event PIN</div>
          <div style={s.hint}>Your 4-digit PIN is printed on your invitation.</div>
          <div style={{display:'flex', justifyContent:'center', gap:12, marginBottom:24}}>
            {pin.map((v,i) => (
              <div key={i} style={{
                width:60, height:70, borderRadius:14,
                border:`2px solid ${v ? acc : '#e0dbd4'}`,
                background: v ? SAGE_PALE : CREAM,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:28, fontWeight:600, color:CHARCOAL,
                transition:'all 0.15s'
              }}>
                {v ? '●' : ''}
              </div>
            ))}
          </div>
          {/* Num pad */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
            {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k,i) => (
              <button key={i} style={{
                padding:'18px 0', borderRadius:12,
                background: k==='' ? 'transparent' : 'white', cursor: k==='' ? 'default' : 'pointer',
                fontFamily:sans, fontSize:22, fontWeight:400, color:CHARCOAL,
                boxShadow: k!=='' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                border: k!=='' ? `1px solid ${BORDER}` : 'none',
              }}>
                {k}
              </button>
            ))}
          </div>
        </div>
        <div style={{margin:'0 20px 32px'}}>
          <button style={s.btnPrimary}>Continue →</button>
        </div>
      </div>
    );
  }

  // ── Search Screen ─────────────────────────────────────────────────────────
  function SearchScreen() {
    return (
      <div style={s.root}>
        <EventHeader/>
        <div style={s.card}>
          <div style={s.label}>Your name</div>
          <div style={s.hint}>Type your name as it appears on your invitation.</div>
          <div style={{position:'relative', marginBottom:0}}>
            <input
              style={{...s.input, borderColor: acc, boxShadow:`0 0 0 3px ${acc}22`, marginBottom:0}}
              defaultValue="Chen"
              readOnly
            />
            {/* Live match suggestions */}
            <div style={{
              border:`1.5px solid ${SAGE_LIGHT}`, borderTop:'none', borderRadius:'0 0 10px 10px',
              overflow:'hidden', marginBottom:14
            }}>
              <div style={{background:SAGE_PALE, padding:'7px 14px', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:acc}}>
                Select your name
              </div>
              {DEMO_MATCHES.map(g => (
                <div key={g.name} style={{display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:`1px solid #f5f3f0`, background:'white'}}>
                  <div style={{width:44, height:44, borderRadius:'50%', background:SAGE_PALE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:500, color:acc, flexShrink:0}}>
                    {initials(g.name)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:16, fontWeight:500, color:CHARCOAL}}>{g.name}</div>
                    <div style={{fontSize:13, color:MUTED, marginTop:2}}>Table {g.table}</div>
                  </div>
                  <button style={{padding:'10px 16px', background:acc, border:'none', borderRadius:10, fontFamily:sans, fontSize:14, fontWeight:500, color:'white', cursor:'pointer', flexShrink:0}}>
                    That's me
                  </button>
                </div>
              ))}
              <div style={{padding:'12px 16px', background:'#faf9f7'}}>
                <button style={{background:'none', border:'none', fontFamily:sans, fontSize:14, color:MUTED, cursor:'pointer', padding:0}}>
                  None of these — try again
                </button>
              </div>
            </div>
          </div>
        </div>
        <div style={{margin:'0 20px 32px'}}>
          <button style={s.btnPrimary}>Find my seat →</button>
        </div>
      </div>
    );
  }

  // ── Confirm Screen ────────────────────────────────────────────────────────
  function ConfirmScreen() {
    const g = DEMO_GUEST;
    const tablemates = MOCK_GUESTS.filter(m => m.table === g.table && m.name !== g.name);
    return (
      <div style={s.root}>
        <EventHeader/>
        {/* Identity card */}
        <div style={{...s.card, textAlign:'center'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:SAGE_PALE, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:24, fontWeight:500, color:acc}}>
            {initials(g.name)}
          </div>
          <div style={{fontFamily:serif, fontSize:30, fontWeight:400, color:CHARCOAL, marginBottom:4}}>{g.name}</div>
          <div style={{fontSize:15, color:MUTED, marginTop:10}}>Your seat is at</div>
          <div style={{fontFamily:serif, fontSize:52, fontWeight:500, color:CHARCOAL, lineHeight:1}}>Table {g.table}</div>
        </div>
        {/* Tablemates */}
        <div style={s.card}>
          <div style={{fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:MUTED, marginBottom:14}}>Your tablemates</div>
          {tablemates.slice(0,6).map(t => (
            <div key={t.name} style={{display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:`1px solid #f5f3f0`}}>
              <div style={{width:36, height:36, borderRadius:'50%', background:SAGE_PALE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, color:acc, flexShrink:0}}>
                {initials(t.name)}
              </div>
              <div style={{fontSize:15, color:CHARCOAL}}>{t.name}</div>
            </div>
          ))}
        </div>
        <div style={{margin:'0 20px 32px', display:'flex', flexDirection:'column', gap:12}}>
          <button style={s.btnSecondary}>← Not me, search again</button>
          <button style={s.btnPrimary}>Check me in ✓</button>
        </div>
      </div>
    );
  }

  // ── Success Screen ────────────────────────────────────────────────────────
  function SuccessScreen() {
    const g = DEMO_GUEST;
    return (
      <div style={{...s.root, alignItems:'center', justifyContent:'center'}}>
        <div style={{textAlign:'center', padding:'0 32px'}}>
          {/* Animated check */}
          <div style={{
            width:100, height:100, borderRadius:'50%', background:SAGE_PALE,
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 32px',
            boxShadow:`0 0 0 16px ${SAGE_PALE}80`
          }}>
            <svg width={48} height={48} viewBox="0 0 40 40" fill="none">
              <path d="M8 20L17 29L32 12" stroke={acc} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{fontFamily:serif, fontSize:36, fontWeight:400, color:CHARCOAL, marginBottom:10}}>
            You're checked in!
          </div>
          <div style={{fontSize:17, color:MUTED, lineHeight:1.7}}>
            Welcome, {g.name.split(' ')[0]}.<br/>Enjoy the celebration.
          </div>
          {/* Table badge */}
          <div style={{
            margin:'32px auto 0',
            background:'white', border:`1px solid ${BORDER}`,
            borderRadius:20, padding:'20px 32px', display:'inline-block',
            minWidth:200
          }}>
            <div style={{fontSize:14, color:MUTED, marginBottom:4}}>Your table</div>
            <div style={{fontFamily:serif, fontSize:60, fontWeight:500, color:CHARCOAL, lineHeight:1}}>{g.table}</div>
          </div>
        </div>
        <div style={{width:'100%', padding:'32px 20px 36px'}}>
          <button style={s.btnPrimary}>View your table →</button>
        </div>
      </div>
    );
  }

  // ── Table View Screen ─────────────────────────────────────────────────────
  function TableScreen() {
    const g = DEMO_GUEST;
    const tablemates = MOCK_GUESTS.filter(m => m.table === g.table && m.name !== g.name);
    // SVG viewBox is 580×860, but we only care about the table area (y:90 to y:820)
    // We'll crop to show just the ballroom interior with generous padding
    const VB = '0 80 580 790'; // cropped viewBox for better zoom

    return (
      <div style={s.root}>
        {/* Header */}
        <div style={{padding:'18px 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'white', borderBottom:`1px solid ${BORDER}`, flexShrink:0}}>
          <div style={{fontFamily:serif, fontSize:22, fontWeight:400, color:CHARCOAL}}>Your Table</div>
          <div style={{fontFamily:serif, fontSize:15, color:MUTED, fontStyle:'italic'}}>Table {g.table}</div>
        </div>

        {/* Large floor plan */}
        <div style={{margin:'16px 16px 0', background:'white', border:`1px solid ${BORDER}`, borderRadius:16, overflow:'hidden', flexShrink:0}}>
          <div style={{padding:'9px 16px', background:'#faf9f7', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{fontSize:12, letterSpacing:'0.12em', textTransform:'uppercase', color:MUTED, fontFamily:sans}}>Grand Ballroom — your table is highlighted</div>
          </div>
          <svg viewBox={VB} width="100%" style={{display:'block'}}>
            {/* Room background */}
            <rect x={16} y={90} width={548} height={732} fill="#fafaf8" stroke="#c8c2b8" strokeWidth={2}/>
            {/* Stage */}
            <rect x={190} y={96} width={200} height={38} rx={4} fill="#d4cfc8" stroke="#b0aa9f" strokeWidth={1}/>
            <text x={290} y={120} textAnchor="middle" fontFamily={sans} fontSize={16} fontWeight={500} fill="#6a6560">STAGE</text>
            {/* Dance floor */}
            <rect x={160} y={775} width={260} height={70} rx={4} fill="none" stroke="#c8c2b8" strokeWidth={1.5} strokeDasharray="6,4"/>
            <text x={290} y={814} textAnchor="middle" fontFamily={sans} fontSize={13} fill="#b8b2a8">dance floor</text>

            {/* All tables */}
            {TABLES_META.map(t => {
              const isHi = t.id === g.table;
              const fill = isHi ? acc : t.type==='vip' ? '#e8b84b' : '#4db8a0';
              const r = isHi ? 32 : 26;
              return (
                <g key={t.id}>
                  {/* Chair dots for highlighted table */}
                  {isHi && Array.from({length:8}).map((_,i) => {
                    const angle = (i/8)*2*Math.PI - Math.PI/2;
                    return <circle key={i} cx={t.cx + 44*Math.cos(angle)} cy={t.cy + 44*Math.sin(angle)} r={5} fill={acc} opacity={0.3}/>;
                  })}
                  {/* Pulse ring for highlighted */}
                  {isHi && <circle cx={t.cx} cy={t.cy} r={48} fill="none" stroke={acc} strokeWidth={2} opacity={0.2}/>}
                  {isHi && <circle cx={t.cx} cy={t.cy} r={38} fill={acc} opacity={0.12}/>}
                  {/* Table circle */}
                  <circle cx={t.cx} cy={t.cy} r={r}
                    fill={fill}
                    opacity={isHi ? 1 : 0.45}
                    stroke={isHi ? 'rgba(255,255,255,0.6)' : 'none'}
                    strokeWidth={2}
                  />
                  {/* Table number — larger and always visible */}
                  <text x={t.cx} y={t.id==='VIP 1' ? t.cy-3 : t.cy}
                    textAnchor="middle" dominantBaseline={t.id==='VIP 1' ? 'auto' : 'central'}
                    fontFamily={sans} fontSize={isHi ? 20 : 15} fontWeight={isHi ? 700 : 500}
                    fill={isHi ? 'white' : 'rgba(255,255,255,0.9)'}
                  >
                    {t.id==='VIP 1' ? 'VIP' : t.id}
                  </text>
                  {t.id==='VIP 1' && <text x={t.cx} y={t.cy+14} textAnchor="middle" fontFamily={sans} fontSize={isHi?14:11} fontWeight={500} fill="rgba(255,255,255,0.9)">1</text>}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Guest identity + tablemates */}
        <div style={{...s.card, marginTop:16}}>
          {/* Self */}
          <div style={{display:'flex', alignItems:'center', gap:14, paddingBottom:16, borderBottom:`1px solid #f5f3f0`, marginBottom:16}}>
            <div style={{width:50, height:50, borderRadius:'50%', background:SAGE_PALE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:500, color:acc, flexShrink:0}}>
              {initials(g.name)}
            </div>
            <div>
              <div style={{fontSize:17, fontWeight:500, color:CHARCOAL}}>{g.name}</div>
              <div style={{fontSize:13, color:acc, marginTop:3, display:'flex', alignItems:'center', gap:5}}>
                <svg width={13} height={13} viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke={acc} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                Checked in
              </div>
            </div>
          </div>
          {/* Tablemates */}
          <div style={{fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:MUTED, marginBottom:12}}>Tablemates</div>
          {tablemates.map(t => (
            <div key={t.name} style={{display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:`1px solid #f5f3f0`}}>
              <div style={{width:34, height:34, borderRadius:'50%', background:'#f0ede8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, color:MUTED, flexShrink:0}}>
                {initials(t.name)}
              </div>
              <div style={{fontSize:15, color:CHARCOAL}}>{t.name}</div>
            </div>
          ))}
        </div>

        {/* Undo */}
        <div style={{margin:'0 20px 36px'}}>
          <button style={{...s.btnGhost, width:'100%', color:'#c0392b', borderColor:'#f5c0b8', background:'#fdf5f4', fontSize:15}}>
            Checked in by mistake?
          </button>
        </div>
      </div>
    );
  }

  switch (screen) {
    case 'pin':     return <PinScreen/>;
    case 'search':  return <SearchScreen/>;
    case 'confirm': return <ConfirmScreen/>;
    case 'success': return <SuccessScreen/>;
    case 'table':   return <TableScreen/>;
    default:        return <PinScreen/>;
  }
}

Object.assign(window, { GuestCheckin });

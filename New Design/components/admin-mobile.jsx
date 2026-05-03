
// ─── Admin Mobile View ────────────────────────────────────────────────────────
// Tab-based: Overview (stats + mini floor plan) | Guests (searchable list) | Scan

function AdminMobile({ tweaks = {}, initialTab = 'overview', initialSearch = '' }) {
  const acc = tweaks.accentColor || SAGE;
  const gold = tweaks.goldColor || GOLD;
  const serif = tweaks.fontSerif || 'Cormorant Garamond';
  const sans = tweaks.fontSans || 'DM Sans';

  const [tab, setTab] = React.useState(initialTab);
  const [search, setSearch] = React.useState(initialSearch);
  const [arrived, setArrived] = React.useState(new Set(MOCK_ARRIVED));
  const [pending, setPending] = React.useState(new Set());
  const [selectedTable, setSelectedTable] = React.useState(null);
  const [showMissing, setShowMissing] = React.useState(false);

  const guestsByTable = React.useMemo(() => {
    const m = {};
    MOCK_GUESTS.forEach(g => { if (!m[g.table]) m[g.table] = []; m[g.table].push(g); });
    return m;
  }, []);

  const total = MOCK_GUESTS.length;
  const totalArrived = arrived.size;
  const pct = Math.round((totalArrived / total) * 100);
  const missing = total - totalArrived;

  function toggleArrived(key) {
    setArrived(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    setPending(prev => { const n = new Set(prev); n.delete(key); return n; });
  }
  function togglePending(key) {
    setPending(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }
  function confirmPending() {
    const checkedIn = [...pending].filter(k => arrived.has(k));
    const notIn = [...pending].filter(k => !arrived.has(k));
    setArrived(prev => {
      const n = new Set(prev);
      if (notIn.length > 0) notIn.forEach(k => n.add(k));
      else checkedIn.forEach(k => n.delete(k));
      return n;
    });
    setPending(new Set());
  }

  const pendingArr = [...pending];
  const pendingCheckedIn = pendingArr.filter(k => arrived.has(k));
  const pendingNotIn = pendingArr.filter(k => !arrived.has(k));
  const isMixed = pendingCheckedIn.length > 0 && pendingNotIn.length > 0;
  const isDeregister = pendingArr.length > 0 && pendingCheckedIn.length === pendingArr.length;

  const visibleGuests = React.useMemo(() => {
    let list = MOCK_GUESTS;
    if (selectedTable) list = list.filter(g => g.table === selectedTable);
    else if (search.length >= 2) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    if (showMissing) list = list.filter(g => !arrived.has(g.table + '|' + g.name));
    return list;
  }, [selectedTable, search, arrived, showMissing]);

  const grouped = !selectedTable && search.length < 2;
  const tableGroups = React.useMemo(() => {
    if (!grouped) return null;
    const m = {};
    visibleGuests.forEach(g => { if (!m[g.table]) m[g.table] = []; m[g.table].push(g); });
    return Object.entries(m).sort(([a],[b]) => {
      if (a==='VIP 1') return -1; if (b==='VIP 1') return 1;
      return parseInt(a) - parseInt(b);
    });
  }, [visibleGuests, grouped]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    root: { width:'100%', height:'100%', background:CREAM, display:'flex', flexDirection:'column', fontFamily:sans, position:'relative', overflow:'hidden' },
    // Header
    header: { background:'white', borderBottom:`1px solid ${BORDER}`, padding:'12px 16px 10px', flexShrink:0 },
    brand: { fontFamily:serif, fontSize:20, fontWeight:400, color:CHARCOAL },
    brandAcc: { color:gold, fontStyle:'italic' },
    subLine: { fontSize:13, color:MUTED, marginTop:1 },
    statRow: { display:'flex', gap:8, marginTop:10 },
    statCard: (hi) => ({ flex:1, background: hi ? acc : '#f5f3f0', borderRadius:10, padding:'10px 12px', border:`1px solid ${hi ? acc+'33' : BORDER}` }),
    statNum: (hi) => ({ fontSize:26, fontWeight:600, color: hi ? 'white' : CHARCOAL, fontFamily:serif, lineHeight:1 }),
    statLabel: (hi) => ({ fontSize:12, color: hi ? 'rgba(255,255,255,0.75)' : MUTED, marginTop:4, letterSpacing:'0.04em' }),
    progressWrap: { marginTop:12 },
    progressBar: { height:4, background:'#e8e4de', borderRadius:2, overflow:'hidden' },
    progressFill: { height:'100%', background:acc, borderRadius:2, transition:'width 0.4s' },
    progressLabel: { display:'flex', justifyContent:'space-between', fontSize:10, color:MUTED, marginTop:4 },
    // Tab bar
    tabBar: { display:'flex', background:'white', borderBottom:`1px solid ${BORDER}`, flexShrink:0 },
    tabItem: (active) => ({ flex:1, padding:'12px 4px 11px', textAlign:'center', fontSize:13, fontWeight: active ? 600 : 400, color: active ? acc : MUTED, borderBottom: active ? `2px solid ${acc}` : '2px solid transparent', cursor:'pointer', transition:'all 0.15s', background:'none', border:'none', borderBottomWidth:2, borderBottomStyle:'solid', borderBottomColor: active ? acc : 'transparent', fontFamily:sans }),
    // Tab icons
    tabContent: { flex:1, overflowY:'auto', position:'relative' },
    // Overview
    sectionHead: { padding:'14px 16px 6px', fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:MUTED },
    tableGrid: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, padding:'0 16px 16px' },
    tableCard: (pct, isSelected) => ({
      borderRadius:10, padding:'10px 8px', textAlign:'center', cursor:'pointer',
      background: isSelected ? acc : 'white',
      border: isSelected ? `1.5px solid ${acc}` : `1px solid ${BORDER}`,
      transition:'all 0.15s',
    }),
    tableCardId: (isSelected) => ({ fontFamily:serif, fontSize:18, fontWeight:500, color: isSelected ? 'white' : CHARCOAL }),
    tableCardPct: (isSelected) => ({ fontSize:11, color: isSelected ? 'rgba(255,255,255,0.8)' : MUTED, marginTop:2 }),
    tableCardBar: { height:3, borderRadius:2, background:'#e8e4de', marginTop:6, overflow:'hidden' },
    tableCardFill: (pct, isSelected) => ({ width:`${pct}%`, height:'100%', background: isSelected ? 'rgba(255,255,255,0.6)' : acc, borderRadius:2 }),
    // Guest list tab
    actionBar: (mode) => ({
      display:'flex', alignItems:'center', padding:'8px 16px', gap:8, flexShrink:0,
      background: mode==='deregister' ? '#c0392b' : mode==='mixed' ? '#888780' : acc,
    }),
    searchWrap: { padding:'10px 16px', borderBottom:`1px solid #f0ede8`, background:'white', flexShrink:0 },
    searchInput: { width:'100%', padding:'11px 14px 11px 40px', fontFamily:sans, fontSize:15, border:`1.5px solid #e0dbd4`, borderRadius:8, background:CREAM, color:CHARCOAL, outline:'none' },
    filterRow: { display:'flex', gap:6, padding:'8px 16px', background:'white', borderBottom:`1px solid #f0ede8`, overflowX:'auto', flexShrink:0 },
    chip: (active) => ({ padding:'7px 14px', borderRadius:20, fontSize:13, fontWeight:500, border:`1px solid ${active ? acc : BORDER}`, background: active ? acc : 'white', color: active ? 'white' : MUTED, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }),
    sectionLabel: { padding:'8px 16px 5px', fontSize:12, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:MUTED, background:'#faf9f7', borderBottom:`1px solid #f0ede8` },
    guestRow: (isArrived) => ({ display:'flex', alignItems:'center', padding:'13px 16px', gap:12, background: isArrived ? '#fafcfa' : 'white', borderBottom:`1px solid #f5f3f0` }),
    avatar: (isVip) => ({ width:40, height:40, borderRadius:'50%', background: isVip ? GOLD_LIGHT : SAGE_PALE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:500, color: isVip ? GOLD : acc, flexShrink:0 }),
    guestInfo: { flex:1 },
    guestName: { fontSize:16, color:CHARCOAL, fontWeight:400 },
    guestMeta: { fontSize:13, color:MUTED, marginTop:2 },
    checkBtn: (isArrived) => ({
      width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0,
      background: isArrived ? SAGE_PALE : '#f5f3f0',
      border: isArrived ? `1.5px solid ${SAGE_LIGHT}` : `1.5px solid #e0dbd4`,
      transition:'all 0.15s'
    }),
    // Bottom nav
    bottomNav: { display:'flex', background:'white', borderTop:`1px solid ${BORDER}`, flexShrink:0, paddingBottom:0 },
    navItem: (active) => ({ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'10px 4px 10px', cursor:'pointer', gap:3, background:'none', border:'none', fontFamily:sans }),
    navIcon: (active) => ({ color: active ? acc : '#bbb', transition:'color 0.15s' }),
    navLabel: (active) => ({ fontSize:10, color: active ? acc : '#bbb', fontWeight: active ? 600 : 400 }),
  };

  // ── Overview tab ─────────────────────────────────────────────────────────
  function OverviewTab() {
    return (
      <div style={{flex:1, overflowY:'auto'}}>
        <div style={s.sectionHead}>Attendance</div>
        <div style={{padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:8}}>
          {/* Big stat row */}
          <div style={{display:'flex', gap:8}}>
            <div style={s.statCard(true)}>
              <div style={s.statNum(true)}>{totalArrived}</div>
              <div style={s.statLabel(true)}>Arrived</div>
            </div>
            <div style={s.statCard(false)}>
              <div style={s.statNum(false)}>{missing}</div>
              <div style={s.statLabel(false)}>Expected</div>
            </div>
            <div style={s.statCard(false)}>
              <div style={s.statNum(false)}>{pct}%</div>
              <div style={s.statLabel(false)}>Attendance</div>
            </div>
          </div>
          {/* Progress */}
          <div style={{background:'white', border:`1px solid ${BORDER}`, borderRadius:10, padding:'12px 14px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
              <span style={{fontSize:12, color:CHARCOAL, fontWeight:500}}>Check-in progress</span>
              <span style={{fontSize:11, color:MUTED}}>{totalArrived} of {total}</span>
            </div>
            <div style={s.progressBar}><div style={{...s.progressFill, width:`${pct}%`}}/></div>
          </div>
        </div>

        <div style={s.sectionHead}>Tables</div>
        <div style={s.tableGrid}>
          {TABLES_META.map(t => {
            const guests = guestsByTable[t.id] || [];
            const arr = guests.filter(g => arrived.has(g.table+'|'+g.name)).length;
            const tablePct = guests.length ? Math.round(arr/guests.length*100) : 0;
            const isSelected = selectedTable === t.id;
            return (
              <div key={t.id} style={s.tableCard(tablePct, isSelected)}
                onClick={() => { setSelectedTable(selectedTable===t.id ? null : t.id); setTab('guests'); }}>
                <div style={s.tableCardId(isSelected)}>{t.id==='VIP 1' ? 'VIP' : t.id}</div>
                <div style={s.tableCardPct(isSelected)}>{arr}/{guests.length}</div>
                <div style={s.tableCardBar}><div style={s.tableCardFill(tablePct, isSelected)}/></div>
              </div>
            );
          })}
        </div>

        <div style={s.sectionHead}>Quick Actions</div>
        <div style={{padding:'0 16px 24px', display:'flex', flexDirection:'column', gap:8}}>
          <button onClick={() => { setShowMissing(true); setTab('guests'); }} style={{padding:'12px 16px', background:'white', border:`1px solid ${BORDER}`, borderRadius:10, fontFamily:sans, fontSize:13, fontWeight:500, color:CHARCOAL, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span>View missing guests</span>
            <span style={{color:MUTED, fontSize:11}}>{missing} remaining →</span>
          </button>
          <button style={{padding:'12px 16px', background:'white', border:`1px solid ${BORDER}`, borderRadius:10, fontFamily:sans, fontSize:13, fontWeight:500, color:CHARCOAL, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <span>Export attendance CSV</span>
            <span style={{color:MUTED}}>↓</span>
          </button>
          <button style={{padding:'12px 16px', background:'white', border:`1px solid ${BORDER}`, borderRadius:10, fontFamily:sans, fontSize:13, fontWeight:500, color:'#c0392b', cursor:'pointer', textAlign:'left'}}>
            Reset all check-ins
          </button>
        </div>
      </div>
    );
  }

  // ── Guest list tab ────────────────────────────────────────────────────────
  function GuestTab() {
    return (
      <>
        {/* Bulk action bar */}
        {pending.size > 0 && (
          <div style={s.actionBar(isMixed ? 'mixed' : isDeregister ? 'deregister' : 'checkin')}>
            <div style={{fontSize:13, fontWeight:500, color:'white', flex:1}}>
              {isMixed ? 'Mixed — cannot action' : isDeregister ? `De-register ${pending.size}` : `Check in ${pending.size}`}
            </div>
            <button onClick={() => setPending(new Set())} style={{fontSize:12, color:'rgba(255,255,255,0.75)', background:'none', border:'none', cursor:'pointer', fontFamily:sans}}>Cancel</button>
            {!isMixed && <button onClick={confirmPending} style={{fontSize:12, fontWeight:600, color:acc, background:'white', border:'none', borderRadius:6, padding:'5px 12px', cursor:'pointer', fontFamily:sans}}>{isDeregister ? 'Remove' : 'Check in'}</button>}
          </div>
        )}

        {/* Search */}
        <div style={s.searchWrap}>
          <div style={{position:'relative'}}>
            <svg style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none'}} width={16} height={16} viewBox="0 0 16 16" fill="none">
              <circle cx={7} cy={7} r={5.5} stroke="#bbb" strokeWidth={1.5}/>
              <path d="M11 11L14 14" stroke="#bbb" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
            <input style={s.searchInput} placeholder="Search guest name…" value={search}
              onChange={e => { setSearch(e.target.value); setSelectedTable(null); }}/>
          </div>
        </div>

        {/* Filter chips */}
        <div style={s.filterRow}>
          <div style={s.chip(!showMissing && !selectedTable)} onClick={() => { setShowMissing(false); setSelectedTable(null); }}>All</div>
          <div style={s.chip(showMissing)} onClick={() => { setShowMissing(m=>!m); setSelectedTable(null); }}>Missing ({missing})</div>
          {selectedTable && <div style={s.chip(true)} onClick={() => setSelectedTable(null)}>Table {selectedTable} ×</div>}
        </div>

        {/* List */}
        <div style={{flex:1, overflowY:'auto'}}>
          {visibleGuests.length === 0 ? (
            <div style={{textAlign:'center', padding:'40px 20px', color:MUTED, fontSize:13}}>
              {showMissing ? 'Everyone has checked in! 🎉' : 'No guests found'}
            </div>
          ) : grouped ? (
            tableGroups.map(([tbl, guests]) => {
              const all = guestsByTable[tbl]||[];
              const arr = all.filter(g => arrived.has(g.table+'|'+g.name)).length;
              return (
                <React.Fragment key={tbl}>
                  <div style={s.sectionLabel}>
                    {showMissing ? `Table ${tbl} · ${guests.length} missing` : `Table ${tbl} · ${arr}/${all.length} checked in`}
                  </div>
                  {guests.map(g => <MobileGuestRow key={g.name} g={g}/>)}
                </React.Fragment>
              );
            })
          ) : (
            visibleGuests.map(g => <MobileGuestRow key={g.name} g={g}/>)
          )}
        </div>
      </>
    );
  }

  function MobileGuestRow({ g }) {
    const key = g.table+'|'+g.name;
    const isArrived = arrived.has(key);
    const isPending = pending.has(key);
    const isVip = g.table==='VIP 1';
    return (
      <div style={s.guestRow(isArrived)} onClick={() => togglePending(key)}>
        <div style={{...s.selectBox ? undefined : {}, width:18, height:18, borderRadius:4, border: isPending ? `1.5px solid ${acc}` : `1.5px solid #d0cbc4`, background: isPending ? acc : 'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s'}}>
          {isPending && <svg viewBox="0 0 10 10" fill="none" width={10} height={10}><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div style={s.avatar(isVip)}>{initials(g.name)}</div>
        <div style={s.guestInfo}>
          <div style={s.guestName}>{g.name}</div>
          <div style={s.guestMeta}>Table {g.table}{isVip ? ' · VIP' : ''}</div>
        </div>
        <div style={s.checkBtn(isArrived)} onClick={e => { e.stopPropagation(); toggleArrived(key); }}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 5" stroke={isArrived ? acc : '#ccc'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
  }

  // ── QR Code tab ───────────────────────────────────────────────────────────
  function QRTab() {
    const [copied, setCopied] = React.useState(false);
    const checkinUrl = 'https://wedding2026.web.app?checkin=1';

    // QR code as a clean SVG grid — encodes a representative pattern
    // (visual placeholder matching real QR proportions)
    const S = 21; // modules
    // Minimal representative QR pattern (finder + timing + some data modules)
    const modules = React.useMemo(() => {
      const grid = Array.from({length:S}, () => Array(S).fill(0));
      // Finder pattern top-left
      [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[1,0],[1,6],[2,0],[2,2],[2,3],[2,4],[2,6],[3,0],[3,2],[3,3],[3,4],[3,6],[4,0],[4,2],[4,3],[4,4],[4,6],[5,0],[5,6],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6]].forEach(([r,c])=>grid[r][c]=1);
      // Finder pattern top-right
      [[0,14],[0,15],[0,16],[0,17],[0,18],[0,19],[0,20],[1,14],[1,20],[2,14],[2,16],[2,17],[2,18],[2,20],[3,14],[3,16],[3,17],[3,18],[3,20],[4,14],[4,16],[4,17],[4,18],[4,20],[5,14],[5,20],[6,14],[6,15],[6,16],[6,17],[6,18],[6,19],[6,20]].forEach(([r,c])=>grid[r][c]=1);
      // Finder pattern bottom-left
      [[14,0],[14,1],[14,2],[14,3],[14,4],[14,5],[14,6],[15,0],[15,6],[16,0],[16,2],[16,3],[16,4],[16,6],[17,0],[17,2],[17,3],[17,4],[17,6],[18,0],[18,2],[18,3],[18,4],[18,6],[19,0],[19,6],[20,0],[20,1],[20,2],[20,3],[20,4],[20,5],[20,6]].forEach(([r,c])=>grid[r][c]=1);
      // Timing patterns
      for(let i=8;i<13;i++){if(i%2===0){grid[6][i]=1;grid[i][6]=1;}}
      // Some data modules (decorative)
      [[8,8],[8,9],[8,13],[8,14],[9,8],[9,11],[9,13],[10,9],[10,10],[10,12],[10,14],[11,8],[11,11],[11,12],[12,9],[12,13],[12,14],[13,8],[13,10],[13,11],[13,12],[14,9],[14,11],[15,8],[15,9],[15,11],[15,13],[16,9],[16,11],[16,13],[17,9],[17,10],[17,12],[17,14],[18,8],[18,10],[18,12],[18,14],[19,8],[19,9],[19,11],[19,12],[20,8],[20,9],[20,11],[20,13],[8,14],[9,14],[10,13],[11,14],[12,13]].forEach(([r,c])=>{if(r<S&&c<S)grid[r][c]=1;});
      return grid;
    }, []);

    const cell = 11; // px per module
    const qrSize = S * cell;
    const pad = 16;
    const total = qrSize + pad * 2;

    return (
      <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 20px 36px', gap:20}}>

        {/* Title */}
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:serif, fontSize:24, fontWeight:400, color:CHARCOAL, marginBottom:6}}>Guest Check-in QR</div>
          <div style={{fontSize:14, color:MUTED, lineHeight:1.6, maxWidth:300}}>
            Show this code to guests so they can scan it and check themselves in.
          </div>
        </div>

        {/* QR card */}
        <div style={{background:'white', border:`1px solid ${BORDER}`, borderRadius:20, padding:24, display:'flex', flexDirection:'column', alignItems:'center', gap:0, boxShadow:'0 4px 24px rgba(0,0,0,0.07)', width:'100%', maxWidth:340}}>
          {/* Event label above QR */}
          <div style={{fontFamily:serif, fontSize:13, letterSpacing:'0.12em', color:MUTED, marginBottom:16, textTransform:'uppercase'}}>Tristan &amp; Regina · 2026</div>

          {/* QR code SVG */}
          <div style={{background:'white', padding:pad, borderRadius:12, border:`1px solid #f0ede8`}}>
            <svg width={qrSize} height={qrSize} viewBox={`0 0 ${qrSize} ${qrSize}`} style={{display:'block'}}>
              {modules.map((row, r) =>
                row.map((val, c) =>
                  val ? <rect key={`${r}-${c}`} x={c*cell} y={r*cell} width={cell} height={cell} fill={CHARCOAL} rx={r<7&&c<7||r<7&&c>13||r>13&&c<7 ? 1.5 : 0.5}/> : null
                )
              )}
              {/* Centre logo mark */}
              <rect x={qrSize/2-18} y={qrSize/2-18} width={36} height={36} rx={6} fill="white"/>
              <rect x={qrSize/2-14} y={qrSize/2-14} width={28} height={28} rx={5} fill={acc}/>
              <text x={qrSize/2} y={qrSize/2+1} textAnchor="middle" dominantBaseline="central" fontFamily={serif} fontSize={14} fontWeight={600} fill="white">T&amp;R</text>
            </svg>
          </div>

          {/* URL below QR */}
          <div style={{marginTop:16, padding:'10px 16px', background:SAGE_PALE, borderRadius:10, width:'100%', textAlign:'center'}}>
            <div style={{fontSize:11, color:MUTED, marginBottom:3, letterSpacing:'0.06em', textTransform:'uppercase'}}>Check-in link</div>
            <div style={{fontFamily:'monospace', fontSize:12, color:CHARCOAL, wordBreak:'break-all'}}>{checkinUrl}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:340}}>
          <button
            onClick={() => { setCopied(true); setTimeout(()=>setCopied(false), 2000); }}
            style={{padding:'16px', background: copied ? SAGE_PALE : acc, border: copied ? `1.5px solid ${SAGE_LIGHT}` : 'none', borderRadius:14, fontFamily:sans, fontSize:16, fontWeight:500, color: copied ? acc : 'white', cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8}}>
            {copied
              ? <><svg width={18} height={18} viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 5" stroke={acc} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg> Copied!</>
              : 'Copy link'}
          </button>
          <button style={{padding:'14px', background:'white', border:`1.5px solid ${BORDER}`, borderRadius:14, fontFamily:sans, fontSize:15, fontWeight:500, color:CHARCOAL, cursor:'pointer'}}>
            Share link
          </button>
        </div>

        {/* Hint */}
        <div style={{fontSize:13, color:MUTED, lineHeight:1.7, textAlign:'center', maxWidth:300, padding:'0 8px'}}>
          Guests scan the QR code, enter the 4-digit event PIN, type their name, and check themselves in — no staff needed.
        </div>

      </div>
    );
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>
            <div style={s.brand}>Tristan <span style={s.brandAcc}>&</span> Regina</div>
            <div style={s.subLine}>Admin · 2 May 2026</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <div style={{width:36, height:36, borderRadius:10, background:SAGE_PALE, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none"><circle cx={8} cy={6} r={3} stroke={acc} strokeWidth={1.5}/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={acc} strokeWidth={1.5} strokeLinecap="round"/></svg>
            </div>
          </div>
        </div>
        {/* Inline stats */}
        <div style={s.statRow}>
          <div style={s.statCard(true)}>
            <div style={s.statNum(true)}>{totalArrived}</div>
            <div style={s.statLabel(true)}>Arrived</div>
          </div>
          <div style={s.statCard(false)}>
            <div style={s.statNum(false)}>{missing}</div>
            <div style={s.statLabel(false)}>Missing</div>
          </div>
          <div style={s.statCard(false)}>
            <div style={s.statNum(false)}>{pct}%</div>
            <div style={s.statLabel(false)}>Rate</div>
          </div>
        </div>
        {/* Progress */}
        <div style={s.progressWrap}>
          <div style={s.progressBar}><div style={{...s.progressFill, width:`${pct}%`}}/></div>
          <div style={s.progressLabel}>
            <span>0</span><span>{Math.floor(total/2)}</span><span>{total} guests</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={s.tabBar}>
        {[
          {id:'overview', label:'Overview', icon: <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><rect x={2} y={2} width={6} height={6} rx={1.5} stroke="currentColor" strokeWidth={1.5}/><rect x={10} y={2} width={6} height={6} rx={1.5} stroke="currentColor" strokeWidth={1.5}/><rect x={2} y={10} width={6} height={6} rx={1.5} stroke="currentColor" strokeWidth={1.5}/><rect x={10} y={10} width={6} height={6} rx={1.5} stroke="currentColor" strokeWidth={1.5}/></svg> },
          {id:'guests',   label:'Guests',   icon: <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><circle cx={9} cy={6} r={3} stroke="currentColor" strokeWidth={1.5}/><path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg> },
          {id:'qr',       label:'QR Code',  icon: <svg width={18} height={18} viewBox="0 0 18 18" fill="none"><rect x={2} y={2} width={6} height={6} rx={1} stroke="currentColor" strokeWidth={1.5}/><rect x={10} y={2} width={6} height={6} rx={1} stroke="currentColor" strokeWidth={1.5}/><rect x={2} y={10} width={6} height={6} rx={1} stroke="currentColor" strokeWidth={1.5}/><rect x={11} y={11} width={2} height={2} fill="currentColor"/><rect x={14} y={11} width={2} height={2} fill="currentColor"/><rect x={11} y={14} width={2} height={2} fill="currentColor"/><rect x={14} y={14} width={2} height={2} fill="currentColor"/></svg> },
        ].map(t => (
          <button key={t.id} style={s.tabItem(tab===t.id)} onClick={() => setTab(t.id)}>
            <div style={{...s.navIcon(tab===t.id), display:'flex', justifyContent:'center', marginBottom:2}}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {tab === 'overview' && <OverviewTab/>}
        {tab === 'guests'   && <GuestTab/>}
        {tab === 'qr'      && <QRTab/>}
      </div>
    </div>
  );
}

Object.assign(window, { AdminMobile });

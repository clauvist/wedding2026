
// ─── Admin Desktop View ───────────────────────────────────────────────────────
// Full dashboard: floor plan on left, guest list sidebar on right

function AdminDesktop({ tweaks = {} }) {
  const acc = tweaks.accentColor || SAGE;
  const gold = tweaks.goldColor || GOLD;
  const serif = tweaks.fontSerif || 'Cormorant Garamond';
  const sans = tweaks.fontSans || 'DM Sans';

  const [selectedTable, setSelectedTable] = React.useState(null);
  const [search, setSearch] = React.useState('');
  const [arrived, setArrived] = React.useState(new Set(MOCK_ARRIVED));
  const [pending, setPending] = React.useState(new Set());
  const [showMissing, setShowMissing] = React.useState(false);

  const guestsByTable = React.useMemo(() => {
    const m = {};
    MOCK_GUESTS.forEach(g => { if (!m[g.table]) m[g.table] = []; m[g.table].push(g); });
    return m;
  }, []);

  const totalArrived = arrived.size;
  const total = MOCK_GUESTS.length;

  // Filter guests for sidebar
  const visibleGuests = React.useMemo(() => {
    let list = MOCK_GUESTS;
    if (selectedTable) list = list.filter(g => g.table === selectedTable);
    else if (search.length >= 2) list = list.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
    if (showMissing) list = list.filter(g => !arrived.has(g.table + '|' + g.name));
    return list;
  }, [selectedTable, search, arrived, showMissing]);

  // Group by table when no filter
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

  function toggleArrived(key) {
    setArrived(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
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

  const ds = {
    root: { display:'flex', flexDirection:'column', width:'100%', height:'100%', background:'#f0ede8', fontFamily: sans },
    header: { background:'white', borderBottom:`1px solid ${BORDER}`, padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
    brand: { fontFamily: serif, fontSize:20, fontWeight:400, color:CHARCOAL, letterSpacing:'0.02em' },
    brandAccent: { color: gold, fontStyle:'italic' },
    hActions: { display:'flex', gap:8, alignItems:'center' },
    statPill: { fontSize:14, color:MUTED, padding:'6px 16px', background:SAGE_PALE, borderRadius:20, fontFamily:sans },
    statStrong: { color:CHARCOAL, fontWeight:600 },
    btn: { fontFamily:sans, fontSize:13, fontWeight:500, padding:'8px 16px', borderRadius:6, border:`1px solid #ddd`, background:'white', cursor:'pointer', color:CHARCOAL, transition:'all 0.15s', whiteSpace:'nowrap' },
    btnPrimary: { background: acc, color:'white', border:`1px solid ${acc}` },
    btnActive: { background: CHARCOAL, color:'white', border:`1px solid ${CHARCOAL}` },
    layout: { display:'flex', flex:1, overflow:'hidden' },
    // Floor plan
    canvasWrap: { flex:1, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:24 },
    // Sidebar
    sidebar: { width:320, flexShrink:0, background:'white', borderLeft:`1px solid ${BORDER}`, display:'flex', flexDirection:'column', overflow:'hidden' },
    sidebarHeader: { padding:'16px 20px 12px', borderBottom:`1px solid #f0ede8`, background:SAGE_PALE, flexShrink:0 },
    sidebarTitle: { fontFamily:serif, fontSize:22, fontWeight:400, color:CHARCOAL },
    sidebarSub: { fontSize:14, color:MUTED, marginTop:3 },
    actionBar: (mode) => ({
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'8px 16px', gap:10, flexShrink:0,
      background: mode==='deregister' ? '#c0392b' : mode==='mixed' ? '#888780' : acc,
      animation:'slideDown 0.18s ease'
    }),
    searchBox: { padding:'10px 16px', borderBottom:`1px solid #f0ede8`, flexShrink:0 },
    searchInput: { width:'100%', padding:'9px 14px', fontFamily:sans, fontSize:15, border:`1px solid #e0dbd4`, borderRadius:6, background:CREAM, color:CHARCOAL, outline:'none' },
    colHeader: { display:'flex', alignItems:'center', padding:'6px 20px', borderBottom:`1px solid #f0ede8`, background:'#faf9f7', flexShrink:0 },
    guestList: { flex:1, overflowY:'auto' },
    sectionLabel: { padding:'7px 20px 4px', fontSize:11, fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:MUTED, background:'#faf9f7', borderBottom:`1px solid #f0ede8`, marginTop:4 },
    guestItem: (isArrived) => ({ display:'flex', alignItems:'center', padding:'10px 20px', gap:10, background: isArrived ? '#fafcfa' : 'white', cursor:'default', borderBottom:`1px solid #faf9f7`, transition:'background 0.1s' }),
    selectBox: (state) => ({
      width:20, height:20, borderRadius:4, flexShrink:0,
      border: state==='pending' ? `1.5px solid ${acc}` : state==='pending-arrived' ? '1.5px solid #c0392b' : '1.5px solid #d0cbc4',
      background: state==='pending' ? acc : state==='pending-arrived' ? '#c0392b' : 'white',
      display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.15s'
    }),
    avatar: (isVip) => ({ width:34, height:34, borderRadius:'50%', background: isVip ? GOLD_LIGHT : SAGE_LIGHT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, color: isVip ? GOLD : acc, flexShrink:0, marginLeft:12 }),
    guestName: { fontSize:15, color:CHARCOAL, flex:1 },
    guestSeat: { fontSize:13, color:MUTED },
    checkCell: (isArrived) => ({ width:36, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', borderRadius:4, height:32, color: isArrived ? acc : 'transparent', transition:'color 0.15s' }),
    legend: { padding:'12px 20px', borderTop:`1px solid #f0ede8`, display:'flex', gap:16, alignItems:'center', flexShrink:0 },
    legendItem: { display:'flex', alignItems:'center', gap:5, fontSize:13, color:MUTED },
    legendDot: (c) => ({ width:12, height:12, borderRadius:'50%', background:c }),
  };

  const arrivedPct = Math.round((totalArrived / total) * 100);

  function sidebarTitle() {
    if (showMissing) return 'Missing Guests';
    if (selectedTable) return `Table ${selectedTable}`;
    return 'All Guests';
  }
  function sidebarSub() {
    if (showMissing) return `${visibleGuests.length} not yet checked in`;
    if (selectedTable) {
      const arr = (guestsByTable[selectedTable]||[]).filter(g => arrived.has(g.table+'|'+g.name)).length;
      return `${(guestsByTable[selectedTable]||[]).length} guests · ${arr} checked in`;
    }
    return 'Click a table to filter';
  }

  // Render floor plan SVG
  function FloorPlan() {
    const W=580, H=860;
    // Scale to fit
    const maxW = 580, maxH = 700;
    const scale = Math.min(maxW/W, maxH/H, 1);

    return (
      <div style={ds.canvasWrap}>
        <div style={{ position:'relative', width: W*scale, height: H*scale, flexShrink:0 }}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W*scale} height={H*scale} style={{ display:'block' }}>
            {/* Background */}
            <rect x={0} y={0} width={W} height={H} fill="#f0ede8"/>
            {/* Room */}
            <rect x={16} y={90} width={548} height={732} fill="white" stroke="#c8c2b8" strokeWidth={2} rx={2}/>
            {/* Stage */}
            <rect x={190} y={96} width={200} height={40} rx={4} fill="#d4cfc8" stroke="#b0aa9f" strokeWidth={1.5}/>
            <text x={290} y={120} textAnchor="middle" fontFamily={sans} fontSize={11} fontWeight={500} fill="#6a6560" letterSpacing="0.08em">STAGE</text>
            {/* Dance floor */}
            <rect x={160} y={775} width={260} height={80} rx={4} fill="none" stroke="#c8c2b8" strokeWidth={1.5} strokeDasharray="6,4"/>
            <text x={290} y={819} textAnchor="middle" fontFamily={sans} fontSize={10} fill="#b0aa9f">dance floor</text>
            {/* AV */}
            <rect x={18} y={140} width={6} height={20} rx={1} fill="#c8c2b8"/>
            <text x={30} y={154} fontFamily={sans} fontSize={10} fill={MUTED}>AV</text>

            {/* Tables */}
            {TABLES_META.map(t => {
              const isSelected = selectedTable === t.id;
              const guests = guestsByTable[t.id] || [];
              const arrivedCount = guests.filter(g => arrived.has(g.table+'|'+g.name)).length;
              const isEmpty = guests.length === 0;
              const fillColor = isEmpty ? '#b8ccd4' : t.type==='vip' ? '#e8b84b' : '#4db8a0';
              const nChairs = Math.max(8, guests.length);

              return (
                <g key={t.id} onClick={() => setSelectedTable(selectedTable===t.id ? null : t.id)} style={{cursor:'pointer'}}>
                  {/* Chair dots */}
                  {Array.from({length:nChairs}).map((_,i) => {
                    const angle = (i/nChairs)*2*Math.PI - Math.PI/2;
                    const r=38;
                    return <circle key={i} cx={t.cx + r*Math.cos(angle)} cy={t.cy + r*Math.sin(angle)} r={4}
                      fill={fillColor} opacity={0.35}/>;
                  })}
                  {/* Selection ring */}
                  {isSelected && <circle cx={t.cx} cy={t.cy} r={36} fill="none" stroke={gold} strokeWidth={2.5}/>}
                  {/* Table */}
                  <circle cx={t.cx} cy={t.cy} r={28}
                    fill={fillColor}
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth={2}
                    filter={isSelected ? 'drop-shadow(0 2px 8px rgba(0,0,0,0.25))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))'}
                  />
                  <text x={t.cx} y={t.id==='VIP 1' ? t.cy-5 : t.cy}
                    textAnchor="middle" dominantBaseline={t.id==='VIP 1' ? 'auto' : 'central'}
                    fontFamily={serif} fontSize={t.id==='VIP 1' ? 15 : 20} fontWeight={600} fill="white"
                    style={{textShadow:'0 1px 3px rgba(0,0,0,0.3)', pointerEvents:'none'}}>
                    {t.id==='VIP 1' ? 'VIP' : t.id}
                  </text>
                  {t.id==='VIP 1' && <text x={t.cx} y={t.cy+13} textAnchor="middle" fontFamily={serif} fontSize={13} fontWeight={600} fill="white" style={{pointerEvents:'none'}}>1</text>}
                  {/* Arrival ratio badge */}
                  {isSelected && guests.length > 0 && (
                    <g>
                      <rect x={t.cx-20} y={t.cy+32} width={40} height={16} rx={8} fill="white" stroke={gold} strokeWidth={1}/>
                      <text x={t.cx} y={t.cy+43} textAnchor="middle" fontFamily={sans} fontSize={9} fontWeight={600} fill={gold}>{arrivedCount}/{guests.length}</text>
                    </g>
                  )}
                </g>
              );
            })}
            {/* Room label */}
            <text x={290} y={78} textAnchor="middle" fontFamily={serif} fontSize={11} letterSpacing="0.15em" fill={MUTED}>GRAND BALLROOM</text>
          </svg>
        </div>
      </div>
    );
  }

  function GuestRow({ g }) {
    const key = g.table+'|'+g.name;
    const isArrived = arrived.has(key);
    const isPending = pending.has(key);
    const boxState = isPending ? (isArrived ? 'pending-arrived' : 'pending') : 'default';
    const isVip = g.table==='VIP 1';
    return (
      <div style={ds.guestItem(isArrived)}>
        <div style={ds.selectBox(boxState)} onClick={() => togglePending(key)}>
          {isPending && <svg viewBox="0 0 10 10" fill="none" width={10} height={10}><path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div style={ds.avatar(isVip)}>{initials(g.name)}</div>
        <div style={ds.guestName}>{g.name}</div>
        <div style={ds.guestSeat}>T{g.table}</div>
        <div style={ds.checkCell(isArrived)} onClick={() => toggleArrived(key)} title={isArrived ? 'Undo check-in' : 'Check in'}>
          <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
            <path d="M3 8.5L6.5 12L13 5" stroke={isArrived ? acc : '#ddd'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div style={ds.root}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}`}</style>
      {/* Header */}
      <header style={ds.header}>
        <div style={ds.brand}>Tristan <span style={ds.brandAccent}>&</span> Regina — 2026</div>
        <div style={ds.hActions}>
          <div style={ds.statPill}>
            <strong style={ds.statStrong}>{totalArrived}</strong> / {total} arrived &nbsp;·&nbsp; {arrivedPct}%
          </div>
          {/* Compact progress bar */}
          <div style={{width:80, height:6, background:'#e8e4de', borderRadius:3, overflow:'hidden'}}>
            <div style={{width:`${arrivedPct}%`, height:'100%', background:acc, borderRadius:3, transition:'width 0.4s'}}/>
          </div>
          <button style={{...ds.btn, ...(showMissing ? ds.btnActive : {})}} onClick={() => { setShowMissing(m=>!m); setSelectedTable(null); setSearch(''); }}>
            {showMissing ? 'Show All' : 'Missing'}
          </button>
          <button style={ds.btn}>QR Links</button>
          <button style={ds.btn}>Reset</button>
          <button style={{...ds.btn, ...ds.btnPrimary}}>Export CSV</button>
        </div>
      </header>

      <div style={ds.layout}>
        <FloorPlan />

        {/* Sidebar */}
        <div style={ds.sidebar}>
          <div style={ds.sidebarHeader}>
            <div style={ds.sidebarTitle}>{sidebarTitle()}</div>
            <div style={ds.sidebarSub}>{sidebarSub()}</div>
          </div>

          {/* Bulk action bar */}
          {pending.size > 0 && (
            <div style={ds.actionBar(isMixed ? 'mixed' : isDeregister ? 'deregister' : 'checkin')}>
              <div style={{fontSize:13, fontWeight:500, color:'white', flex:1}}>
                {isMixed ? 'Mixed selection — cannot action' : isDeregister ? `De-register ${pending.size}` : `Check in ${pending.size} guest${pending.size!==1?'s':''}`}
              </div>
              <button onClick={() => setPending(new Set())} style={{fontSize:12, color:'rgba(255,255,255,0.75)', background:'none', border:'none', cursor:'pointer', fontFamily:sans}}>Cancel</button>
              {!isMixed && (
                <button onClick={confirmPending} style={{fontSize:12, fontWeight:500, color:acc, background:'white', border:'none', borderRadius:6, padding:'5px 14px', cursor:'pointer', fontFamily:sans}}>
                  {isDeregister ? 'De-register' : 'Check in'}
                </button>
              )}
            </div>
          )}

          {/* Search */}
          <div style={ds.searchBox}>
            <input
              style={ds.searchInput}
              placeholder='Search name or table…'
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedTable(null); }}
            />
          </div>

          {/* Column header */}
          <div style={ds.colHeader}>
            <div style={{width:20, flexShrink:0, fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:MUTED}}>Sel</div>
            <div style={{flex:1, fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:MUTED, paddingLeft:22}}>Guest</div>
            <div style={{fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:MUTED, marginRight:4}}>Table</div>
            <div style={{width:36, textAlign:'center', fontSize:11, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:MUTED}}>In</div>
          </div>

          {/* Guest list */}
          <div style={ds.guestList}>
            {visibleGuests.length === 0 ? (
              <div style={{textAlign:'center', padding:'30px 20px', color:MUTED, fontSize:13}}>
                {showMissing ? 'Everyone has checked in! 🎉' : 'No guests found'}
              </div>
            ) : grouped ? (
              tableGroups.map(([tbl, guests]) => {
                const allInTable = guestsByTable[tbl] || [];
                const arrCount = allInTable.filter(g => arrived.has(g.table+'|'+g.name)).length;
                return (
                  <React.Fragment key={tbl}>
                    <div style={ds.sectionLabel}>
                      {showMissing
                        ? `Table ${tbl} · ${guests.length} missing`
                        : `Table ${tbl} · ${allInTable.length} guests · ${arrCount} checked in`}
                    </div>
                    {guests.map(g => <GuestRow key={g.name} g={g} />)}
                  </React.Fragment>
                );
              })
            ) : (
              visibleGuests.map(g => <GuestRow key={g.name} g={g} />)
            )}
          </div>

          {/* Legend */}
          <div style={ds.legend}>
            <div style={ds.legendItem}><div style={ds.legendDot('#4db8a0')}/> Regular</div>
            <div style={ds.legendItem}><div style={ds.legendDot('#e8b84b')}/> VIP</div>
            <div style={{...ds.legendItem, color:acc, fontWeight:500}}>✓ checked in</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminDesktop });

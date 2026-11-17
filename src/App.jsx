import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KEY, PROGRAMS, getProgram, seed, loadEntries, meanHours, sumHours, formatDate } from './data.js';

const HOURS = [1,2,3,4,5,6,7,8];
const CODES = Object.keys(PROGRAMS);

// Routes: "#/" = log hours (home), "#/dashboard", "#/programs/<CODE>"
const readRoute = () => {
  const h = window.location.hash;
  const p = h.match(/^#\/programs\/([^/?#]+)$/);
  if (p) return {page:'program', code:decodeURIComponent(p[1]).toUpperCase()};
  const ed = h.match(/^#\/entries\/([^/?#]+)\/edit$/);
  if (ed) return {page:'edit', id:decodeURIComponent(ed[1])};
  if (h === '#/dashboard') return {page:'dashboard'};
  if (h === '#/check' || h === '#/programs') return {page:'program', code:CODES[0]};
  return {page:'log'};
};
const go = hash => { window.location.hash = hash; };
const hoursLabel = n => `${n} ${n===1?'hour':'hours'}`;

function Kpi({label,value,hint}){return <div className="kpi"><span>{label}</span><b>{value}</b><i>{hint}</i></div>;}

function Dropdown({options,value,onChange,labelledBy}){
  const [open,setOpen] = useState(false);
  const [active,setActive] = useState(0);
  const ref = useRef(null);
  const idx = Math.max(0,options.findIndex(o=>o.value===value));
  const cur = options[idx];
  useEffect(()=>{
    if(!open)return;
    const away = e => {if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',away);
    return ()=>document.removeEventListener('mousedown',away);
  },[open]);
  const openMenu = () => {setActive(idx);setOpen(true);};
  const pick = o => {setOpen(false);if(o.value!==value)onChange(o.value);};
  const onKey = e => {
    if(e.key==='Escape'){setOpen(false);return;}
    if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(!open){openMenu();return;}setActive(a=>(a+(e.key==='ArrowDown'?1:-1)+options.length)%options.length);}
    else if((e.key==='Enter'||e.key===' ')&&open){e.preventDefault();pick(options[active]);}
    else if((e.key==='Enter'||e.key===' ')&&!open){e.preventDefault();openMenu();}
  };
  return <div className="dd" ref={ref}>
    <button type="button" className="dd-btn" aria-haspopup="listbox" aria-expanded={open} aria-labelledby={labelledBy} onClick={()=>open?setOpen(false):openMenu()} onKeyDown={onKey}>
      <span className="dd-cur"><b>{cur?.label}</b><small>{cur?.sub}</small></span><span className="dd-caret" aria-hidden="true">▾</span>
    </button>
    {open&&<ul className="dd-menu" role="listbox" aria-labelledby={labelledBy}>
      {options.map((o,i)=><li key={o.value} role="option" aria-selected={o.value===value} className={`${i===active?'active':''}${o.value===value?' sel':''}`} onMouseEnter={()=>setActive(i)} onMouseDown={e=>{e.preventDefault();pick(o);}}>
        <b>{o.label}</b><small>{o.sub}</small>{o.value===value&&<span className="dd-check" aria-hidden="true">✓</span>}
      </li>)}
    </ul>}
  </div>;
}

const RefreshIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>;

function EntryMeta({e}){return <>{e.name}{e.date?` · ${formatDate(e.date)}`:''}</>;}

export default function App(){
  const [entries,setEntries] = useState(loadEntries);
  const [route,setRoute] = useState(readRoute);
  const [toast,setToast] = useState('');
  // log form: {id|null, programCode, hours:number|null, reflection}
  const blank = (programCode='') => ({id:null, programCode, hours:1, reflection:''});
  const [form,setForm] = useState(blank());
  const [errors,setErrors] = useState({});
  // dashboard state
  const [query,setQuery] = useState('');
  const [hoursFilter,setHoursFilter] = useState(0); // 0 = any

  useEffect(()=>{
    const onHash = () => {setRoute(readRoute());window.scrollTo({top:0,behavior:'instant'});};
    window.addEventListener('hashchange',onHash);
    return ()=>window.removeEventListener('hashchange',onHash);
  },[]);
  useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(entries));},[entries]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4000);return ()=>clearTimeout(t);},[toast]);

  const mine = entries.filter(e=>e.owner==='you');
  const loggedByMe = new Set(mine.filter(e=>e.id!==form.id).map(e=>e.programCode.toUpperCase()));
  const statsFor = code => {const l=entries.filter(e=>e.programCode.toUpperCase()===code);return {count:l.length,avg:meanHours(l)};};

  const startEdit = e => go(`#/entries/${encodeURIComponent(e.id)}/edit`);
  const logFor = code => {setForm(blank(code));setErrors({});go('#/');};
  const cancelEdit = () => {setForm(blank());setErrors({});go('#/');};

  // Load the entry into the form when the edit page opens; clear it when leaving.
  const editing = route.page==='edit' ? entries.find(e=>e.id===route.id&&e.owner==='you') : null;
  useEffect(()=>{
    if(route.page==='edit'){
      if(!editing){go('#/');return;}
      if(form.id!==editing.id){setForm({id:editing.id,programCode:editing.programCode.toUpperCase(),hours:editing.hours,reflection:editing.reflection||''});setErrors({});}
    }else if(form.id){setForm(blank());setErrors({});}
  },[route.page,route.id,editing?.id]);

  const setHoursValue = h => {setForm(f=>f.hours===h?f:({...f,hours:h}));setErrors(x=>({...x,hours:undefined}));};

  function save(ev){
    ev.preventDefault();
    const next = {};
    if(!form.programCode) next.program = 'Choose the program you volunteered for.';
    else if(loggedByMe.has(form.programCode)) next.program = 'You have already logged hours for this program. Edit that entry instead.';
    if(!Number.isInteger(form.hours) || form.hours<1 || form.hours>8) next.hours = 'Pick how many hours you volunteered (1–8).';
    setErrors(next);
    if(Object.keys(next).length) return;
    const data = {programCode:form.programCode,hours:form.hours,reflection:form.reflection.trim(),name:'You',owner:'you',date:new Date().toISOString().slice(0,10)};
    if(form.id){setEntries(entries.map(e=>e.id===form.id?{...e,...data}:e));setToast(`Updated your hours for ${getProgram(data.programCode).name}.`);}
    else{setEntries([{...data,id:'e-'+Date.now()},...entries]);setToast(`Logged ${hoursLabel(data.hours)} for ${getProgram(data.programCode).name}.`);}
    if(route.page==='edit') go('#/'); else setForm(blank());
  }
  function restoreExamples(){
    if(!window.confirm('Replace all entries with the original example records? Entries you added or edited will be lost.'))return;
    setEntries(seed);setForm(blank());setQuery('');setHoursFilter(0);setToast('Example records restored.');
  }

  // Results update 300ms after the last change to the search box or slider.
  const [applied,setApplied] = useState({query:'',hours:0});
  useEffect(()=>{const t=setTimeout(()=>setApplied({query,hours:hoursFilter}),300);return ()=>clearTimeout(t);},[query,hoursFilter]);
  const shown = useMemo(()=>entries.filter(e=>(!applied.hours||e.hours===applied.hours)&&`${e.programCode} ${getProgram(e.programCode).name} ${e.reflection} ${e.name}`.toLowerCase().includes(applied.query.trim().toLowerCase())),[entries,applied]);
  const programsLogged = new Set(entries.map(e=>e.programCode.toUpperCase())).size;
  const spread = HOURS.map(h=>({h,count:entries.filter(e=>e.hours===h).length}));
  const peak = Math.max(...spread.map(s=>s.count),1);

  const EntryCard = ({e}) => (
    <article className="entry-card">
      <div className="entry-top">
        <a className="code-pill" href={`#/programs/${encodeURIComponent(e.programCode)}`} title={getProgram(e.programCode).name}>{e.programCode}</a>
        <b className="hours-badge">{hoursLabel(e.hours)}</b>
      </div>
      <p className="entry-note">{e.reflection||<span className="muted">No reflection written.</span>}</p>
      <footer><span><EntryMeta e={e}/></span>{e.owner==='you'&&<button className="link-btn" onClick={()=>startEdit(e)}>Edit</button>}</footer>
    </article>
  );

  const program = route.page==='program' ? getProgram(route.code) : null;
  const programEntries = route.page==='program' ? entries.filter(e=>e.programCode.toUpperCase()===route.code) : [];
  const navCls = p => route.page===p ? 'on' : '';

  return <div className="hub">
    <nav className="topbar">
      <div className="brand"><span className="brand-mark">◆</span>service<b>hub</b></div>
      <div className="tabs">
        <a href="#/dashboard" className={navCls('dashboard')}>Dashboard</a>
        <a href="#/" className={navCls('log')}>Log hours</a>
        <a href="#/check" className={navCls('program')}>Programs</a>
      </div>
      <span className="avatar" title="Signed in as You">Y</span>
    </nav>
    <main className="page">
      {toast&&<div className="toast" role="status"><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Dismiss">×</button></div>}

      {(route.page==='log'||(route.page==='edit'&&editing))&&<>
        {route.page==='edit'&&<a className="crumb" href="#/">‹ Back to Log hours</a>}
        <header className="welcome"><div><h1>{route.page==='edit'?'Edit your entry':'Log your volunteering hours'}</h1><p>{route.page==='edit'?`Update your hours or reflection for ${getProgram(editing.programCode).name}.`:'Choose the program, say how long you volunteered, and add a note for future volunteers.'}</p></div></header>
        <div className={route.page==='edit'?'log-layout single':'log-layout'}>
          <form className="card log-form" onSubmit={save} noValidate>
            <fieldset className="field">
              <legend>{route.page==='edit'?'Program':'1. Program'}</legend>
              {route.page==='edit'?<div className="program-option on fixed"><span className="po-main"><b>{getProgram(form.programCode).name}</b><small>{form.programCode} · {getProgram(form.programCode).partner}</small></span><span className="po-side"><b>{statsFor(form.programCode).avg}</b><small>avg hours · {statsFor(form.programCode).count} entries</small></span></div>:
              <div className="program-list" role="radiogroup" aria-label="Program">
                {CODES.map(code=>{
                  const p=PROGRAMS[code],s=statsFor(code),taken=loggedByMe.has(code),on=form.programCode===code;
                  return <label key={code} className={`program-option${on?' on':''}${taken?' taken':''}${form.id&&!on?' locked':''}`}>
                    <input type="radio" name="program" value={code} checked={on} disabled={taken||(form.id&&!on)} onChange={()=>{setForm(f=>({...f,programCode:code}));setErrors(x=>({...x,program:undefined}));}}/>
                    <span className="po-main"><b>{p.name}</b><small>{p.partner}</small></span>
                    <span className="po-side">{taken?<em>Already logged</em>:<><b>{s.avg}</b><small>avg hours · {s.count} {s.count===1?'entry':'entries'}</small></>}</span>
                    <a className="po-link" href={`#/programs/${code}`} onClick={e=>e.stopPropagation()}>Details &amp; reviews</a>
                  </label>;
                })}
              </div>}
              {errors.program&&<div className="problem" role="alert">{errors.program}</div>}
            </fieldset>

            <div className="form-row">
            <div className="field" role="group" aria-labelledby="hours-legend">
              <span className="legend" id="hours-legend">{route.page==='edit'?'Hours volunteered':'2. Hours volunteered'}</span>
              <div className="hour-slider">
                <output className={form.hours?'set':''} htmlFor="hours-range">{form.hours?hoursLabel(form.hours):'Slide to choose'}</output>
                <input id="hours-range" type="range" min="1" max="8" step="1" value={form.hours||1} aria-label="Hours volunteered" aria-valuetext={form.hours?hoursLabel(form.hours):'not chosen yet'}
                  className={form.hours?'':'untouched'}
                  onChange={e=>setHoursValue(Number(e.target.value))} onPointerUp={e=>setHoursValue(Number(e.target.value))} onKeyDown={e=>{if(!form.hours&&e.key.startsWith('Arrow'))setHoursValue(Number(e.target.value));}}/>
                <div className="ticks" aria-hidden="true">{HOURS.map(h=><span key={h}>{h}</span>)}</div>
                <small className="hint">Whole hours, from 1 to 8.</small>
              </div>
              {errors.hours&&<div className="problem" role="alert">{errors.hours}</div>}
            </div>

            <label className="field">
              <span className="legend">{route.page==='edit'?'Reflection':'3. Reflection'} <i>(optional)</i></span>
              <textarea rows={4} value={form.reflection} onChange={e=>setForm(f=>({...f,reflection:e.target.value}))} placeholder="What was it like? Any tips for the next volunteer?"/>
            </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary">{route.page==='edit'?'Save changes':'Save entry'}</button>
              {route.page==='edit'&&<button type="button" className="link-btn" onClick={cancelEdit}>Cancel</button>}
            </div>
          </form>

          {route.page==='log'&&<section className="card my-entries">
            <div className="card-head"><h2>Your entries</h2><span className="muted">{mine.length}</span></div>
            {mine.length?<ul className="mine-list">{mine.map(e=><li key={e.id}>
              <div><a href={`#/programs/${encodeURIComponent(e.programCode)}`}><b>{getProgram(e.programCode).name}</b></a><small>{e.programCode} · {formatDate(e.date)}</small></div>
              <span className="hours-badge">{hoursLabel(e.hours)}</span>
              <button className="link-btn" onClick={()=>startEdit(e)}>Edit</button>
            </li>)}</ul>:<p className="muted">You haven't logged any hours yet.</p>}
          </section>}
        </div>
      </>}

      {route.page==='dashboard'&&<>
        <header className="welcome"><div><h1>Dashboard</h1><p>How much time volunteers put in across the community service programs.</p></div><a className="primary cta" href="#/">Log your hours</a></header>
        <section className="kpis"><Kpi label="Entries" value={entries.length} hint="all time"/><Kpi label="Avg / entry" value={meanHours(entries)} hint="hours"/><Kpi label="Programs" value={programsLogged} hint="with activity"/></section>
        <div className="dash-grid single">
          <section className="card chart"><div className="card-head"><h2>Hours distribution</h2><span className="muted">Entries per number of hours</span></div>
            <div className="chart-body"><div className="columns">{spread.map(s=><div className="column" key={s.h} title={`${s.count} ${s.count===1?'entry':'entries'} of ${hoursLabel(s.h)}`}><span className="col-count">{s.count}</span><div className="column-track"><i style={{height:`${s.count/peak*100}%`}}/></div><small>{s.h}h</small></div>)}</div></div></section>
        </div>
        <section className="card entries">
          <div className="card-head"><h2>Activity feed</h2><span className="muted">{shown.length} of {entries.length}</span></div>
          <div className="filters">
            <input className="filter-search" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search entries" placeholder="Search by program, reflection or volunteer"/>
            <button type="button" className="icon-refresh" title="Reset search and hours filter" aria-label="Reset search and hours filter" onClick={()=>{setQuery('');setHoursFilter(0);setApplied({query:'',hours:0});}}><RefreshIcon/></button>
            <label className="slider"><span>Hours: <b>{hoursFilter?`exactly ${hoursFilter}`:'any'}</b></span><input type="range" min="0" max="8" step="1" value={hoursFilter} onChange={e=>setHoursFilter(Number(e.target.value))} aria-label="Filter by hours (0 means any)"/></label>
          </div>
          <div className="entry-grid">{shown.map(e=><EntryCard key={e.id} e={e}/>)}</div>
          {shown.length===0&&<p className="empty">No entries match these filters.</p>}
        </section>
        <footer className="page-foot"><button className="link-btn" onClick={restoreExamples}>Restore example data</button></footer>
      </>}

      {route.page==='program'&&<section className="program-page">
        <header className="welcome"><div><h1>Programs</h1><p>Pick a program to see how much time volunteers put in, who runs it, and what they said.</p></div></header>
        <div className="program-select"><span className="legend" id="program-dd-label">Program</span>
          <Dropdown labelledBy="program-dd-label" value={route.code} onChange={c=>go(`#/programs/${c}`)}
            options={[...(PROGRAMS[route.code]?[]:[{value:route.code,label:route.code,sub:'Not in directory'}]),...CODES.map(c=>({value:c,label:PROGRAMS[c].name,sub:`${c} · ${PROGRAMS[c].partner}`}))]}/></div>
        <header className="program-hero">
          <div className="program-hero-text"><span className="tag">{route.code}</span><h1>{program.name}</h1><p>{program.partner}</p></div>
          <div className="hero-stats"><div><b>{meanHours(programEntries)}</b><span>avg hours / entry</span></div><div><b>{programEntries.length}</b><span>entries</span></div><div><b>{sumHours(programEntries)}</b><span>total hours</span></div></div>
        </header>
        {PROGRAMS[route.code]&&<div className="program-actions">{loggedByMe.has(route.code)?<span className="muted">You've already logged this program</span>:<button className="primary" onClick={()=>logFor(route.code)}>Log your hours for this program</button>}</div>}
        <div className="program-grid">
          <section className="card about"><h2>About this program</h2><p>{program.description}</p><dl><dt>Partner</dt><dd>{program.partner}</dd><dt>Program code</dt><dd>{route.code}</dd></dl></section>
          <section className="card team"><h2>Program team</h2><p className="muted">Faculty supervisors and student coordinators for the last two academic years.</p>
            {program.history.length?<div className="team-grid">{program.history.map(h=><div className="team-year" key={h.year}><h3>{h.year}</h3><span className="label">Supervisor{h.supervisors.length===1?'':'s'}</span><p>{h.supervisors.join(', ')}</p><span className="label">Student coordinators</span><p>{h.coordinators.join(', ')}</p></div>)}</div>:<p className="muted">No example team records for this program.</p>}
            <p className="fine-print">Illustrative program and staff records; all names are fictional.</p></section>
        </div>
        <section className="card program-entries"><div className="card-head"><h2>Logged hours</h2><span className="muted">{programEntries.length}</span></div>
          {programEntries.length?<ul className="timeline">{programEntries.map(e=><li key={e.id}><div className="timeline-top"><b>{e.name}</b><span className="hours-badge">{hoursLabel(e.hours)}</span></div><p>{e.reflection||<span className="muted">No reflection written.</span>}</p><small>{formatDate(e.date)}{e.owner==='you'&&<button className="link-btn" onClick={()=>startEdit(e)}>Edit</button>}</small></li>)}</ul>:<p className="muted">Nothing logged yet.</p>}
        </section>
      </section>}
    </main>
  </div>;
}

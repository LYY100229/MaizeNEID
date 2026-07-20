"use client";

import { useMemo, useState } from "react";
import interactionRecords from "./data/interactions.json";

type Evidence = { value: string; detail: string; state: "strong" | "moderate" | "weak" | "pending" };
type Pair = {
  id: string; effector: string; nlr: string; pathogen: string; species: string;
  megadock: Evidence; afm: Evidence; af3: Evidence; consensus: number;
};

const pairs = interactionRecords as Pair[];

const residues = [
  ["NLR Lys231", "H-bond donor"], ["NLR Asp234", "Salt bridge"],
  ["Effector Ser78", "H-bond acceptor"], ["Effector Tyr81", "Hydrophobic contact"],
];

function EvidenceCell({ evidence }: { evidence: Evidence }) {
  return <div className={`ev-cell ${evidence.state}`}><b>{evidence.value}</b><span>{evidence.detail}</span></div>;
}

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [effectorQuery, setEffectorQuery] = useState("PpCSEP_00412");
  const [selectedEffector, setSelectedEffector] = useState("PpCSEP_00412");
  const [selected, setSelected] = useState<Pair>(pairs[0]);
  const [tab, setTab] = useState<"structure" | "sequence">("structure");
  const [showContacts, setShowContacts] = useState(true);
  const [minConsensus, setMinConsensus] = useState("0");
  const [af3Filter, setAf3Filter] = useState("all");
  const [sortKey, setSortKey] = useState<"consensus" | "megadock" | "afm" | "af3" | "nlr">("consensus");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const effectors = [...new Set(pairs.map(p => p.effector))];
  const suggestions = effectors.filter(e => e.toLowerCase().includes(effectorQuery.toLowerCase()));
  const selectedEffectorMeta = pairs.find(p => p.effector === selectedEffector);
  const matrixRows = useMemo(() => {
    const numeric = (value:string) => { const parsed = Number.parseFloat(value); return Number.isNaN(parsed) ? -Infinity : parsed; };
    const valueFor = (pair:Pair) => sortKey === "consensus" ? pair.consensus : sortKey === "megadock" ? numeric(pair.megadock.value) : sortKey === "afm" ? numeric(pair.afm.value) : sortKey === "af3" ? numeric(pair.af3.value) : pair.nlr;
    return pairs.filter(p => p.effector === selectedEffector).filter(p => p.consensus >= Number(minConsensus)).filter(p => af3Filter === "all" || (af3Filter === "available" ? p.af3.state !== "pending" : p.af3.state === "pending")).sort((a,b) => { const av=valueFor(a), bv=valueFor(b); const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv)); return sortDirection === "asc" ? result : -result; });
  }, [selectedEffector, minConsensus, af3Filter, sortKey, sortDirection]);
  const selectEffector = (name:string) => { setSelectedEffector(name); setEffectorQuery(name); const first=pairs.find(p=>p.effector===name); if(first) setSelected(first); };

  if (!entered) return <main className="welcome-page">
    <div className="welcome-orbit orbit-one"></div><div className="welcome-orbit orbit-two"></div>
    <nav className="welcome-nav"><div className="welcome-identity"><img className="szu-logo welcome-logo" src="/shenzhen-university-emblem.svg" alt="Shenzhen University"/><div className="brand inverse"><span className="mark">N</span><span>MaizeNEID<small>Yang Lab</small></span></div></div><span>STRUCTURAL IMMUNITY RESOURCE / 2026</span></nav>
    <section className="welcome-content">
      <p className="welcome-kicker">YANG LAB</p>
      <h1 className="full-title"><span><b>M</b>aize</span> <span><b>N</b>LR-<b>E</b>ffector</span><br/><span><b>I</b>nteract <b>D</b>atabase</span></h1>
      <p className="welcome-acronym">MaizeNEID</p>
      <p className="welcome-subtitle">A multi-method structural evidence atlas for predicted interactions between maize immune receptors and pathogen effectors.</p>
      <div className="welcome-actions"><button onClick={()=>setEntered(true)}>Enter the atlas <span>-&gt;</span></button><a href="https://doi.org/################" target="_blank" rel="noreferrer">Please cite DOI: ################</a></div>
    </section>
    <div className="welcome-footer"><span>MEGADOCK</span><span>ALPHAFOLD-MULTIMER</span><span>ALPHAFOLD 3</span><span>INTERFACE EVIDENCE</span></div>
  </main>;

  return <main>
    <nav className="topbar"><div className="topbar-identity"><img className="szu-logo topbar-logo" src="/shenzhen-university-emblem.svg" alt="Shenzhen University"/><div className="brand"><span className="mark">N</span><span>MaizeNEID<small>Yang Lab</small></span></div></div><div className="navlinks"><a href="#evidence">Evidence matrix</a><a href="#pair">Pair view</a><a href="#about">About</a></div></nav>
    <section className="hero"><p className="eyebrow">YANG LAB / MULTI-METHOD STRUCTURAL EVIDENCE</p><h1>Map potential <em>NLR recognition</em><br/>across pathogen effectors</h1><p className="hero-copy">A structure-informed resource for maize immunity, integrating docking and deep-learning evidence for transparent candidate prioritization.</p><div className="hero-metrics"><div><strong>05</strong><span>pathogen species</span></div><div><strong>126</strong><span>predicted pairs</span></div><div><strong>03</strong><span>evidence channels</span></div><div><strong>Live</strong><span>dataset expanding</span></div></div></section>

    <section id="evidence" className="matrix-section">
      <div className="section-heading"><div><p className="eyebrow">EFFECTOR-CENTRIC SEARCH</p><h2>Interaction evidence matrix</h2></div><p>Compare all candidate NLR partners for one effector across independent prediction methods.</p></div>
      <div className="effector-search"><label><span>Effector</span><input value={effectorQuery} onChange={e=>setEffectorQuery(e.target.value)} placeholder="Search effector ID" /></label><div className="effector-chips">{suggestions.map(e=><button key={e} className={e===selectedEffector?"active":""} onClick={()=>selectEffector(e)}>{e}</button>)}</div></div>
      <div className="matrix-controls"><label><span>Minimum consensus</span><select value={minConsensus} onChange={e=>setMinConsensus(e.target.value)}><option value="0">All evidence levels</option><option value="1">At least 1 of 3</option><option value="2">At least 2 of 3</option><option value="3">3 of 3 only</option></select></label><label><span>AF3 status</span><select value={af3Filter} onChange={e=>setAf3Filter(e.target.value)}><option value="all">All AF3 states</option><option value="available">AF3 available</option><option value="pending">AF3 pending</option></select></label><label><span>Sort by</span><select value={sortKey} onChange={e=>setSortKey(e.target.value as typeof sortKey)}><option value="consensus">Consensus</option><option value="megadock">MegaDock score</option><option value="afm">AFM pDockQ</option><option value="af3">AF3 ipTM</option><option value="nlr">NLR name</option></select></label><button className="sort-direction" onClick={()=>setSortDirection(sortDirection === "desc" ? "asc" : "desc")}><b>{sortDirection === "desc" ? "DESC" : "ASC"}</b><span>{sortDirection === "desc" ? "High to low" : "Low to high"}</span></button><button className="reset-filters" onClick={()=>{setMinConsensus("0");setAf3Filter("all");setSortKey("consensus");setSortDirection("desc");}}>Reset</button></div>
      <div className="matrix-card">
        <div className="matrix-meta"><div><small>SELECTED EFFECTOR</small><h3>{selectedEffector}</h3><p>{selectedEffectorMeta?.pathogen} / {selectedEffectorMeta?.species} / {matrixRows.length} matching pairs</p></div><div className="method-key"><span><i className="strong"></i>Strong</span><span><i className="moderate"></i>Moderate</span><span><i className="weak"></i>Weak</span><span><i className="pending"></i>Pending</span></div></div>
        <div className="matrix-scroll"><table className="evidence-table"><thead><tr><th>Candidate NLR</th><th>Consensus</th><th>MegaDock evidence</th><th>AFM evidence</th><th>AF3 evidence</th><th></th></tr></thead><tbody>{matrixRows.map(row=><tr key={row.id} className={selected.id===row.id?"selected":""} onClick={()=>setSelected(row)}><td><b>{row.nlr}</b><small>{row.id}</small></td><td><span className={`consensus c${row.consensus}`}>{row.consensus}/3</span></td><td><EvidenceCell evidence={row.megadock}/></td><td><EvidenceCell evidence={row.afm}/></td><td><EvidenceCell evidence={row.af3}/></td><td><a href="#pair">View pair</a></td></tr>)}{matrixRows.length===0&&<tr className="empty-row"><td colSpan={6}>No interaction pairs match the current filters.</td></tr>}</tbody></table></div>
        <div className="matrix-note"><b>Interpretation note.</b> MegaDock reports docking score and rank percentile; AFM reports pDockQ; AF3 reports ipTM. Thresholds are method-specific and should not be compared as equivalent raw scores.</div>
      </div>
    </section>

    <section id="pair" className="explore-shell"><div className="section-heading"><div><p className="eyebrow">PAIR-LEVEL EVIDENCE</p><h2>{selected.effector} <span className="muted-x">x</span> {selected.nlr}</h2></div><p>{selected.pathogen} / {selected.species} / {selected.id}</p></div><article className="detail-card wide">
      <div className="detail-head"><div><p className="eyebrow">MULTI-METHOD SUMMARY</p><h2>{selected.consensus} of 3 methods support this candidate</h2></div><div className="confidence"><b>{selected.afm.value}</b><span>AFM pDockQ</span></div></div>
      <div className="tabs"><button className={tab==="structure"?"tab current":"tab"} onClick={()=>setTab("structure")}>3D complex</button><button className={tab==="sequence"?"tab current":"tab"} onClick={()=>setTab("sequence")}>Sequence interface</button><button className="contact-toggle" onClick={()=>setShowContacts(!showContacts)}><i className={showContacts?"on":""}></i>Residue contacts</button></div>
      {tab==="structure"?<div className="structure-view"><div className="axis">precomputed model / interactive viewer placeholder</div><div className="protein protein-a"><span></span><span></span><span></span><span></span></div><div className="protein protein-b"><span></span><span></span><span></span><span></span></div>{showContacts&&<><i className="bond bond-one"></i><i className="bond bond-two"></i><i className="bond bond-three"></i><div className="label label-a">{selected.nlr}</div><div className="label label-b">{selected.effector}</div></>}<div className="legend"><span><i className="swatch blue"></i>NLR</span><span><i className="swatch orange"></i>Effector</span><span><i className="dashes"></i>H-bond</span></div></div>:<div className="sequence-view"><p>Highlighted segments indicate predicted interface regions.</p><div className="sequence-block"><b>{selected.nlr}</b><code>... VLKQ<span>YDKE</span>PVL<span>RHDL</span>GKKELQK ...</code></div><div className="seq-link">:</div><div className="sequence-block eff"><b>{selected.effector}</b><code>... GFNW<span>SNNY</span>VTI<span>YHPE</span>SLVQKDI ...</code></div><div className="sequence-note">Interface: Lys231, Asp234 / Ser78, Tyr81</div></div>}
      <div className="evidence"><div><span>MegaDock</span><b>{selected.megadock.value}</b></div><div><span>AFM / pDockQ</span><b>{selected.afm.value}</b></div><div><span>AF3 / ipTM</span><b>{selected.af3.value}</b></div></div>
      <div className="residues"><h3>Interface residues and contacts</h3><div className="residue-grid">{residues.map(([r,t],i)=><div className="residue" key={r}><i className={i<2?"blue":"orange"}></i><span>{r}</span><small>{t}</small></div>)}</div></div>
    </article></section>
    <section id="about" className="about"><p className="eyebrow">YANG LAB / DATA NOTE</p><h2>Predictions prioritize hypotheses; they do not establish biological function.</h2><p>Each record retains method-specific scores, model provenance, interface residues, contact types, and input-sequence versions for reproducible candidate triage.</p></section><footer>Maize NLR-Effector Interact Database (MaizeNEID) <span>Yang Lab / multi-method interaction evidence / prototype</span></footer>
  </main>;
}

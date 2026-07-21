import { useMemo, useState } from "react";
import datasetMetadata from "./data/dataset-metadata.json";
import effectorRecords from "./data/effectors.json";
import interactionRecords from "./data/interactions.json";
import nlrRecords from "./data/nlrs.json";

type PlddtClass = "high" | "medium" | "low";

type Interaction = {
  id: string;
  pairIndex: number;
  effector: string;
  effectorInputId: string;
  nlr: string;
  nlrInputId: string;
  megadockScore: number;
  globalRank: number;
  globalPercentile: number;
  effectorRank: number;
  effectorPercentile: number;
  nlrRank: number;
  nlrPercentile: number;
  selectedGlobalTop2Pct: boolean;
  selectedEffectorTop3: boolean;
  selectedNlrTop5: boolean;
  selectionSources: string[];
  effectorMeanPlddt: number;
  effectorPlddtClass: PlddtClass;
  nlrMeanPlddt: number;
  nlrPlddtClass: PlddtClass;
};

type Effector = {
  id: string;
  inputId: string;
  index: number;
  length: number;
  originalHeader: string;
  cytoplasmicEffectorProbability: number | null;
  signalPeptideLength: number | null;
  originalLength: number | null;
  matureLength: number | null;
};

type Nlr = {
  id: string;
  inputId: string;
  index: number;
  length: number;
  originalHeader: string;
};

const interactions = interactionRecords as Interaction[];
const effectors = effectorRecords as Effector[];
const nlrs = nlrRecords as Nlr[];

const integer = new Intl.NumberFormat("en-US");

function pct(value: number) {
  const percent = value * 100;
  return `${percent.toFixed(percent < 0.01 ? 4 : 2)}%`;
}

function SelectionBadges({ pair }: { pair: Interaction }) {
  if (!pair.selectionSources.length) return <span className="selection-none">Scored</span>;
  return (
    <div className="selection-badges">
      {pair.selectedGlobalTop2Pct && <span>Global top 2%</span>}
      {pair.selectedEffectorTop3 && <span>Effector top 3</span>}
      {pair.selectedNlrTop5 && <span>NLR top 5</span>}
    </div>
  );
}

export default function App() {
  const initialPair = interactions[0];
  const [entered, setEntered] = useState(false);
  const [effectorQuery, setEffectorQuery] = useState(initialPair.effector);
  const [selectedEffector, setSelectedEffector] = useState(initialPair.effector);
  const [selected, setSelected] = useState<Interaction>(initialPair);
  const [availabilityTab, setAvailabilityTab] = useState<"structure" | "sequence">("structure");
  const [selectionFilter, setSelectionFilter] = useState("all");
  const [plddtFilter, setPlddtFilter] = useState("all");
  const [sortKey, setSortKey] = useState("score-desc");

  const effectorById = useMemo(() => new Map(effectors.map((record) => [record.id, record])), []);
  const nlrById = useMemo(() => new Map(nlrs.map((record) => [record.id, record])), []);
  const suggestions = useMemo(
    () => effectors.filter((record) => record.id.toLowerCase().includes(effectorQuery.toLowerCase())).slice(0, 12),
    [effectorQuery],
  );
  const selectedEffectorMeta = effectorById.get(selectedEffector);
  const selectedNlrMeta = nlrById.get(selected.nlr);

  const matrixRows = useMemo(() => {
    const filtered = interactions
      .filter((pair) => pair.effector === selectedEffector)
      .filter((pair) => {
        if (selectionFilter === "union") return pair.selectionSources.length > 0;
        if (selectionFilter === "global") return pair.selectedGlobalTop2Pct;
        if (selectionFilter === "effector") return pair.selectedEffectorTop3;
        if (selectionFilter === "nlr") return pair.selectedNlrTop5;
        return true;
      })
      .filter((pair) => plddtFilter === "all" || pair.nlrPlddtClass === plddtFilter);

    return filtered.sort((a, b) => {
      if (sortKey === "score-asc") return a.megadockScore - b.megadockScore;
      if (sortKey === "global-rank") return a.globalRank - b.globalRank;
      if (sortKey === "effector-rank") return a.effectorRank - b.effectorRank;
      if (sortKey === "nlr-rank") return a.nlrRank - b.nlrRank;
      if (sortKey === "plddt") return b.nlrMeanPlddt - a.nlrMeanPlddt;
      if (sortKey === "nlr") return a.nlr.localeCompare(b.nlr);
      return b.megadockScore - a.megadockScore;
    });
  }, [plddtFilter, selectedEffector, selectionFilter, sortKey]);

  const selectEffector = (id: string) => {
    setSelectedEffector(id);
    setEffectorQuery(id);
    const firstPair = interactions.find((pair) => pair.effector === id);
    if (firstPair) setSelected(firstPair);
  };

  if (!entered) {
    return (
      <main className="welcome-page">
        <div className="welcome-orbit orbit-one" />
        <div className="welcome-orbit orbit-two" />
        <nav className="welcome-nav">
          <div className="welcome-identity">
            <img className="szu-logo welcome-logo" src="/shenzhen-university-emblem.svg" alt="Shenzhen University" />
            <div className="brand inverse"><span className="mark">N</span><span>MaizeNEID<small>Yang Lab</small></span></div>
          </div>
          <span>CURATED PRECOMPUTED EVIDENCE / 2026</span>
        </nav>
        <section className="welcome-content">
          <p className="welcome-kicker">YANG LAB</p>
          <h1 className="full-title"><span><b>M</b>aize</span> <span><b>N</b>LR-<b>E</b>ffector</span><br /><span><b>I</b>nteract <b>D</b>atabase</span></h1>
          <p className="welcome-acronym">MaizeNEID</p>
          <p className="welcome-subtitle">A curated resource for precomputed MEGADOCK evidence between maize immune receptors and supplied Fusarium Effector candidates.</p>
          <div className="welcome-actions">
            <button onClick={() => setEntered(true)}>Enter the database <span>-&gt;</span></button>
            <span className="citation-pending">Citation DOI pending assignment</span>
          </div>
        </section>
        <div className="welcome-footer"><span>MEGADOCK AVAILABLE</span><span>AF-MULTIMER PENDING</span><span>ALPHAFOLD 3 PENDING</span><span>NO ONLINE ANALYSIS</span></div>
      </main>
    );
  }

  return (
    <main>
      <nav className="topbar">
        <div className="topbar-identity">
          <img className="szu-logo topbar-logo" src="/shenzhen-university-emblem.svg" alt="Shenzhen University" />
          <div className="brand"><span className="mark">N</span><span>MaizeNEID<small>Yang Lab</small></span></div>
        </div>
        <div className="navlinks"><a href="#evidence">Evidence matrix</a><a href="#pair">Pair record</a><a href="#about">Data provenance</a></div>
      </nav>

      <section className="hero">
        <p className="eyebrow">YANG LAB / FUSARIUM DATASET / PRECOMPUTED EVIDENCE</p>
        <h1>Explore maize NLR–Effector<br /><em>MEGADOCK evidence</em></h1>
        <p className="hero-copy">Every displayed score and identifier is imported from the completed <code>cytoplasmic_mature_v1</code> MEGADOCK summary. AF-Multimer and AlphaFold 3 fields remain unavailable until their results are imported.</p>
        <div className="hero-metrics">
          <div><strong>{integer.format(datasetMetadata.effectorCount)}</strong><span>Fusarium effectors</span></div>
          <div><strong>{integer.format(datasetMetadata.nlrCount)}</strong><span>maize receptor proteins</span></div>
          <div><strong>{integer.format(datasetMetadata.interactionCount)}</strong><span>scored pairs</span></div>
          <div><strong>01</strong><span>evidence channel available</span></div>
        </div>
      </section>

      <section id="evidence" className="matrix-section">
        <div className="section-heading">
          <div><p className="eyebrow">EFFECTOR-CENTRIC SEARCH</p><h2>Interaction evidence matrix</h2></div>
          <p>Select one Effector to compare all {datasetMetadata.nlrCount} maize receptor partners. No scores are calculated in the browser.</p>
        </div>

        <div className="effector-search">
          <label><span>Effector identifier</span><input value={effectorQuery} onChange={(event) => setEffectorQuery(event.target.value)} placeholder="Search 127 Effector IDs" /></label>
          <div className="effector-chips">
            {suggestions.map((record) => <button key={record.id} className={record.id === selectedEffector ? "active" : ""} onClick={() => selectEffector(record.id)}>{record.id}</button>)}
            {suggestions.length === 0 && <span className="no-suggestions">No matching Effector ID</span>}
          </div>
        </div>

        <div className="matrix-controls">
          <label><span>MEGADOCK subset</span><select value={selectionFilter} onChange={(event) => setSelectionFilter(event.target.value)}><option value="all">All scored pairs</option><option value="union">Selected union</option><option value="global">Global top 2%</option><option value="effector">Top 3 for each Effector</option><option value="nlr">Top 5 for each NLR</option></select></label>
          <label><span>NLR monomer pLDDT</span><select value={plddtFilter} onChange={(event) => setPlddtFilter(event.target.value)}><option value="all">All pLDDT classes</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
          <label><span>Sort</span><select value={sortKey} onChange={(event) => setSortKey(event.target.value)}><option value="score-desc">MEGADOCK score: high to low</option><option value="score-asc">MEGADOCK score: low to high</option><option value="effector-rank">Effector rank: best first</option><option value="global-rank">Global rank: best first</option><option value="nlr-rank">NLR rank: best first</option><option value="plddt">NLR pLDDT: high to low</option><option value="nlr">NLR identifier: A–Z</option></select></label>
          <button className="reset-filters" onClick={() => { setSelectionFilter("all"); setPlddtFilter("all"); setSortKey("score-desc"); }}>Reset filters</button>
        </div>

        <div className="matrix-card">
          <div className="matrix-meta">
            <div><small>SELECTED EFFECTOR</small><h3>{selectedEffector}</h3><p>{selectedEffectorMeta?.matureLength ?? selectedEffectorMeta?.length} aa mature sequence / {matrixRows.length} displayed pairs</p></div>
            <div className="dataset-stamp"><b>MEGADOCK</b><span>Available</span><small>union_g2_e3_n5</small></div>
          </div>
          <div className="matrix-scroll">
            <table className="evidence-table real-evidence-table">
              <thead><tr><th>Candidate NLR</th><th>MEGADOCK evidence</th><th>AF-Multimer evidence</th><th>AlphaFold 3 evidence</th><th>Selection basis</th><th /></tr></thead>
              <tbody>
                {matrixRows.map((pair) => (
                  <tr key={pair.id} className={selected.id === pair.id ? "selected" : ""} onClick={() => setSelected(pair)}>
                    <td><b>{pair.nlr}</b><small>{selectedNlrMeta?.id === pair.nlr ? `${selectedNlrMeta.length} aa` : `${nlrById.get(pair.nlr)?.length ?? "—"} aa`} / pLDDT {pair.nlrMeanPlddt.toFixed(3)}</small></td>
                    <td><div className="megadock-cell"><b>{pair.megadockScore.toFixed(2)}</b><span>Effector rank #{pair.effectorRank} / {datasetMetadata.nlrCount}</span><small>Global #{integer.format(pair.globalRank)} · {pct(pair.globalPercentile)}</small></div></td>
                    <td><div className="unavailable-cell"><b>Not available</b><span>Awaiting import</span></div></td>
                    <td><div className="unavailable-cell"><b>Not available</b><span>Awaiting import</span></div></td>
                    <td><SelectionBadges pair={pair} /></td>
                    <td><a href="#pair">View record</a></td>
                  </tr>
                ))}
                {matrixRows.length === 0 && <tr className="empty-row"><td colSpan={6}>No real interaction records match the current filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="matrix-note"><b>Interpretation.</b> A larger MEGADOCK score ranks higher within this dataset. Rankings are computational docking evidence, not experimental validation. AF-Multimer and AlphaFold 3 values are intentionally blank.</div>
        </div>
      </section>

      <section id="pair" className="explore-shell">
        <div className="section-heading"><div><p className="eyebrow">PAIR RECORD</p><h2>{selected.effector} <span className="muted-x">×</span> {selected.nlr}</h2></div><p>{selected.id}</p></div>
        <article className="detail-card wide real-pair-card">
          <div className="detail-head">
            <div><p className="eyebrow">AVAILABLE EVIDENCE: MEGADOCK</p><h2>Docking score {selected.megadockScore.toFixed(2)}</h2><p>Global rank #{integer.format(selected.globalRank)} of {integer.format(datasetMetadata.interactionCount)}</p></div>
            <div className="confidence"><b>#{selected.effectorRank}</b><span>rank for this Effector</span></div>
          </div>

          <div className="record-grid">
            <div><span>Global percentile</span><b>{pct(selected.globalPercentile)}</b></div>
            <div><span>Effector percentile</span><b>{pct(selected.effectorPercentile)}</b></div>
            <div><span>NLR rank</span><b>#{selected.nlrRank} / {datasetMetadata.effectorCount}</b></div>
            <div><span>NLR percentile</span><b>{pct(selected.nlrPercentile)}</b></div>
            <div><span>Effector monomer pLDDT</span><b>{selected.effectorMeanPlddt.toFixed(3)} <small>{selected.effectorPlddtClass}</small></b></div>
            <div><span>NLR monomer pLDDT</span><b>{selected.nlrMeanPlddt.toFixed(3)} <small>{selected.nlrPlddtClass}</small></b></div>
          </div>

          <div className="selection-summary"><span>Selection basis</span><SelectionBadges pair={selected} /></div>

          <div className="tabs availability-tabs">
            <button className={availabilityTab === "structure" ? "tab current" : "tab"} onClick={() => setAvailabilityTab("structure")}>3D complex</button>
            <button className={availabilityTab === "sequence" ? "tab current" : "tab"} onClick={() => setAvailabilityTab("sequence")}>Interface sequence</button>
          </div>
          <div className="honest-empty-state">
            <span>{availabilityTab === "structure" ? "3D" : "SEQ"}</span>
            <div><h3>{availabilityTab === "structure" ? "No validated complex structure is available" : "No interface-residue annotation is available"}</h3><p>{availabilityTab === "structure" ? "This area will remain empty until AF-Multimer or AlphaFold 3 complex models are imported." : "Sequence-level contacts and interacting residues will be added only after they are derived from imported complex structures."}</p></div>
          </div>
        </article>
      </section>

      <section id="about" className="about">
        <p className="eyebrow">YANG LAB / DATA PROVENANCE</p>
        <h2>Only completed, traceable evidence is displayed.</h2>
        <p>Dataset <code>{datasetMetadata.dataset}</code> contains {integer.format(datasetMetadata.interactionCount)} MEGADOCK-scored pairs from {datasetMetadata.effectorCount} supplied Fusarium Effector candidates and {datasetMetadata.nlrCount} maize receptor protein inputs. The current release contains no AF-Multimer score, AlphaFold 3 score, complex structure, interface-residue assignment, hydrogen-bond annotation, or experimental validation.</p>
      </section>
      <footer>Maize NLR-Effector Interact Database (MaizeNEID) <span>Yang Lab / dataset retrieved {datasetMetadata.retrievedOn} / MEGADOCK evidence only</span></footer>
    </main>
  );
}

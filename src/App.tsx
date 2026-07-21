import { useEffect, useMemo, useState } from "react";
import metadata from "./data/dataset-metadata.json";
import effectorData from "./data/effectors.json";
import interactionData from "./data/interactions.json";
import nlrData from "./data/nlrs.json";

type Effector = { id: string; inputId: string; alias: string; length: number; sequence: string };
type Nlr = { id: string; length: number; sequence: string; nlrClass: string };
type Pair = { id: string; effector: string; nlr: string; megadockScore: number; globalRank: number; effectorRank: number; nlrRank: number; selectedGlobalTop2Pct: boolean; selectedEffectorTop3: boolean; selectedNlrTop3: boolean; selectionSources: string[]; effectorMeanPlddt: number; nlrMeanPlddt: number; kingdom: string; species: string };
type MappingRow = { B73V4: string; B73V5: string };
type ConversionResult = { input: string; matched: string; result: string; status: "Mapped" | "Not found" };

const effectors = effectorData as Effector[];
const nlrs = nlrData as Nlr[];
const pairs = interactionData as Pair[];
const integer = new Intl.NumberFormat("en-US");
const mappingPath = "/data/B73V4_V5_mapping_2026-07-21.csv";

function fasta(header: string, sequence: string) {
  return `>${header}\n${sequence.match(/.{1,60}/g)?.join("\n") ?? ""}\n`;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number) { return [n & 255, (n >>> 8) & 255]; }
function u32(n: number) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }

function zip(files: { name: string; text: string }[]) {
  const encoder = new TextEncoder();
  const local: number[] = [];
  const central: number[] = [];
  const entries: { name: Uint8Array; data: Uint8Array; crc: number; offset: number }[] = [];
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.text);
    const offset = local.length;
    const crc = crc32(data);
    entries.push({ name, data, crc, offset });
    local.push(...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...name, ...data);
  }
  const start = local.length;
  for (const entry of entries) central.push(...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(entry.crc), ...u32(entry.data.length), ...u32(entry.data.length), ...u16(entry.name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(entry.offset), ...entry.name);
  return new Blob([new Uint8Array([...local, ...central, ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length), ...u32(central.length), ...u32(start), ...u16(0)])], { type: "application/zip" });
}

function download(name: string, blob: Blob) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
}

function parseMappingCsv(text: string): MappingRow[] {
  return text.split(/\r?\n/).slice(1).flatMap(line => {
    const match = line.match(/^"?([^,\"]+)"?,"?([^,\"]+)"?$/);
    return match ? [{ B73V4: match[1].trim(), B73V5: match[2].trim() }] : [];
  });
}

function normalizeId(id: string) {
  return id.trim().replace(/_(?:T|P)\d+$/i, "");
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function badges(pair: Pair) {
  return <div className="selection-badges">{pair.selectedGlobalTop2Pct && <span>Global top 2%</span>}{pair.selectedEffectorTop3 && <span>Effector top 3</span>}{pair.selectedNlrTop3 && <span>NLR top 3</span>}</div>;
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mappingRows, setMappingRows] = useState<MappingRow[]>([]);
  const [mappingStatus, setMappingStatus] = useState<"loading" | "ready" | "error">("loading");
  const [nlrClass, setNlrClass] = useState("All");
  const [nlrQuery, setNlrQuery] = useState("");
  const [kingdom, setKingdom] = useState("Fungi");
  const [species, setSpecies] = useState("Fusarium");
  const [sort, setSort] = useState("score");
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Pair>(pairs[0]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [converterInput, setConverterInput] = useState("");
  const [converterDirection, setConverterDirection] = useState<"v4-to-v5" | "v5-to-v4">("v4-to-v5");
  const [conversionResults, setConversionResults] = useState<ConversionResult[]>([]);

  useEffect(() => {
    fetch(mappingPath)
      .then(response => {
        if (!response.ok) throw new Error("Mapping table could not be loaded.");
        return response.text();
      })
      .then(text => { setMappingRows(parseMappingCsv(text)); setMappingStatus("ready"); })
      .catch(() => setMappingStatus("error"));
  }, []);

  const nlrById = useMemo(() => new Map(nlrs.map(item => [item.id, item])), []);
  const effectorById = useMemo(() => new Map(effectors.map(item => [item.id, item])), []);
  const classes = useMemo(() => ["All", ...Array.from(new Set(nlrs.map(item => item.nlrClass))).sort()], []);
  const availableNlrs = useMemo(() => nlrs.filter(item => nlrClass === "All" || item.nlrClass === nlrClass), [nlrClass]);
  const v4ToV5 = useMemo(() => new Map(mappingRows.map(item => [item.B73V4.toUpperCase(), item.B73V5])), [mappingRows]);
  const v5ToV4 = useMemo(() => {
    const grouped = new Map<string, string[]>();
    mappingRows.forEach(item => {
      const key = item.B73V5.toUpperCase();
      grouped.set(key, [...(grouped.get(key) ?? []), item.B73V4]);
    });
    return grouped;
  }, [mappingRows]);
  const filtered = useMemo(() => pairs
    .filter(pair => pair.kingdom === kingdom && pair.species === species)
    .filter(pair => nlrClass === "All" || nlrById.get(pair.nlr)?.nlrClass === nlrClass)
    .filter(pair => !nlrQuery || pair.nlr.toLowerCase().includes(nlrQuery.toLowerCase()))
    .sort((a, b) => sort === "rank" ? a.globalRank - b.globalRank : sort === "nlr" ? a.nlr.localeCompare(b.nlr) : b.megadockScore - a.megadockScore), [kingdom, species, nlrClass, nlrQuery, sort, nlrById]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const activePage = Math.min(page, pageCount);
  const rows = filtered.slice((activePage - 1) * perPage, activePage * perPage);

  const reset = () => { setNlrClass("All"); setNlrQuery(""); setKingdom("Fungi"); setSpecies("Fusarium"); setSort("score"); setPage(1); };
  const toggle = (id: string) => setChecked(old => { const next = new Set(old); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const togglePage = () => setChecked(old => { const next = new Set(old); const all = rows.every(item => next.has(item.id)); rows.forEach(item => all ? next.delete(item.id) : next.add(item.id)); return next; });
  const runConverter = () => {
    const values = converterInput.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
    setConversionResults(values.map(input => {
      const matched = normalizeId(input);
      const result = converterDirection === "v4-to-v5" ? v4ToV5.get(matched.toUpperCase()) : v5ToV4.get(matched.toUpperCase())?.join("; ");
      return { input, matched, result: result ?? "—", status: result ? "Mapped" : "Not found" };
    }));
  };
  const clearConverter = () => { setConverterInput(""); setConversionResults([]); };
  const resultText = conversionResults.map(item => `${item.input}\t${item.result}\t${item.status}`).join("\n");
  const copyResults = async () => { if (resultText) await navigator.clipboard?.writeText(`Input ID\tConverted ID\tStatus\n${resultText}`); };
  const downloadResults = () => {
    const lines = [
      ["Input ID", "Converted ID", "Status"].join(","),
      ...conversionResults.map(item => [item.input, item.result, item.status].map(csvCell).join(",")),
    ];
    download("MaizeNEID_B73V4_V5_conversion.csv", new Blob([`${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8" }));
  };
  const exportSelected = () => {
    const chosen = pairs.filter(item => checked.has(item.id));
    if (!chosen.length) return;
    const proteins = new Map<string, { header: string; sequence: string }>();
    chosen.forEach(pair => {
      const nlr = nlrById.get(pair.nlr)!;
      const effector = effectorById.get(pair.effector)!;
      proteins.set(`NLR:${nlr.id}`, { header: `${nlr.id} | ${nlr.nlrClass} | ${nlr.length} aa`, sequence: nlr.sequence });
      proteins.set(`Effector:${effector.id}`, { header: `${effector.alias} | ${effector.inputId} | ${effector.length} aa`, sequence: effector.sequence });
    });
    const header = "interaction_pair\tnlr_id\tnlr_class\tnlr_length_aa\teffector_alias\teffector_accession\teffector_length_aa\tmegadock_score\tglobal_rank\teffector_rank\tnlr_rank\tselection_basis";
    const evidence = [header, ...chosen.map(pair => {
      const nlr = nlrById.get(pair.nlr)!;
      const effector = effectorById.get(pair.effector)!;
      return [`${nlr.id}—${effector.alias}`, nlr.id, nlr.nlrClass, nlr.length, effector.alias, effector.inputId, effector.length, pair.megadockScore, pair.globalRank, pair.effectorRank, pair.nlrRank, pair.selectionSources.join(";")].join("\t");
    })].join("\n") + "\n";
    download("MaizeNEID_selected_pairs.zip", zip([{ name: "MaizeNEID_selected_protein_sequences.fasta", text: Array.from(proteins.values()).map(item => fasta(item.header, item.sequence)).join("") }, { name: "MaizeNEID_selected_interaction_evidence.tsv", text: evidence }]));
  };

  const title = <><span><b>M</b>aize</span> <span><b>N</b>LR-<b>E</b>ffector</span><br /><span><b>I</b>nteract <b>D</b>atabase</span></>;
  if (!entered) return <main className="welcome-page"><nav className="welcome-nav"><div className="welcome-identity"><img className="szu-logo welcome-logo" src="/shenzhen-university-emblem.svg" alt="Shenzhen University" /><div className="brand inverse"><span className="mark">N</span><span>MaizeNEID<small>Yang Lab</small></span></div></div></nav><section className="welcome-content"><p className="welcome-kicker">YANG LAB</p><h1 className="full-title">{title}</h1><p className="welcome-acronym">MaizeNEID</p><p className="welcome-subtitle">A curated resource for precomputed interaction evidence between maize immune receptors and pathogen Effector candidates.</p><div className="welcome-actions"><button onClick={() => setEntered(true)}>Enter the database <span>→</span></button><span className="citation-pending">Citation DOI pending assignment</span></div></section><div className="welcome-footer"><span>MEGADOCK</span><span>AF-MULTIMER PENDING</span><span>ALPHAFOLD 3 PENDING</span></div></main>;

  return <main>
    <nav className="topbar"><div className="topbar-identity"><img className="szu-logo topbar-logo" src="/shenzhen-university-emblem.svg" alt="Shenzhen University" /><div className="brand"><span className="mark">N</span><span>MaizeNEID<small>Yang Lab</small></span></div></div><div className="navlinks"><button className="tools-trigger" onClick={() => setToolsOpen(true)}>ID Converter</button><a href="#evidence">Evidence browser</a></div></nav>
    <section className="hero"><p className="eyebrow">YANG LAB</p><h1>{title}</h1><p className="hero-copy">A curated resource for interaction evidence between maize immune receptors and pathogen Effector candidates.</p><div className="hero-metrics"><div><strong>{integer.format(metadata.effectorCount)}</strong><span>Fusarium effectors</span></div><div><strong>{integer.format(metadata.nlrCount)}</strong><span>maize receptor proteins</span></div><div><strong>{integer.format(metadata.totalInteractionCount)}</strong><span>total protein pairs</span></div><div><strong>{integer.format(metadata.selectedInteractionCount)}</strong><span>significant pairs</span></div></div></section>
    <section id="evidence" className="matrix-section"><div className="section-heading"><div><p className="eyebrow">NLR-CENTRIC BROWSER</p><h2>Candidate interaction evidence</h2></div></div><div className="matrix-controls data-filters"><label><span>NLR class</span><select value={nlrClass} onChange={event => { setNlrClass(event.target.value); setNlrQuery(""); setPage(1); }}>{classes.map(item => <option key={item}>{item}</option>)}</select></label><label><span>NLR protein ID</span><input list="nlr-options" value={nlrQuery} onChange={event => { setNlrQuery(event.target.value); setPage(1); }} placeholder="Search Zm protein ID" /><datalist id="nlr-options">{availableNlrs.map(item => <option key={item.id} value={item.id}>{item.nlrClass}</option>)}</datalist></label><label><span>Pathogen group</span><select value={kingdom} onChange={event => { setKingdom(event.target.value); setSpecies(event.target.value === "Fungi" ? "Fusarium" : "None"); setPage(1); }}><option>Fungi</option><option>Bacteria</option></select></label><label><span>Pathogen taxon</span><select value={species} onChange={event => { setSpecies(event.target.value); setPage(1); }} disabled={kingdom !== "Fungi"}><option value="Fusarium">Fusarium</option>{kingdom !== "Fungi" && <option value="None">No imported taxa</option>}</select></label><label><span>Sort</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="score">MEGADOCK score</option><option value="rank">Global rank</option><option value="nlr">NLR identifier</option></select></label><button className="reset-filters" onClick={reset}>Reset filters</button></div>
    <div className="matrix-card"><div className="matrix-meta"><div><small>FILTERED, PRECOMPUTED CANDIDATES</small><h3>{integer.format(filtered.length)} interaction pairs</h3></div><button className="download-button" disabled={!checked.size} onClick={exportSelected}>Download selected ({checked.size})</button></div><div className="matrix-scroll"><table className="evidence-table real-evidence-table"><thead><tr><th><input aria-label="Select current page" type="checkbox" checked={rows.length > 0 && rows.every(item => checked.has(item.id))} onChange={togglePage} /></th><th><span className="sr-only">Show details</span></th><th>Candidate NLR</th><th>Effector</th><th>MEGADOCK evidence</th><th>AF-Multimer evidence</th><th>AlphaFold 3 evidence</th><th>Selection basis</th></tr></thead><tbody>{rows.map(pair => { const nlr = nlrById.get(pair.nlr)!; const effector = effectorById.get(pair.effector)!; return <tr key={pair.id}><td><input aria-label={`Select ${pair.id}`} type="checkbox" checked={checked.has(pair.id)} onChange={() => toggle(pair.id)} /></td><td><button className="show-details" title="Show interaction details" aria-label={`Show interaction details for ${nlr.id} and ${effector.alias}`} onClick={() => { setSelected(pair); setDetailsOpen(true); }}><span aria-hidden="true" /></button></td><td><b>{nlr.id}</b><small>{nlr.nlrClass} · {nlr.length} aa · monomer pLDDT {pair.nlrMeanPlddt.toFixed(2)}</small></td><td><b>{effector.alias}</b><small>{effector.length} aa · monomer pLDDT {pair.effectorMeanPlddt.toFixed(2)}</small></td><td><div className="megadock-cell"><b>{pair.megadockScore.toFixed(2)}</b><span>Global #{integer.format(pair.globalRank)} · Effector #{pair.effectorRank} · NLR #{pair.nlrRank}</span></div></td><td><div className="unavailable-cell"><b>Pending</b><span>Input submitted</span></div></td><td><div className="unavailable-cell"><b>Not available</b><span>Awaiting import</span></div></td><td>{badges(pair)}</td></tr>; })}{!rows.length && <tr className="empty-row"><td colSpan={8}>No imported candidate pairs match the selected filters.</td></tr>}</tbody></table></div><div className="table-footer"><label>Rows per page <select value={perPage} onChange={event => { setPerPage(Number(event.target.value)); setPage(1); }}>{[10, 20, 50, 100].map(item => <option key={item}>{item}</option>)}</select></label><div><button disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>Previous</button><span>Page {activePage} / {pageCount}</span><button disabled={activePage === pageCount} onClick={() => setPage(activePage + 1)}>Next</button></div></div><div className="matrix-note"><b>Download package.</b> A ZIP contains FASTA sequences for unique selected proteins and a TSV evidence table for the checked interaction pairs. MEGADOCK is the only completed evidence type in this release.</div></div></section>
    <section id="about" className="about"><p className="eyebrow">YANG LAB / DATA NOTE</p><h2>The prediction does not represent the actual biological function!</h2></section><footer>Maize NLR-Effector Interact Database (MaizeNEID) <span>Last updated by Yang Lab · 21 Jul 2026</span></footer>
    {detailsOpen && <div className="tool-modal-backdrop detail-modal-backdrop" role="presentation" onMouseDown={() => setDetailsOpen(false)}><article className="tool-modal detail-modal" role="dialog" aria-modal="true" aria-labelledby="pair-record-title" onMouseDown={event => event.stopPropagation()}><button className="tool-close" aria-label="Close interaction details" onClick={() => setDetailsOpen(false)}>×</button><p className="eyebrow">PAIR RECORD</p><h2 id="pair-record-title">{nlrById.get(selected.nlr)?.id} <span className="muted-x">×</span> {effectorById.get(selected.effector)?.alias}</h2><div className="detail-head"><div><p className="eyebrow">AVAILABLE EVIDENCE: MEGADOCK</p><h2>Docking score {selected.megadockScore.toFixed(2)}</h2><p>Global rank #{integer.format(selected.globalRank)} among all scored docking pairs.</p></div></div><div className="record-grid"><div><span>NLR class</span><b>{nlrById.get(selected.nlr)?.nlrClass}</b></div><div><span>NLR monomer pLDDT</span><b>{selected.nlrMeanPlddt.toFixed(2)}</b></div><div><span>Effector monomer pLDDT</span><b>{selected.effectorMeanPlddt.toFixed(2)}</b></div></div><div className="honest-empty-state"><span>3D</span><div><h3>No complex structure is available</h3><p>Complex models and interface residues will appear only after AF-Multimer or AlphaFold 3 results are imported.</p></div></div></article></div>}
    {toolsOpen && <div className="tool-modal-backdrop" role="presentation" onMouseDown={() => setToolsOpen(false)}><section className="tool-modal" role="dialog" aria-modal="true" aria-labelledby="converter-title" onMouseDown={event => event.stopPropagation()}><button className="tool-close" aria-label="Close ID converter" onClick={() => setToolsOpen(false)}>×</button><p className="eyebrow">TOOLS / GENE IDENTIFIER COMPATIBILITY</p><h2 id="converter-title">B73 V4 / V5 ID Converter</h2><p className="tool-intro">MaizeNEID records use B73 V5 identifiers. Paste one gene ID per line to convert between B73 V4 and V5 gene models.</p><div className="tool-status">{mappingStatus === "ready" ? `${integer.format(mappingRows.length)} mapping records loaded` : mappingStatus === "loading" ? "Loading mapping table…" : "The mapping table could not be loaded."}</div><label className="converter-input"><span>Input gene IDs</span><textarea value={converterInput} onChange={event => setConverterInput(event.target.value)} placeholder={converterDirection === "v4-to-v5" ? "Enter one B73 V4 gene ID per line\nExample: Zm00001d036030" : "Enter one B73 V5 gene ID per line\nExample: Zm00001eb436030"} /></label><div className="converter-controls"><label><span>Conversion direction</span><select value={converterDirection} onChange={event => { setConverterDirection(event.target.value as "v4-to-v5" | "v5-to-v4"); setConversionResults([]); }}><option value="v4-to-v5">B73 V4 → V5</option><option value="v5-to-v4">B73 V5 → V4</option></select></label><button className="convert-button" disabled={mappingStatus !== "ready" || !converterInput.trim()} onClick={runConverter}>Convert IDs</button><a className="mapping-download" href={mappingPath} download>Download mapping table</a></div>{conversionResults.length > 0 && <div className="converter-results"><div className="converter-result-heading"><div><span>Conversion results</span><b>{conversionResults.filter(item => item.status === "Mapped").length} / {conversionResults.length} mapped</b></div><div><button onClick={copyResults}>Copy results</button><button onClick={downloadResults}>Download results</button><button className="clear-button" onClick={clearConverter}>Clear</button></div></div><div className="converter-result-scroll"><table><thead><tr><th>Input ID</th><th>Converted ID</th><th>Status</th></tr></thead><tbody>{conversionResults.map((item, index) => <tr key={`${item.input}-${index}`}><td>{item.input}{item.input !== item.matched && <small>Matched as: {item.matched}</small>}</td><td>{item.result}</td><td><span className={item.status === "Mapped" ? "mapped" : "not-found"}>{item.status}</span></td></tr>)}</tbody></table></div></div>}</section></div>}
  </main>;
}

# MaizeNEID

**Maize NLR-Effector Interact Database (MaizeNEID)** is a Yang Lab resource for exploring precomputed structural evidence for predicted interactions between maize NLR immune receptors and pathogen effectors.

The current data release displays only the 911 entries from the latest `union_g2_e3_n3` candidate set (global top 2% ∪ Effector top 3 ∪ NLR top 3), which were prepared as AF-Multimer inputs. The source set comprises 127 supplied Fusarium Effector candidates and 164 maize receptor protein inputs. AF-Multimer, AlphaFold 3, complex structures, interface residues, and experimental validation are not included in this release.

## Repository structure

```text
MaizeNEID/
├── src/
│   ├── App.tsx                  # Main interface and interaction logic
│   ├── globals.css              # Layout and component styles
│   ├── theme.css                # Shenzhen University color theme
│   └── data/
│       ├── interactions.json    # Pair-level evidence displayed by the site
│       ├── effectors.json       # Effector metadata
│       ├── nlrs.json            # NLR metadata
│       └── dataset-metadata.json# Dataset version and evidence availability
├── public/                      # Static logos and public assets
├── index.html
├── package.json
├── vite.config.ts
└── netlify.toml                 # Automatic Netlify build configuration
```

## Local development

Node.js 22 or newer is recommended.

```bash
npm install
npm run dev
```

Create the production build with:

```bash
npm run build
```

The deployable output is generated in `dist/`. Do not edit files inside `dist/`; change files under `src/` and rebuild instead.

## GitHub to Netlify deployment

Upload the **contents of this folder** to the root of the GitHub repository. Do not upload this folder as a ZIP file.

The included `netlify.toml` tells Netlify to use:

- Build command: `npm run build`
- Publish directory: `dist`
- Production branch: `main`

After the repository is linked, every commit to `main` triggers a new deployment automatically.

## Updating scientific records

Pair-level evidence comes from `src/data/interactions.json`. Each displayed record contains:

- stable interaction ID;
- effector and NLR identifiers;
- pathogen metadata;
- the original MEGADOCK score;
- global, Effector-specific, and NLR-specific ranks;
- exact `union_g2_e3_n3` selection flags;
- monomer mean pLDDT values from the run manifest.

MEGADOCK is the only available pair-level evidence channel in the current release. The interface intentionally leaves AF-Multimer, AlphaFold 3, structure, and interface-residue fields blank. The table supports NLR class/ID and pathogen filters, pagination, and downloading checked pairs as a ZIP containing FASTA sequences plus a TSV evidence table.

## Routine update workflow

1. Ask Codex to modify this source folder.
2. Review the changed source or data files.
3. Upload/commit the changed files to the GitHub repository.
4. Netlify rebuilds and updates `https://maizeneid.netlify.app/` automatically.

## Citation

Replace the placeholder DOI in `src/App.tsx` after the project DOI is registered.

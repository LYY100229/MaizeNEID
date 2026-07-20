# MaizeNEID

**Maize NLR-Effector Interact Database (MaizeNEID)** is a Yang Lab resource for exploring precomputed structural evidence for predicted interactions between maize NLR immune receptors and pathogen effectors.

> The records included in this repository are illustrative prototype data. Replace them with curated prediction outputs before scientific release. Predictions are hypothesis-prioritization evidence and do not establish biological interaction or function.

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
│       └── nlrs.json            # NLR metadata
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

Pair-level evidence currently comes from `src/data/interactions.json`. Each record contains:

- stable interaction ID;
- effector and NLR identifiers;
- pathogen metadata;
- method-specific MEGADOCK, AlphaFold-Multimer, and AlphaFold 3 evidence;
- a consensus evidence count.

Keep method-specific scores in their native fields and avoid treating raw values from different methods as directly equivalent. Large structure files should eventually be hosted in object storage or a public research repository and referenced by stable URLs rather than committed directly to GitHub.

## Routine update workflow

1. Ask Codex to modify this source folder.
2. Review the changed source or data files.
3. Upload/commit the changed files to the GitHub repository.
4. Netlify rebuilds and updates `https://maizeneid.netlify.app/` automatically.

## Citation

Replace the placeholder DOI in `src/App.tsx` after the project DOI is registered.

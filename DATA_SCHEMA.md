# MaizeNEID data schema

## `src/data/interactions.json`

```json
{
  "id": "INT-00017",
  "effector": "PpCSEP_00412",
  "nlr": "ZmNLR-07",
  "pathogen": "P. polysora",
  "species": "Southern corn rust",
  "consensus": 3,
  "megadock": { "value": "-284.6", "detail": "Top 0.8%", "state": "strong" },
  "afm": { "value": "0.86", "detail": "pDockQ", "state": "strong" },
  "af3": { "value": "0.81", "detail": "ipTM", "state": "strong" }
}
```

Allowed evidence states are `strong`, `moderate`, `weak`, and `pending`.

The current interface reads `interactions.json` directly. The NLR and effector metadata files are prepared for future browser/detail pages. All prototype identifiers and values should be replaced with curated records before release.

# MaizeNEID data schema

## Current release

- Dataset: `cytoplasmic_mature_v1`
- MEGADOCK summary: `union_g2_e3_n5/megadock_scored_pairs.tsv`
- Effector inputs: 127
- Maize receptor protein inputs: 164
- Scored pairs: 20,828
- Selected union: 1,187 pairs
- Available evidence: MEGADOCK only

## `src/data/interactions.json`

Each record retains the original pair identifiers, MEGADOCK score, global rank and percentile, within-Effector rank and percentile, within-NLR rank and percentile, union-selection flags, and monomer mean pLDDT values. No inferred AF-Multimer, AlphaFold 3, structure, sequence-interface, contact, or experimental fields are generated.

## `src/data/effectors.json`

Contains the 127 supplied mature cytoplasmic Effector inputs and their run-manifest identifiers, sequence lengths, original headers, EffectorP cytoplasmic probabilities, signal-peptide lengths, and mature-sequence lengths where present in the source header.

## `src/data/nlrs.json`

Contains the 164 maize receptor protein inputs used in the MEGADOCK run, including the stable protein identifier, run input identifier, sequence length, and original header.

## `src/data/dataset-metadata.json`

Records dataset version, retrieval date, exact record counts, evidence availability, and the explicit absence of complex-structure and interface-residue data.

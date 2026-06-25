# Licensing and Public Demo Strategy

## Dataset Licensing Summary

| Dataset | License | Can Redistribute | In Repo |
|---------|---------|-----------------|---------|
| Million Song Dataset | Research only | No | No (stub) |
| Taste Profile Subset | Research only | No | No (stub) |
| MusicBrainz | CC0 1.0 | Yes | No (stub) |
| ListenBrainz | CC0 / user-consented | Attribution | No (stub) |
| Synthetic sample data | Our own (MIT-like) | Yes | ✅ Yes |

## Public Demo Policy

**This repository contains no raw data from MSD, Taste Profile, musiXmatch, or ListenBrainz.**

What IS included:
- Synthetic sample data generated to match statistical distributions of real datasets
- Schema definitions and field documentation
- Download instructions in docs/data_card.md

What is NOT included:
- Raw MSD HDF5 files
- Taste Profile triplets (user-song-count)
- Any song lyrics or lyric features
- MusicBrainz dump files

## Portfolio / Interview Use

This project is safe to share publicly as a portfolio piece because:
1. No licensed data is committed
2. The synthetic data demonstrates the same capabilities
3. Architecture, code quality, and evaluation methodology are the portfolio artifacts

## Reproducing with Real Data

If you have access to the datasets:
1. Follow instructions in `docs/data_card.md` to download
2. Implement the loader stubs in `src/ingestion/`
3. Run `make etl make train make index make evaluate`
4. Keep all raw data files outside the repo (they are gitignored)

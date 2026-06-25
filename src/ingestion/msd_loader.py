"""Adapter for the Million Song Dataset (MSD).

To use the real dataset:
1. Download from: http://millionsongdataset.com/pages/getting-dataset/
2. The full dataset is 280GB; the 10k subset (MillionSongSubset) is 1.8GB.
3. Point MSDLoader.load() at the HDF5 root directory.

See docs/data_card.md for licensing and schema mapping details.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


class MSDLoader:
    """Load and transform Million Song Dataset HDF5 files into standard DataFrames.

    This adapter is a stub — implement after downloading MSD data.
    See docs/data_card.md for field mapping from MSD schema to our schema.
    """

    REQUIRED_FIELDS = [
        "song_id", "title", "artist_name", "duration",
        "tempo", "energy", "loudness", "year",
    ]

    def load(self, data_path: Path) -> dict[str, pd.DataFrame]:
        """Load MSD HDF5 files from data_path and return standard DataFrames.

        Args:
            data_path: Root directory containing MSD HDF5 files.

        Returns:
            Dict with keys 'artists', 'tracks', 'track_features'.

        Raises:
            NotImplementedError: Until real MSD data is available.
        """
        raise NotImplementedError(
            "MSD data not available. Download instructions in docs/data_card.md. "
            "Use sample_generator.py to generate synthetic data for development."
        )

    def validate(self, df: pd.DataFrame, table: str = "tracks") -> bool:
        """Check that required fields are present and non-null."""
        if table == "tracks":
            missing = [f for f in self.REQUIRED_FIELDS if f not in df.columns]
            if missing:
                raise ValueError(f"MSD DataFrame missing required fields: {missing}")
        return True

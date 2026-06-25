"""Adapter for the MSD Taste Profile Subset.

The Taste Profile Subset contains 48M user-song play counts from Echo Nest.
Download: http://millionsongdataset.com/tasteprofile/

License: Academic research only. Do not redistribute raw data.
See docs/data_card.md and docs/licensing_notes.md.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


class TasteProfileLoader:
    """Load Taste Profile triplets (user_id, song_id, play_count) into standard schema."""

    def load(self, data_path: Path) -> pd.DataFrame:
        """Parse Taste Profile triplet file into a listens-schema DataFrame.

        Args:
            data_path: Path to train_triplets.txt (tab-separated).

        Raises:
            NotImplementedError: Until real Taste Profile data is available.
        """
        raise NotImplementedError(
            "Taste Profile data not available. "
            "Download from http://millionsongdataset.com/tasteprofile/ "
            "then point this loader at the train_triplets.txt file."
        )

    def validate(self, df: pd.DataFrame) -> bool:
        required = ["user_id", "song_id", "play_count"]
        missing = [c for c in required if c not in df.columns]
        if missing:
            raise ValueError(f"Missing columns: {missing}")
        return True

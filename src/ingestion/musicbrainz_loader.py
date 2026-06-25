"""Adapter for MusicBrainz metadata.

MusicBrainz is an open music encyclopedia. Data dumps available at:
https://musicbrainz.org/doc/MusicBrainz_Database/Download

License: CC0 1.0 (fully open). Safe to use in any context.
See docs/data_card.md.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


class MusicBrainzLoader:
    """Load MusicBrainz artist and recording data into standard schema.

    To use:
    1. Download the full DB dump from https://musicbrainz.org/doc/MusicBrainz_Database/Download
    2. Or use the MusicBrainz JSON API for targeted lookups.
    3. Map MB artist/recording IDs (MBIDs) to our artist_id / track_id schema.
    """

    def load_artists(self, data_path: Path) -> pd.DataFrame:
        """Load MB artist dump and map to our artists schema.

        Raises:
            NotImplementedError: Until MB data is available.
        """
        raise NotImplementedError(
            "MusicBrainz data not available. "
            "Download from https://musicbrainz.org/doc/MusicBrainz_Database/Download"
        )

    def load_recordings(self, data_path: Path) -> pd.DataFrame:
        """Load MB recordings dump and map to our tracks schema.

        Raises:
            NotImplementedError: Until MB data is available.
        """
        raise NotImplementedError(
            "MusicBrainz data not available."
        )

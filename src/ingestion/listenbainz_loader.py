"""Adapter for ListenBrainz listen history data.

ListenBrainz is an open-source listen tracking service.
API docs: https://listenbrainz.readthedocs.io/en/latest/users/api/core.html

License: CC0 / open. User-submitted listen data. Respect user privacy guidelines.
See docs/data_card.md.
"""

from __future__ import annotations

import pandas as pd


class ListenBrainzLoader:
    """Fetch or load ListenBrainz listen data into our listens schema.

    Two usage modes:
    1. API mode: fetch recent listens for a specific user via httpx.
    2. Dump mode: load from a downloaded ListenBrainz data dump.
    """

    BASE_URL = "https://api.listenbrainz.org/1"

    def load_from_api(self, username: str, max_ts: int | None = None) -> pd.DataFrame:
        """Fetch all listens for a user from the ListenBrainz API.

        Args:
            username: ListenBrainz username.
            max_ts: Fetch listens before this Unix timestamp (pagination).

        Raises:
            NotImplementedError: Requires httpx and a valid username.
        """
        raise NotImplementedError(
            "ListenBrainz API integration not yet implemented. "
            "See https://listenbrainz.readthedocs.io/ for API documentation."
        )

    def map_to_schema(self, raw_df: pd.DataFrame) -> pd.DataFrame:
        """Map ListenBrainz listen format to our listens table schema."""
        raise NotImplementedError

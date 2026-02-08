"""Temporal smoothing filter for real-time ROM measurements.

Implements a sliding-window median filter with outlier rejection and
stability detection for auto-capture during guided measurement flows.

Design goals:
  • Remove single-frame jitter without introducing noticeable lag
  • Detect when the patient has reached a stable end-of-range position
  • Reject sudden spikes caused by tracking loss or occlusion
"""

from __future__ import annotations

import time
from collections import deque
from dataclasses import dataclass, field
from statistics import median


@dataclass
class StabilityState:
    """Snapshot of angle stability for a single measurement channel."""

    smoothed_degrees: float
    is_stable: bool = False
    stable_since_ms: float = 0.0
    auto_captured: bool = False
    raw_degrees: float = 0.0
    frames_in_window: int = 0


@dataclass
class _ChannelState:
    """Internal mutable state for one (joint, movement, side) channel."""

    window: deque[float] = field(default_factory=lambda: deque(maxlen=10))
    last_smoothed: float = 0.0
    stable_since: float | None = None
    auto_captured: bool = False


class TemporalFilter:
    """Per-channel sliding-window median filter with stability detection.

    Parameters
    ----------
    window_size:
        Number of frames in the sliding window (default 10).
    outlier_threshold_degrees:
        If a new reading deviates more than this from the current smoothed
        value, it is treated as an outlier and discarded (default 15°).
    stability_threshold_degrees:
        The angle must remain within ±this value to be considered stable
        (default 2.0°).
    stability_hold_ms:
        How long (milliseconds) the angle must stay stable before
        auto-capture fires (default 800).
    """

    def __init__(
        self,
        window_size: int = 10,
        outlier_threshold_degrees: float = 15.0,
        stability_threshold_degrees: float = 2.0,
        stability_hold_ms: float = 800.0,
    ):
        self.window_size = window_size
        self.outlier_threshold = outlier_threshold_degrees
        self.stability_threshold = stability_threshold_degrees
        self.stability_hold_ms = stability_hold_ms
        self._channels: dict[str, _ChannelState] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def push(
        self,
        channel_key: str,
        raw_degrees: float,
        timestamp_ms: float | None = None,
    ) -> StabilityState:
        """Add a new raw angle reading and return the smoothed + stability state.

        Parameters
        ----------
        channel_key:
            Unique key identifying the measurement channel, e.g.
            ``"shoulder-flexion-right"``.
        raw_degrees:
            The unfiltered ROM angle from the current frame.
        timestamp_ms:
            Monotonic timestamp in milliseconds.  Defaults to ``time.monotonic() * 1000``.

        Returns
        -------
        StabilityState with smoothed value and stability/auto-capture flags.
        """
        now = timestamp_ms if timestamp_ms is not None else time.monotonic() * 1000.0
        ch = self._get_or_create(channel_key)

        # Outlier rejection: skip if the value jumps too far from current smoothed
        if len(ch.window) >= 3 and abs(raw_degrees - ch.last_smoothed) > self.outlier_threshold:
            return StabilityState(
                smoothed_degrees=ch.last_smoothed,
                is_stable=ch.stable_since is not None,
                stable_since_ms=self._stable_duration(ch, now),
                auto_captured=ch.auto_captured,
                raw_degrees=raw_degrees,
                frames_in_window=len(ch.window),
            )

        ch.window.append(raw_degrees)
        smoothed = round(median(ch.window), 2)
        ch.last_smoothed = smoothed

        # Stability tracking
        if len(ch.window) >= 3:
            recent = list(ch.window)[-3:]
            spread = max(recent) - min(recent)
            if spread <= self.stability_threshold:
                if ch.stable_since is None:
                    ch.stable_since = now
            else:
                ch.stable_since = None
                ch.auto_captured = False
        else:
            ch.stable_since = None

        stable_dur = self._stable_duration(ch, now)
        is_stable = ch.stable_since is not None and stable_dur >= self.stability_hold_ms

        # Auto-capture fires once
        if is_stable and not ch.auto_captured:
            ch.auto_captured = True

        return StabilityState(
            smoothed_degrees=smoothed,
            is_stable=is_stable,
            stable_since_ms=stable_dur,
            auto_captured=ch.auto_captured,
            raw_degrees=raw_degrees,
            frames_in_window=len(ch.window),
        )

    def reset_channel(self, channel_key: str) -> None:
        """Clear all state for a specific channel (e.g. when moving to next movement)."""
        self._channels.pop(channel_key, None)

    def reset_all(self) -> None:
        """Clear all channels."""
        self._channels.clear()

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _get_or_create(self, key: str) -> _ChannelState:
        if key not in self._channels:
            self._channels[key] = _ChannelState(
                window=deque(maxlen=self.window_size),
            )
        return self._channels[key]

    @staticmethod
    def _stable_duration(ch: _ChannelState, now: float) -> float:
        if ch.stable_since is None:
            return 0.0
        return now - ch.stable_since

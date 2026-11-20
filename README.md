# MAYU ET AL.

[Listen to MAYU ET AL.](https://mayabachrach.github.io/radio/)

A single synchronized station playing the original generated 40-second composition. Press Play to tune in. NOW and NEXT are placeholder credits. The station editor remains at `studio.html`.

## Install

- Phone: open the website in Safari and choose Share → Add to Home Screen, or use Chrome’s install menu on Android.
- Chrome 116+: download the repository ZIP, extract it, open chrome://extensions, enable Developer mode, choose Load unpacked and select the extension directory. The offscreen document owns audio independently of the popup.
- Desktop: from a checkout, run `cd desktop`, `npm install`, then `npm start`. The frameless Electron window uses the same renderer in both sizes. Drag the title strip, use Mini or Expand to resize, and Pin to toggle always-on-top. Quit from the tray menu.

## Shared implementation

All clients load `extension/device.css` and `extension/device.js`. Change the semantic variables at the start of device.css to recolor chrome, LCD, accent and the spectrum. Override the same variables for an alternative palette. Icon artwork lives in extension/signal.svg and the matching PNGs. The Classified reference uses text.bmp and numbers.bmp sprite sheets. The new display uses selectable system lettering and isolated bidirectional metadata.

`extension/audio.js` owns the media element, synchronization, filters and analyser. Replace the generated source and loop/seek policy there when a stream becomes available. The bars use analyser samples; the wave mesh is decorative. The service worker caches the application shell. Background playback and lock-screen controls depend on browser and OS audio policy.

Original Classified skin design by Sven Kistner, classic version by Zarko Jovic and GuidoD, edited by Wildrose-Wally.

## Music import and scheduling — local pilot

The original Python downloader submitted by the project owner was adapted as `tools/download_songs.py`. It calls `spotDL` to obtain Spotify playlist metadata and match audio through supported third-party providers. It does not download Spotify's protected audio files.

**Set up on your own computer:** Install Python 3.11+, FFmpeg and dependencies: `python -m pip install spotdl mutagen`.

**1. Import a playlist locally** (nothing is uploaded):

```bash
python tools/download_songs.py "https://open.spotify.com/playlist/PLAYLIST_ID"
```

MP3 files are saved by playlist name in `~/Music/MAYU-ET-AL/`. Pass an optional second positional directory argument to choose another location. This tool no longer has a hardcoded default Spotify playlist. It still supports the optional legacy RAW directory copy when a RAW folder exists.

**2. Publish only recordings you have permission to host and broadcast:**

```bash
python tools/publish_playlist.py --source "/path/to/MAYU-ET-AL/Playlist Name" --name "Maya" --confirm-rights
```

The publish command reads real MP3 durations and titles (using Mutagen), copies recordings to `media/<playlist-id>/`, and updates `station.json`. It **does not upload or push anything**. GitHub and GitHub Pages are public even when only five friends listen, so do not commit recordings without relevant permissions.

**3. Update the schedule:** The first published playlist receives a daily `00:00` slot in the `Asia/Jerusalem` timezone. Add additional playlists using the same publish command; edit the `schedule` array in `station.json` to assign times, for example:

```json
"schedule": [
  {"days":[0,1,2,3,4,5,6],"start":"00:00","playlist":"maya"},
  {"days":[0,1,2,3,4,5,6],"start":"18:00","playlist":"friends-mix"}
]
```

Day `0` is Sunday, day `6` is Saturday. Unspecific slots use the previous most recent entry in the weekly schedule. The website, desktop app and Chrome extension all read this manifest; Chrome/desktop clients fetch it from the published GitHub Pages site. The player selects the appropriate track and offset based on the clock, rather than streaming 24/7 from a central broadcast server. Listener timing can drift by a few seconds due to buffering, and DST transitions may need special attention.

**Limitations:** No user-facing upload form, Spotify authentication, or new MP3s are published by this change. Existing generated demo audio remains the fallback until a licensed playlist is published. This local-import approach is intended for a small proof-of-concept, not production radio hosting.

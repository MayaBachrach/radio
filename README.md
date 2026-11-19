# RADIO 001
An independent internet-radio starter. Separate from BGU Radio.

**Site:** https://mayabachrach.github.io/radio/ (after enabling GitHub Pages)
**Editor:** https://mayabachrach.github.io/radio/studio.html

This demo is a **synchronized browser player**, not a real server-side 24/7 radio stream. The same 40-second original elevator-style tune repeats based on a common epoch; each visitor clicks Play to hear the current position. The tune is synthesized locally by music-synth.js, so no commercial recording is used and no audio hosting is necessary for the starter.

To publish, open repository Settings → Pages → Build and deployment → Deploy from a branch → main /(root), Save.

To edit a playlist, visit studio.html and download station.json; commit it to the repo root, uploading any authorized MP3 files into audio/ when replacing the generated demo. All listeners reload station.json every 60 seconds.

The Chrome extension was provided in the initial ZIP, but this repo currently contains the web site only. The extension will need an update for the generated:elevator demo source before it can play the current station.

No music-rights clearance is implied for songs that are not owned or licensed for internet transmission.

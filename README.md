# RADIO 001

The homepage is the actual **Winamp5 Classified v5.5** skin, rendered in Webamp at its **original native three-window layout (275×348 total)**. No imitation CSS, no Y2K redesign, slogans, oversized player, or decorative page UI.

- Website: https://mayabachrach.github.io/radio/
- Studio (separate utility): https://mayabachrach.github.io/radio/studio.html
- GitHub: https://github.com/MayaBachrach/radio

## Original skin

Uploaded reference: Winamp5_Classified_v5.5.wsz

The exact uploaded file has MD5 checksum \`b0fb83cc20af3abe264291bb17fb2a13\` and exists in the Winamp Skin Museum CDN at:

https://cdn.webampskins.org/skins/b0fb83cc20af3abe264291bb17fb2a13.wsz

The page loads that **same** .wsz into [Webamp](https://docs.webamp.org/) without extracting or redrawing the original design. Webamp is loaded from unpkg, and the original skin is loaded from the skin museum CDN; both require internet access.

## Audio

The previous 40-second original synthesized elevator-music loop remains available via \`music-synth.js\`. It loads as one Webamp track, with Repeat enabled, and upon starting or resuming, seeks to the shared clock position. This is a **synchronized browser demo**, not a genuine live internet radio server. Like the original Winamp, the user can change playback position or stop it via native skin controls.

The site intentionally does not show controls or content outside the Winamp skin. The Chrome extension files in \`extension/\` are not modified by this website-only change.

## License note

The supplied skin's included readme identifies its designers and marks their work copyright. Before publicly redistributing the skin outside an embed, verify the owners' terms. This implementation loads the museum's copy remotely.

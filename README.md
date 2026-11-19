# RADIO 001

**Live site:** https://mayabachrach.github.io/radio/

This website is only the original **Winamp5 Classified v5.5** skin, displayed with Webamp. It contains two native classic Winamp windows stacked vertically:
- Main player, 275×116
- Equalizer, 275×116

The playlist window is deliberately hidden. Main and equalizer close buttons, minimize/shade controls, and titlebar dragging are disabled. The X glyphs embedded in the original skin artwork are masked with tiny CSS patches. The player is enlarged by a plain CSS scale transform for legibility, **not recreated or redesigned**.

## Original skin

The exact user-provided `Winamp5_Classified_v5.5.wsz` is now committed at `skin/Winamp5_Classified_v5.5.wsz`. GitHub Actions downloaded it from the Winamp Skin Museum and verified its MD5 checksum `b0fb83cc20af3abe264291bb17fb2a13`. The website prefers this **same-origin local** skin to avoid CORS or CDN problems, and only falls back to museum URLs if it is not available.

## Playback

The initial 40-second original generated demo tune still loops. The webpage requests playback immediately; browser autoplay policies can prevent audible playback until the listener clicks the skin's own Play button. When playback begins or resumes, the audio seeks to the synchronized clock position, approximating a shared radio.

This is still a **synchronized in-browser demo, not a server-streamed live radio station**.

## Editing

The separate station editor remains at https://mayabachrach.github.io/radio/studio.html but is not linked on the minimal homepage. The Chrome extension remains a separate implementation under `extension/`, not modified in this website-only update.

## Skin credits

According to the included original skin readme: Original Design by Sven Kistner; Classic Version by Zarko Jovic and GuidoD; Edited by Wildrose-Wally. Copyright © 2004–2007 original authors. Check original licensing terms before broader redistribution or commercial use.

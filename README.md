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

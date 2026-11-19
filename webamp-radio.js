/* Use the original user-provided .wsz skin through Webamp.
 * No recreation, rescaling or visual enhancements.
 *
 * Uploaded .wsz MD5: b0fb83cc20af3abe264291bb17fb2a13
 * CDN artifact with the same content hash:
 * https://cdn.webampskins.org/skins/b0fb83cc20af3abe264291bb17fb2a13.wsz
 */
import Webamp from "https://unpkg.com/webamp@2.3.1";

const SKIN_URL = "https://cdn.webampskins.org/skins/b0fb83cc20af3abe264291bb17fb2a13.wsz";
const status = document.getElementById("status");
const container = document.getElementById("player");
const epoch = 1795046400;
const duration = 40;

function synchronizedOffset() {
  return ((Date.now() / 1000 - epoch) % duration + duration) % duration;
}

async function main() {
  if (!Webamp.browserIsSupported()) {
    status.textContent = "This browser does not support Webamp.";
    return;
  }

  // The existing original audio loop is still used, but the presentation is
  // 100% Webamp. No modern UI is placed around the skin.
  const trackUrl = window.makeElevatorAudioUrl();
  const player = new Webamp({
    initialSkin: { url: SKIN_URL },
    initialTracks: [{
      url: trackUrl,
      duration,
      metaData: { artist: "RADIO 001", title: "Elevator To Nowhere" }
    }],
    windowLayout: {
      main: { position: { top: 0, left: 0 }, closed: false },
      equalizer: { position: { top: 116, left: 0 }, closed: false },
      playlist: { position: { top: 232, left: 0 }, closed: false, size: { extraHeight: 0, extraWidth: 0 } }
    },
    enableDoubleSizeMode: false,
    zIndex: 1,
    enableMediaSession: true
  });

  // Use the original player controls. Enable repeating for the single demo track.
  await player.renderInto(container);
  if (!player.isRepeatEnabled()) player.toggleRepeat();
  status.textContent = "";

  let wasPlaying = false;
  // When a listener presses Play (or resumes), join the shared clock.
  // Never force playback; browser autoplay rules and the original Play button apply.
  setInterval(() => {
    const playing = player.getMediaStatus() === "PLAYING";
    if (playing && !wasPlaying) {
      player.seekToTime(synchronizedOffset());
    }
    wasPlaying = playing;
  }, 300);
}

main().catch((error) => {
  console.error("RADIO 001 — Webamp initialization failed:", error);
  status.textContent = "Could not load the Winamp skin. Check the connection and refresh.";
});

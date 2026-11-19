/* Actual Winamp5 Classified v5.5 skin in Webamp. Two windows: main and equalizer.
 * Original skin checksum MD5: b0fb83cc20af3abe264291bb17fb2a13.
 * The source is the original skin archive, not the default Winamp skin.
 */
import Webamp from "https://unpkg.com/webamp@2.3.1";

const status = document.getElementById("status");
const container = document.getElementById("player");
const SKIN_SOURCES = [
  "https://r2.webampskins.org/skins/b0fb83cc20af3abe264291bb17fb2a13.wsz",
  "https://cdn.webampskins.org/skins/b0fb83cc20af3abe264291bb17fb2a13.wsz"
];
const epoch = 1795046400;
const duration = 40;

function livePosition() {
  return ((Date.now() / 1000 - epoch) % duration + duration) % duration;
}

async function loadOriginalSkin() {
  for (const url of SKIN_SOURCES) {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) continue;
      const bytes = await res.arrayBuffer();
      const header = new Uint8Array(bytes, 0, Math.min(4, bytes.byteLength));
      if (bytes.byteLength < 100000 || header[0] !== 0x50 || header[1] !== 0x4b)
        throw new Error("Expected original .wsz ZIP, received invalid content");
      return URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
    } catch (error) {
      console.warn("RADIO 001: skin URL failed", url, error);
    }
  }
  throw new Error("Original skin could not be downloaded");
}

async function main() {
  if (!Webamp.browserIsSupported()) throw new Error("Unsupported browser");
  const skinUrl = await loadOriginalSkin();
  const player = new Webamp({
    initialSkin: { url: skinUrl },
    initialTracks: [{
      url: window.makeElevatorAudioUrl(),
      duration,
      metaData: { artist: "RADIO 001", title: "Elevator To Nowhere" }
    }],
    windowLayout: {
      main: { position: { top: 0, left: 0 }, closed: false },
      equalizer: { position: { top: 116, left: 0 }, closed: false }
    },
    enableDoubleSizeMode: false,
    enableHotkeys: false,
    zIndex: 1
  });

  // Protect the entire radio from Close commands even via a context menu.
  player.onWillClose((cancel) => cancel());
  await player.renderInto(container);
  await player.skinIsLoaded();
  status.textContent = "";
  if (!player.isRepeatEnabled()) player.toggleRepeat();

  // Enter the shared broadcast at the current position whenever playback starts.
  let wasPlaying = false;
  setInterval(() => {
    const playing = player.getMediaStatus() === "PLAYING";
    if (playing && !wasPlaying) player.seekToTime(livePosition());
    wasPlaying = playing;
  }, 250);

  // Attempt autoplay. Chrome/Safari may require pressing the original Play button.
  player.seekToTime(livePosition());
  player.play();
}

main().catch((error) => {
  console.error("RADIO 001 startup failed", error);
  status.textContent = "The original Winamp skin could not load. Please refresh.";
});

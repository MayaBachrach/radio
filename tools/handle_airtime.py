#!/usr/bin/env python3
"""Process an approved MAYU airtime request using the original spotDL wrapper.

Runs in GitHub Actions only after the issue author's permissions or a maintainer
label has been checked. No arbitrary shell commands are constructed from issues.
"""
import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
MARKER = "<!-- MAYU-SCHEDULE-V1 -->"
MAX_TRACKS = 20
MAX_LIBRARY_BYTES = 450 * 1024 * 1024
RECORDING_SIZE_LIMIT = 12 * 1024 * 1024

def parse_request(body):
    if not isinstance(body, str) or len(body) > 7000 or MARKER not in body:
        raise ValueError("Not a valid MAYU schedule request")
    match = re.search(r"~~~json\s*(\{[\s\S]*?\})\s*~~~", body)
    if not match:
        raise ValueError("Missing MAYU JSON request block")
    data = json.loads(match.group(1))
    if not isinstance(data, dict) or data.get("version") != 1:
        raise ValueError("Unsupported request version")
    for key, maxlen in (("curator", 48), ("name", 72)):
        value = data.get(key)
        if not isinstance(value, str) or not (1 <= len(value.strip()) <= maxlen):
            raise ValueError("Invalid " + key)
        if any(c in value for c in "\r\n<>"):
            raise ValueError("Invalid characters in " + key)
    for key, upper in (("day", 6), ("hour", 23)):
        number = data.get(key)
        if type(number) is not int or not 0 <= number <= upper:
            raise ValueError("Invalid " + key)
    if type(data.get("replace")) is not bool:
        raise ValueError("Replace must be boolean")
    expected = data.get("expected_playlist")
    if expected is not None and (not isinstance(expected, str) or not re.fullmatch(r"[\w-]{1,80}", expected)):
        raise ValueError("Invalid expected playlist")
    if data["replace"] != (expected is not None):
        raise ValueError("Replacement confirmation does not match the selected slot")
    if data.get("rights_confirmed") is not True:
        raise ValueError("An affirmative authorization statement is required")
    url = data.get("spotify_url")
    if not isinstance(url, str):
        raise ValueError("Missing Spotify playlist URL")
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc != "open.spotify.com":
        raise ValueError("Only Spotify playlist links are supported")
    match = re.fullmatch(r"/playlist/([A-Za-z0-9]{22})/?", parsed.path)
    if not match:
        raise ValueError("Expected a Spotify playlist link, not a track or album")
    if parsed.query or parsed.fragment:
        raise ValueError("Use a clean Spotify playlist link")
    data["spotify_url"] = "https://open.spotify.com/playlist/" + match.group(1)
    data["playlist_slug"] = "spotify-" + match.group(1)
    return data

def authorization(event):
    if event.get("issue", {}).get("pull_request"):
        raise ValueError("Requests must be GitHub issues")
    action = event.get("action")
    if action == "opened" and event["issue"].get("author_association") in ("OWNER", "MEMBER", "COLLABORATOR"):
        return
    if action == "labeled" and event.get("label", {}).get("name") == "radio-approved":
        return
    if (action == "created" and event.get("comment", {}).get("body", "").strip() == "/approve"
            and event.get("comment", {}).get("author_association") in ("OWNER", "MEMBER", "COLLABORATOR")):
        return
    raise PermissionError("A maintainer must comment /approve or add the radio-approved label")

def exact_slot(station, day, hour):
    clock = f"{hour:02}:00"
    return next((slot for slot in station.get("schedule", [])
                 if slot.get("start") == clock and slot.get("durationMinutes") == 60
                 and day in slot.get("days", [])), None)

def validate_conflict(station, request):
    old = exact_slot(station, request["day"], request["hour"])
    was = old.get("playlist") if old else None
    if was != request["expected_playlist"]:
        raise ValueError("The selected timeslot changed after submission. Please submit a new request.")
    if was and not request["replace"]:
        raise ValueError("Slot already occupied: replacement was not confirmed.")

def save_schedule(station, request, tracks):
    validate_conflict(station, request)
    slug = request["playlist_slug"]
    station["name"] = "MAYU ET AL."
    station.setdefault("timeZone", "Asia/Jerusalem")
    station.setdefault("playlists", {})[slug] = {
        "name": request["name"], "curator": request["curator"],
        "spotifyUrl": request["spotify_url"], "tracks": tracks
    }
    if not station.get("fallbackPlaylist"):
        station["fallbackPlaylist"] = slug
    new = []
    for entry in station.get("schedule", []):
        if (entry.get("start") == f'{request["hour"]:02}:00'
                and entry.get("durationMinutes") == 60
                and request["day"] in entry.get("days", [])):
            leftover = [d for d in entry.get("days", []) if d != request["day"]]
            if leftover:
                new.append({**entry, "days": leftover})
        else:
            new.append(entry)
    new.append({
        "days": [request["day"]], "start": f'{request["hour"]:02}:00',
        "durationMinutes": 60, "playlist": slug
    })
    station["schedule"] = sorted(
        new, key=lambda s: (min(s.get("days", [0])), s.get("start", "00:00"))
    )
    return station

def run(command, timeout=900, check=True):
    return subprocess.run(command, check=check, timeout=timeout, cwd=ROOT)


def find_mp3s(folder):
    if not folder.is_dir():
        raise ValueError(f"Audio directory does not exist: {folder}")
    audio = sorted(
        (p for p in folder.rglob("*") if p.is_file() and p.suffix.lower() == ".mp3"),
        key=lambda p: (
            int(match.group(1)) if (match := re.match(r"^(\d+)\s*-", p.name)) else float("inf"),
            p.relative_to(folder).as_posix().casefold(),
        ),
    )
    for path in audio[:MAX_TRACKS]:
        if path.is_symlink() or not path.resolve().is_relative_to(folder.resolve()):
            raise ValueError("Symlinked recordings are not accepted")
        if not 0 < path.stat().st_size <= RECORDING_SIZE_LIMIT:
            raise ValueError(f"Recording is empty or exceeds the 12 MB pilot limit: {path.name}")
    return audio[:MAX_TRACKS]

def download_playlist(request, work):
    """Save Spotify metadata, cap it, then use the user's download_songs.py."""
    work.mkdir(parents=True, exist_ok=True)
    saved = work / "spotify.spotdl"
    run([sys.executable, "-m", "spotdl", "save", request["spotify_url"],
         "--save-file", str(saved)], timeout=180)
    source = json.loads(saved.read_text(encoding="utf-8"))
    if not isinstance(source, list) or not source:
        raise ValueError("spotDL returned no tracks for this playlist")
    limited = work / "limited.spotdl"
    limited.write_text(json.dumps(source[:MAX_TRACKS], ensure_ascii=False), encoding="utf-8")
    out = work / "extracted"
    out.mkdir(exist_ok=True)
    result = run([sys.executable, "tools/download_songs.py", str(limited), str(out)],
                 timeout=900, check=False)
    audio = find_mp3s(out)
    print(f"Found {len(audio)} MP3s in {out}")
    if not audio:
        raise RuntimeError(
            f"Audio import produced no MP3s in {out} (downloader exit {result.returncode}). "
            "Inspect the provider errors above. If YouTube requires sign-in, use an authorized "
            "MP3 source instead. The airtime slot has not been changed."
        )
    return audio

def prepare_tracks(audio, slug):
    from publish_playlist import read_track
    import shutil
    from urllib.parse import quote
    dest = ROOT / "media" / slug
    dest.mkdir(parents=True, exist_ok=True)
    tracks = []
    for i, audio_file in enumerate(audio, 1):
        # A stable, safe public name; metadata supplies the artist and track title.
        title = re.sub(r"[^\w.\-]+", "-", audio_file.stem, flags=re.UNICODE)[:90].strip("-.") or "track"
        target = dest / f"{i:02}-{title}.mp3"
        meta = read_track(audio_file)
        shutil.copy2(audio_file, target)
        tracks.append({**meta, "src": f"media/{slug}/{quote(target.name)}"})
    return tracks

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--event", default=os.getenv("GITHUB_EVENT_PATH"), type=Path)
    p.add_argument("--work", default=os.getenv("RUNNER_TEMP", "/tmp") + "/mayu-request", type=Path)
    p.add_argument("--validate-only", action="store_true")
    p.add_argument("--audio-dir", type=Path, help="Existing local MP3s approved for this playlist")
    args = p.parse_args()
    if not args.event or not args.event.is_file():
        p.error("GitHub issue event JSON is required")
    event = json.loads(args.event.read_text(encoding="utf-8"))
    authorization(event)
    req = parse_request(event["issue"]["body"])
    print(f"MAYU request: day={req['day']} time={req['hour']:02}:00 curator={req['curator']} playlist={req['playlist_slug']}")
    station_file = ROOT / "station.json"
    station = json.loads(station_file.read_text(encoding="utf-8"))
    validate_conflict(station, req)
    if args.validate_only:
        return
    slug = req["playlist_slug"]
    old = station.get("playlists", {}).get(slug, {})
    tracks = old.get("tracks", [])
    if args.audio_dir or not tracks:
        mp3s = find_mp3s(args.audio_dir) if args.audio_dir else download_playlist(req, args.work)
        if not mp3s:
            raise ValueError(f"No MP3s found in {args.audio_dir}")
        existing = sum(p.stat().st_size for p in (ROOT / "media").rglob("*.mp3")) if (ROOT / "media").exists() else 0
        proposed = sum(p.stat().st_size for p in mp3s)
        if existing + proposed > MAX_LIBRARY_BYTES:
            raise ValueError("The free pilot music library limit has been reached")
        tracks = prepare_tracks(mp3s, slug)
    station = save_schedule(station, req, tracks)
    station_file.write_text(json.dumps(station, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Published {len(tracks)} tracks; scheduled day {req['day']} {req['hour']:02}:00.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"RADIO REQUEST FAILED: {type(e).__name__}: {e}", file=sys.stderr)
        raise SystemExit(1)

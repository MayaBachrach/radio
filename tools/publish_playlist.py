#!/usr/bin/env python3
"""Publish approved local MP3s to MAYU ET AL.'s static radio library."""
import argparse
import json
import re
import shutil
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent

def playlist_id(text):
    value = re.sub(r"[^\w-]+", "-", text.strip().lower()).strip("-_")
    if not value or value in (".", ".."):
        raise ValueError("Invalid playlist name")
    return value[:64]

def read_track(path):
    try:
        from mutagen import File as AudioFile
        metadata = AudioFile(path, easy=True)
        if metadata is None:
            raise ValueError("Unrecognized MP3")
        seconds = float(metadata.info.length)
        if not (0 < seconds < 86400):
            raise ValueError("Invalid song length")
        name = re.sub(r"^\d+\s*-\s*", "", path.stem)
        artist, sep, title = name.partition(" - ")
        return {
            "title": str((metadata.get("title") or [title if sep else name])[0]),
            "artist": str((metadata.get("artist") or [artist if sep else ""])[0]),
            "duration": round(seconds, 3),
        }
    except ImportError as e:
        raise RuntimeError("Install requirements: pip install mutagen") from e

def build(source, name):
    if not source.is_dir():
        raise ValueError(f"Playlist directory not found: {source}")
    slug = playlist_id(name)
    files = sorted(source.glob("*.mp3"), key=lambda p: (
        int(re.match(r"^(\d+)\s*-", p.name).group(1))
        if re.match(r"^(\d+)\s*-", p.name) else 1000000,
        p.name.casefold(),
    ))
    if not files:
        raise ValueError(f"No MP3 files found in {source}")
    tracks = []
    for f in files:
        tracks.append({**read_track(f), "src": f"media/{quote(slug)}/{quote(f.name)}"})
    return slug, files, tracks

def publish(source, name, root=ROOT):
    slug, files, tracks = build(source, name)
    dest = root / "media" / slug
    dest.mkdir(parents=True, exist_ok=True)
    for file in files:
        shutil.copy2(file, dest / file.name)
    station_file = root / "station.json"
    station = json.loads(station_file.read_text(encoding="utf-8"))
    station["name"] = "MAYU ET AL."
    station.setdefault("timeZone", "Asia/Jerusalem")
    station.setdefault("playlists", {})[slug] = {"name": name, "tracks": tracks}
    station.setdefault("fallbackPlaylist", slug)
    station.setdefault("schedule", [{"days": list(range(7)), "start": "00:00", "playlist": slug}])
    station_file.write_text(json.dumps(station, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return slug, len(tracks)

def main():
    parser = argparse.ArgumentParser(description="Publish MP3 playlist to MAYU ET AL. after checking permissions.")
    parser.add_argument("--source", type=Path, required=True, help="Folder produced by download_songs.py, or a folder of authorized MP3s")
    parser.add_argument("--name", required=True, help="Playlist name")
    parser.add_argument("--confirm-rights", action="store_true", help="I confirm these recordings may be hosted publicly and streamed")
    args = parser.parse_args()
    if not args.confirm_rights:
        parser.error("Publishing to a public GitHub repository requires --confirm-rights")
    slug, count = publish(args.source.resolve(), args.name)
    print(f"Published {count} tracks from {slug} to media/{slug}/ and updated station.json")
    print("IMPORTANT: MP3s become public when you commit and push them to this public repo.")

if __name__ == "__main__":
    main()

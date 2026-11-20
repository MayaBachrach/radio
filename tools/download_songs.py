import os
import sys
import argparse
import subprocess
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from urllib.parse import urlparse

# --- CONFIGURATION (FALLBACKS) ---
DEFAULT_INPUTS = []  # No downloads without an explicit link
DEFAULT_BASE_DIR = str(Path.home() / "Music" / "MAYU-ET-AL")
AUDIO_EXTENSIONS = ('.mp3', '.m4a', '.flac', '.wav', '.opus', '.ogg')
# ---------------------------------

def parse_arguments():
    """Parses command line arguments using argparse and provides a clean -h help menu."""
    parser = argparse.ArgumentParser(
        description="An optimized multi-threaded wrapper for spotDL to download music and sync to a RAW folder.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        'inputs',
        nargs='*',
        help="Provide Spotify/YouTube URLs and/or a target base directory path.\n"
             "Supported URLs: Spotify playlists, Spotify tracks, YouTube links.\n"
             "Any other string will be treated as the target base directory.\n"
             "Order does not matter."
    )
    return parser.parse_args()

def run_spotdl(args):
    """Executes the spotDL command using the current Python environment executable."""
    python_exe = sys.executable
    command = [python_exe, "-m", "spotdl"] + args
    
    process = subprocess.Popen(
        command, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.STDOUT, 
        text=True, 
        encoding="utf-8", 
        errors="ignore"
    )
    
    for line in process.stdout:
        print(line, end="")
        
    process.wait()
    return process.returncode

def find_raw_folder(base_dir):
    """Scans the base directory for any folder containing 'RAW' in its name."""
    try:
        for item in os.listdir(base_dir):
            item_path = os.path.join(base_dir, item)
            if os.path.isdir(item_path) and "RAW" in item:
                return item_path
    except Exception:
        pass
    return None

def get_windows_safe_path(path_str):
    """Appends Windows extended path prefix if needed to bypass the 260 character limit."""
    abs_path = os.path.abspath(path_str)
    if os.name == 'nt' and not abs_path.startswith('\\\\?\\'):
        return '\\\\?\\' + abs_path
    return abs_path

def sync_active_folders_to_raw(active_folders, raw_folder, script_start_time):
    """Optimized I/O: Only scans folders that were actually touched during this run."""
    print(f"\n[COPY] Syncing newly downloaded tracks to RAW folder...")
    copied_count = 0
    safe_raw_folder = get_windows_safe_path(raw_folder)
    
    for folder in active_folders:
        if not os.path.exists(folder) or os.path.abspath(folder) == os.path.abspath(raw_folder):
            continue
            
        try:
            for file in os.listdir(folder):
                if file.lower().endswith(AUDIO_EXTENSIONS):
                    file_path = os.path.join(folder, file)
                    # Verify file timestamp to only copy newly downloaded tracks
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                    if file_mtime >= script_start_time - timedelta(seconds=15):
                        target_file_path = os.path.join(safe_raw_folder, file)
                        
                        # Optimization: Skip copying if file exists with identical size
                        if os.path.exists(target_file_path):
                            if os.path.getsize(file_path) == os.path.getsize(target_file_path):
                                continue
                                
                        shutil.copy2(get_windows_safe_path(file_path), target_file_path)
                        copied_count += 1
        except Exception as e:
            print(f"[WARNING] Could not sync folder {folder}: {e}")
            
    print(f"[COPY] Successfully synced {copied_count} new files to the RAW folder.")

def is_url(string):
    """Accept Spotify and YouTube hosts, not lookalike domains."""
    parsed = urlparse(string)
    return parsed.scheme == "https" and (parsed.hostname or "").lower() in {
        "open.spotify.com", "www.youtube.com", "youtube.com",
        "music.youtube.com", "youtu.be"
    }


def main():
    script_start_time = datetime.now()
    args = parse_arguments()

    cli_inputs = []
    base_dir = DEFAULT_BASE_DIR

    for arg in args.inputs:
        if is_url(arg) or (arg.lower().endswith('.spotdl') and Path(arg).is_file()):
            cli_inputs.append(arg)
        else:
            base_dir = arg

    target_inputs = cli_inputs if cli_inputs else DEFAULT_INPUTS

    print("=" * 60)
    print("  Starting Optimized Universal Media Downloader")
    print("=" * 60)
    print(f"[INFO] Target Base Directory: {base_dir}")
    print(f"[INFO] Total Links to Process: {len(target_inputs)}")
    
    if not target_inputs:
        print("[ERROR] Provide at least one Spotify/YouTube link.")
        return 2

    os.makedirs(base_dir, exist_ok=True)

    raw_folder = find_raw_folder(base_dir)
    if raw_folder:
        print(f"[INFO] Detected target RAW folder at: {raw_folder}")

    # Track folders that actually receive files to narrow down the RAW sync scan later
    active_folders = set()
    checked_output_paths = set()
    failed = 0

    for index, url in enumerate(target_inputs, 1):
        print(f"\n--- [{index}/{len(target_inputs)}] Processing Link ---")
        print(f"[URL] {url}")
        
        if url.lower().endswith(".spotdl"):
            # A capped saved playlist may not carry a usable playlist name.
            output_template = os.path.join(base_dir, "{list-position} - {artists} - {title}.{output-ext}")
        elif "playlist" in url.lower():
            output_template = os.path.join(base_dir, "{list-name}", "{list-position} - {artists} - {title}.{output-ext}")
            print("[DOWNLOAD] Processing as PLAYLIST. Utilizing multi-threaded stream...")
        else:
            single_folder = os.path.join(base_dir, "Singles & YouTube")
            output_template = os.path.join(single_folder, "{artists} - {title}.{output-ext}")
            active_folders.add(single_folder)
            print("[DOWNLOAD] Processing as SINGLE. Saving to 'Singles & YouTube'...")
        
        # שינוי כאן: הוסר הדגל --cache-format json שגרם לשגיאה
        spotdl_args = ["download", url, "--output", output_template, "--threads", "4", "--format", "mp3"]
        checked_output_paths.add(Path(output_template).parent)
        log_level = os.getenv("MAYU_SPOTDL_LOG_LEVEL")
        if log_level:
            spotdl_args.extend(["--log-level", log_level])
        return_code = run_spotdl(spotdl_args)
        
        if return_code != 0:
            failed += 1
            print(f"[WARNING] Link processing exited with code: {return_code}")

    # If RAW folder is active, build final list of touched folders and sync
    if raw_folder:
        try:
            for item in os.listdir(base_dir):
                item_path = os.path.join(base_dir, item)
                if os.path.isdir(item_path) and item_path != raw_folder:
                    active_folders.add(item_path)
        except Exception:
            pass
            
        sync_active_folders_to_raw(active_folders, raw_folder, script_start_time)
            
    print("\n" + "=" * 60)
    print("  Import run finished.")
    print("=" * 60)
    if all("{list-name}" not in str(folder) for folder in checked_output_paths):
        if not any(path.is_file() and path.suffix.lower() == ".mp3" and path.stat().st_size
                   for folder in checked_output_paths for path in folder.glob("*")):
            print("[ERROR] The downloads produced no usable MP3 files.", file=sys.stderr)
            return 1
    return 1 if failed else 0

if __name__ == "__main__":
    raise SystemExit(main())

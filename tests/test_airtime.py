import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
from handle_airtime import parse_request, authorization, save_schedule, exact_slot

BASE = {
    "version": 1,
    "day": 0,
    "hour": 20,
    "curator": "Maya",
    "name": "Night Friends",
    "spotify_url": "https://open.spotify.com/playlist/585hRWxBiVwCjjhTpAuH8Y",
    "replace": False,
    "expected_playlist": None,
    "rights_confirmed": True,
}

def wrap(payload):
    return "<!-- MAYU-SCHEDULE-V1 -->\n~~~json\n" + json.dumps(payload) + "\n~~~"

class AirtimeTests(unittest.TestCase):
    def test_valid_request(self):
        request = parse_request(wrap(BASE))
        self.assertEqual(request["playlist_slug"], "spotify-585hRWxBiVwCjjhTpAuH8Y")
        self.assertEqual(request["day"], 0)

    def test_permissions_required(self):
        for association in ("NONE", "FIRST_TIME_CONTRIBUTOR"):
            with self.assertRaises(PermissionError):
                authorization({"action": "opened", "issue": {"author_association": association}})
        authorization({"action": "opened", "issue": {"author_association": "OWNER"}})
        authorization({"action": "labeled", "label": {"name": "radio-approved"}, "issue": {"author_association": "NONE"}})

    def test_rejects_invalid_links_and_false_rights(self):
        for value in ("http://open.spotify.com/playlist/585hRWxBiVwCjjhTpAuH8Y",
                      "https://open.spotify.com.evil.org/playlist/585hRWxBiVwCjjhTpAuH8Y",
                      "https://open.spotify.com/track/585hRWxBiVwCjjhTpAuH8Y"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                parse_request(wrap({**BASE, "spotify_url": value}))
        with self.assertRaises(ValueError):
            parse_request(wrap({**BASE, "rights_confirmed": False}))

    def test_new_slot_and_replace(self):
        req = parse_request(wrap(BASE))
        station = {"name": "MAYU ET AL.", "playlists": {}, "schedule": []}
        save_schedule(station, req, [{"src": "media/a.mp3", "duration": 60}])
        self.assertEqual(exact_slot(station, 0, 20)["playlist"], req["playlist_slug"])
        with self.assertRaises(ValueError):
            save_schedule(station, req, [])
        req["replace"] = True
        req["expected_playlist"] = req["playlist_slug"]
        save_schedule(station, req, [{"src": "media/a.mp3", "duration": 60}])
        self.assertEqual(len(station["schedule"]), 1)
        self.assertEqual(station["schedule"][0]["durationMinutes"], 60)

    def test_multi_day_slot_preserves_other_days(self):
        req = parse_request(wrap({**BASE, "replace": True, "expected_playlist": "old"}))
        station = {"schedule": [{"days": [0, 1], "start": "20:00", "durationMinutes": 60, "playlist": "old"}]}
        save_schedule(station, req, [{"src": "media/a.mp3", "duration": 60}])
        self.assertEqual(exact_slot(station, 1, 20)["playlist"], "old")
        self.assertEqual(exact_slot(station, 0, 20)["playlist"], req["playlist_slug"])

if __name__ == "__main__":
    unittest.main()

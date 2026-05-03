"""
Extract distinct faces from a video and save them as enrollable photos.
"""
import cv2
import face_recognition
import numpy as np
from pathlib import Path
import json

VIDEO_PATH = "/Users/tarang/Downloads/videoplayback.mp4"
OUTPUT_DIR = Path(__file__).parent / "data" / "extracted_faces"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TOLERANCE = 0.5          # stricter = fewer duplicates
SAMPLE_EVERY_N_SEC = 5   # sample a frame every N seconds

cap = cv2.VideoCapture(VIDEO_PATH)
fps = cap.get(cv2.CAP_PROP_FPS) or 25
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration = total_frames / fps
sample_interval = max(1, int(fps * SAMPLE_EVERY_N_SEC))

print(f"Video: {duration:.0f}s, {fps:.0f}fps, sampling every {SAMPLE_EVERY_N_SEC}s")

known_encodings = []   # one per unique face
known_faces = []       # { id, encoding, best_frame, best_loc, best_size }

frame_idx = 0
faces_found = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    if frame_idx % sample_interval != 0:
        frame_idx += 1
        continue

    # 640x360 — faces are small, run at full resolution
    rgb_full = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    locs = face_recognition.face_locations(rgb_full, model="hog")

    if locs:
        locs_full = locs
        encodings = face_recognition.face_encodings(rgb_full, locs_full)

        for enc, loc in zip(encodings, locs):
            top, right, bottom, left = loc
            face_size = (bottom - top) * (right - left)

            if known_encodings:
                dists = face_recognition.face_distance(known_encodings, enc)
                min_idx = int(np.argmin(dists))
                if dists[min_idx] < TOLERANCE:
                    # Update if this frame has a bigger/clearer face
                    if face_size > known_faces[min_idx]["best_size"]:
                        known_faces[min_idx]["best_frame"] = frame.copy()
                        known_faces[min_idx]["best_loc"] = loc
                        known_faces[min_idx]["best_size"] = face_size
                    frame_idx += 1
                    continue

            # New unique face
            face_id = len(known_faces) + 1
            known_encodings.append(enc)
            known_faces.append({
                "id": face_id,
                "encoding": enc,
                "best_frame": frame.copy(),
                "best_loc": loc,
                "best_size": face_size,
            })
            faces_found += 1
            print(f"  New face #{face_id} at frame {frame_idx} ({frame_idx/fps:.0f}s)")

    frame_idx += 1

cap.release()

print(f"\nFound {len(known_faces)} unique faces. Saving crops...")

saved = []
for face in known_faces:
    top, right, bottom, left = face["best_loc"]
    # Add padding
    h, w = face["best_frame"].shape[:2]
    pad = 30
    t = max(0, top - pad)
    b = min(h, bottom + pad)
    l = max(0, left - pad)
    r = min(w, right + pad)

    crop = face["best_frame"][t:b, l:r]
    out_path = OUTPUT_DIR / f"face_{face['id']:02d}.jpg"
    cv2.imwrite(str(out_path), crop)
    saved.append({"face_id": face["id"], "path": str(out_path)})
    print(f"  Saved face_{face['id']:02d}.jpg  ({r-l}x{b-t}px)")

print(f"\nDone. {len(saved)} face images saved to {OUTPUT_DIR}")
print(json.dumps(saved, indent=2))

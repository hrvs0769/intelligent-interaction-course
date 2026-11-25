# -*- coding: utf-8 -*-
"""
Publish / update the course site on GitHub Pages through the REST API.

Why not `git push`: in this environment `github.com` (git's HTTPS endpoint) is
blocked, while `api.github.com` is reachable. This script creates blobs, a tree,
a commit and moves refs/heads/main through the Git Data API instead.

It only uploads files whose git blob hash differs from the remote tree, so an
update after a small edit is fast.

Usage:
    python3 publish.py ["optional commit message"]

Requirements: `gh auth login` already done (token scopes: repo), `requests`.
"""
import base64
import concurrent.futures
import hashlib
import os
import subprocess
import sys
import time

import requests

OWNER = "hrvs0769"
REPO = "intelligent-interaction-course"
BASE_URL = f"https://api.github.com/repos/{OWNER}/{REPO}"
PAGES_URL = f"https://{OWNER}.github.io/{REPO}/"

HERE = os.path.dirname(os.path.abspath(__file__))
# This script lives in the site root (which is also the Pages repo root).
SITE = HERE


def token():
    return subprocess.check_output(["gh", "auth", "token"], text=True).strip()


def blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def collect_files():
    out = []
    for dirpath, dirnames, filenames in os.walk(SITE):
        dirnames[:] = [d for d in dirnames if d not in (".git", "__pycache__")]
        for fn in filenames:
            if fn == ".DS_Store" or fn.endswith((".pyc", ".pyo")):
                continue
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, SITE).replace(os.sep, "/")
            mode = "100755" if (os.access(full, os.X_OK) and not fn.endswith(".py")) else "100644"
            out.append((rel, full, mode))
    return out


def main():
    if not os.path.isdir(SITE):
        raise SystemExit("course-site directory not found: " + SITE)
    tok = token()
    H = {"Authorization": "Bearer " + tok, "Accept": "application/vnd.github+json"}
    msg = sys.argv[1] if len(sys.argv) > 1 else "Update course site"

    # current remote commit + full tree
    ref = requests.get(BASE_URL + "/git/ref/heads/main", headers=H, timeout=30)
    ref.raise_for_status()
    parent = ref.json()["object"]["sha"]
    tree_res = requests.get(BASE_URL + "/git/trees/main?recursive=1", headers=H, timeout=60)
    tree_res.raise_for_status()
    remote = {e["path"]: e["sha"] for e in tree_res.json()["tree"] if e["type"] == "blob"}
    print("remote files:", len(remote), flush=True)

    files = collect_files()
    print("local files:", len(files), flush=True)

    todo = []
    entries = []
    for rel, full, mode in files:
        data = open(full, "rb").read()
        sha = blob_sha(data)
        if remote.get(rel) == sha:
            entries.append({"path": rel, "mode": mode, "type": "blob", "sha": sha})
        else:
            todo.append((rel, mode, data, sha))
    print("reuse:", len(files) - len(todo), "upload:", len(todo), flush=True)

    def upload(item):
        rel, mode, data, sha = item
        for attempt in range(3):
            try:
                r = requests.post(
                    BASE_URL + "/git/blobs", headers=H,
                    json={"content": base64.b64encode(data).decode(), "encoding": "base64"},
                    timeout=120,
                )
                if r.status_code == 201:
                    return rel, mode, r.json()["sha"], None
                err = f"{r.status_code} {r.text[:120]}"
            except Exception as e:
                err = str(e)[:120]
            time.sleep(1.5 * (attempt + 1))
        return rel, mode, None, err

    if todo:
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
            for rel, mode, sha, err in ex.map(upload, todo):
                if err:
                    raise SystemExit(f"blob failed: {rel}: {err}")
                entries.append({"path": rel, "mode": mode, "type": "blob", "sha": sha})
        print("blobs uploaded", flush=True)

    r = requests.post(BASE_URL + "/git/trees", headers=H, json={"tree": entries}, timeout=90)
    if r.status_code != 201:
        raise SystemExit("tree failed: " + r.text[:300])
    tree_sha = r.json()["sha"]

    r = requests.post(BASE_URL + "/git/commits", headers=H,
                      json={"message": msg, "tree": tree_sha, "parents": [parent]}, timeout=90)
    if r.status_code != 201:
        raise SystemExit("commit failed: " + r.text[:300])
    commit_sha = r.json()["sha"]

    r = requests.patch(BASE_URL + "/git/refs/heads/main", headers=H,
                       json={"sha": commit_sha}, timeout=60)
    if r.status_code != 200:
        raise SystemExit("ref failed: " + r.text[:300])

    print("commit:", commit_sha[:12], flush=True)
    print("Pages:", PAGES_URL, "(rebuilds automatically, usually < 1 min)", flush=True)


if __name__ == "__main__":
    main()

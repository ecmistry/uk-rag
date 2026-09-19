"""Load project-root .env into os.environ for Python cron/fetcher scripts.

Crontab jobs often run without the shell environment that interactive
sessions get from dotenv. Call load_project_env() before reading
MONGODB_URI / DATABASE_URL.
"""
from __future__ import annotations

import os
from pathlib import Path


def load_project_env(start: Path | None = None) -> Path | None:
    """
    Parse the nearest .env walking up from *start* (default: this file's
    directory). Existing os.environ values win — never overwrite.
    Returns the path loaded, or None if none found.
    """
    here = (start or Path(__file__).resolve()).parent
    for directory in [here, *here.parents]:
        env_path = directory / ".env"
        if not env_path.is_file():
            continue
        for raw in env_path.read_text(encoding="utf-8", errors="replace").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            if not key or key in os.environ:
                continue
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            os.environ[key] = value
        return env_path
    return None

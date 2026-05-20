#!/usr/bin/env python3
"""Clean a wget WordPress mirror in web\ and write to web-clean\."""

import argparse
import re
import shutil
import sys
from pathlib import Path

from bs4 import BeautifulSoup, Doctype

SRC_DIR = Path("web")
DST_DIR = Path("web-clean")

_VER_RE = re.compile(r"\?ver=[\w.+-]+")
_INTERNAL_PREFIX_RE = re.compile(r"https?://teaspoon\.cz")


def _is_external(url: str) -> bool:
    return url.startswith("http://") or url.startswith("https://")


def clean_html(src_path: Path) -> tuple[str, int]:
    """Return (cleaned_html, tags_removed)."""
    raw = src_path.read_bytes()
    soup = BeautifulSoup(raw, "lxml")
    removed = 0

    # --- Remove WP emoji <script> tags ---
    for tag in soup.find_all("script"):
        src_attr = tag.get("src", "")
        inline = tag.string or ""
        if "wp-emoji" in src_attr or "window._wpemojiSettings" in inline:
            tag.decompose()
            removed += 1

    # --- Remove WP emoji <style> tags ---
    for tag in soup.find_all("style"):
        inline = tag.string or ""
        if "img.wp-smiley" in inline or "img.emoji" in inline:
            tag.decompose()
            removed += 1

    # --- Remove WP emoji CSS <link> ---
    for tag in soup.find_all("link"):
        href = tag.get("href", "")
        if "wp-emoji" in href and tag.get("rel") == ["stylesheet"]:
            tag.decompose()
            removed += 1

    # --- Remove WordPress metadata <link> tags ---
    _META_RELS = {
        "https://api.w.org/",
        "EditURI",
        "wlwmanifest",
        "shortlink",
    }
    _OEMBED_TYPES = {"application/json+oembed", "text/xml+oembed"}

    for tag in soup.find_all("link"):
        rel = " ".join(tag.get("rel", []))
        href = tag.get("href", "")
        mime = tag.get("type", "")
        if (
            rel in _META_RELS
            or "/wp-json/" in href
            or (rel == "alternate" and mime in _OEMBED_TYPES)
        ):
            tag.decompose()
            removed += 1

    # --- Remove <meta name="generator"> ---
    for tag in soup.find_all("meta", attrs={"name": "generator"}):
        tag.decompose()
        removed += 1

    # --- Strip ?ver= from local <link href> and <script src> ---
    for tag in soup.find_all(["link", "script"]):
        for attr in ("href", "src"):
            val = tag.get(attr)
            if val and not _is_external(val):
                new_val = _VER_RE.sub("", val)
                if new_val != val:
                    tag[attr] = new_val

    # --- Rewrite absolute internal URLs to relative ---
    for tag in soup.find_all(True):
        for attr in ("href", "src", "action"):
            val = tag.get(attr)
            if val:
                new_val = _INTERNAL_PREFIX_RE.sub("", val)
                if new_val != val:
                    tag[attr] = new_val

    # Preserve doctype if present
    doctype = ""
    for item in soup.contents:
        if isinstance(item, Doctype):
            doctype = f"<!DOCTYPE {item}>\n"
            break

    html_tag = soup.find("html")
    body = str(html_tag) if html_tag else str(soup)
    return doctype + body, removed


def process(dry_run: bool) -> None:
    if not SRC_DIR.exists():
        sys.exit(f"Source directory '{SRC_DIR}' not found.")

    if not dry_run:
        if DST_DIR.exists():
            shutil.rmtree(DST_DIR)
        DST_DIR.mkdir(parents=True)

    total_files = 0
    total_removed = 0

    for src_path in sorted(SRC_DIR.rglob("*")):
        if not src_path.is_file():
            continue

        rel = src_path.relative_to(SRC_DIR)
        dst_path = DST_DIR / rel

        if src_path.suffix.lower() in (".html", ".htm"):
            cleaned, removed = clean_html(src_path)
            total_files += 1
            total_removed += removed
            print(f"cleaned: {src_path} ({removed} tags removed)")
            if not dry_run:
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                dst_path.write_text(cleaned, encoding="utf-8")
        else:
            if not dry_run:
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_path, dst_path)

    print(f"\nDone: {total_files} HTML files processed, {total_removed} tags removed total.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clean a wget WordPress mirror.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be changed without writing anything.",
    )
    args = parser.parse_args()
    process(dry_run=args.dry_run)


if __name__ == "__main__":
    main()

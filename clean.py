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

# Strips any query string from a URL value (local only)
_QUERY_RE = re.compile(r"\?[^\"'#\s]+")
# Matches https://, http://, //, and JSON-escaped https:\/\/ forms
_INTERNAL_PREFIX_RE = re.compile(r"(?:https?:)?(?:\\?/){2}teaspoon\.cz")
# wget encodes '?' as U+00BF (¿) in Windows filenames; also handle literal '?'
_FNAME_QUERY_RE = re.compile(r"[?¿].*$")
# Strips query strings from CSS url() tokens, preserving any fragment (#id)
_CSS_URL_QUERY_RE = re.compile(r"(url\(['\"]?[^'\")?#\s]+)\?[^'\")\s]*")


def _is_external(url: str) -> bool:
    return url.startswith("http://") or url.startswith("https://")


def _clean_filename(name: str) -> str:
    """Strip wget's query-string suffix from a filename."""
    return _FNAME_QUERY_RE.sub("", name)


def _add_icons(soup: BeautifulSoup) -> None:
    """Insert Defaults icon-font <i> elements at contextually appropriate places."""

    def icon(cls: str):
        return soup.new_tag("i", attrs={"class": cls})

    def prepend_icon(tag, icon_cls: str) -> None:
        tag.insert(0, " ")
        tag.insert(0, icon(icon_cls))

    # Top-bar phone number (all pages)
    for li in soup.find_all("li", class_="grve-topbar-item-text"):
        p = li.find("p")
        if p and "+420" in p.get_text():
            prepend_icon(p, "Defaults-phone")

    # Contact info block (kontakt page)
    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if text.startswith("telefon:"):
            prepend_icon(p, "Defaults-phone")
        elif text.startswith("email:"):
            prepend_icon(p, "Defaults-envelope")
        elif text.startswith("IČO:"):
            prepend_icon(p, "Defaults-building-o")
        elif text.startswith("Bankovní spojení:"):
            prepend_icon(p, "Defaults-credit-card")

    # Stat counters (o-mne page)
    _COUNTER_ICONS = {
        "klientů": "Defaults-users",
        "zkušeností": "Defaults-calendar",
        "srdce": "Defaults-heart",
    }
    for h3 in soup.find_all("h3", class_="grve-counter-title"):
        text = h3.get_text(strip=True)
        for keyword, icon_cls in _COUNTER_ICONS.items():
            if keyword in text:
                prepend_icon(h3, icon_cls)
                break

    # Timeline icons (o-mne page) — plugin left these divs empty
    _TIMELINE_ICONS = {
        "1990": "Defaults-book",            # začínám se učit anglicky
        "1997": "Defaults-file-text",       # první kniha v angličtině
        "2003": "Defaults-plane",           # Oxford, UK
        "2004": "Defaults-pencil",          # začínám učit
        "2005": "Defaults-users",           # plný úvazek
        "2009": "Defaults-university",      # diplomová práce, Soluň
        "2010": "Defaults-globe",           # španělština
        "2012": "Defaults-graduation-cap",  # Mgr.
        "2013": "Defaults-certificate",     # CELTA
        "2014": "Defaults-sun-o",           # letní škola Winchester
        "2015": "Defaults-star",            # Culford Summer School
        "2017": "Defaults-coffee",          # vznik Teaspoon Clubu
    }
    for icon_div in soup.find_all("div", class_="ult-timeline-icon"):
        header_block = icon_div.parent.find_next_sibling(
            "div", class_="timeline-header-block"
        )
        if not header_block:
            continue
        year_h3 = header_block.find("h3", class_="ult-timeline-title")
        if not year_h3:
            continue
        icon_cls = _TIMELINE_ICONS.get(year_h3.get_text(strip=True))
        if icon_cls:
            icon_div.clear()
            icon_div.append(icon(icon_cls))


def clean_css(src_path: Path) -> str:
    text = src_path.read_text(encoding="utf-8", errors="replace")
    return _CSS_URL_QUERY_RE.sub(r"\1", text)


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

    # --- Inject self-hosted Google Fonts stylesheet (replaces CDN dependency) ---
    head = soup.find("head")
    if head:
        # Remove the dns-prefetch hint for fonts.googleapis.com (no longer needed)
        for tag in soup.find_all("link", rel="dns-prefetch"):
            if "fonts.googleapis" in tag.get("href", ""):
                tag.decompose()
        gf_link = soup.new_tag(
            "link", rel="stylesheet",
            href="/fonts/google-fonts.css", type="text/css"
        )
        head.insert(0, gf_link)

    # --- Strip all query strings from local <link href> and <script src> ---
    for tag in soup.find_all(["link", "script"]):
        for attr in ("href", "src"):
            val = tag.get(attr)
            if val and not _is_external(val):
                new_val = _QUERY_RE.sub("", val)
                if new_val != val:
                    tag[attr] = new_val

    # --- Rewrite absolute internal URLs to relative (all attributes) ---
    # Covers href, src, action, srcset, style, content, data-*, poster, etc.
    for tag in soup.find_all(True):
        for attr, val in list(tag.attrs.items()):
            if isinstance(val, str) and "teaspoon.cz" in val:
                tag[attr] = _INTERNAL_PREFIX_RE.sub("", val)

    # --- Add Defaults icon-font elements ---
    _add_icons(soup)

    # --- Rewrite absolute internal URLs inside <style> and <script> tag bodies ---
    for tag in soup.find_all(["style", "script"]):
        if tag.string and "teaspoon.cz" in tag.string:
            tag.string.replace_with(_INTERNAL_PREFIX_RE.sub("", tag.string))

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
        DST_DIR.mkdir(parents=True, exist_ok=True)

    total_files = 0
    total_removed = 0

    for src_path in sorted(SRC_DIR.rglob("*")):
        if not src_path.is_file():
            continue

        rel = src_path.relative_to(SRC_DIR)
        dst_path = DST_DIR / rel.parent / _clean_filename(rel.name)

        clean_suffix = Path(_clean_filename(rel.name)).suffix.lower()
        if clean_suffix in (".html", ".htm"):
            cleaned, removed = clean_html(src_path)
            total_files += 1
            total_removed += removed
            print(f"cleaned: {src_path} ({removed} tags removed)")
            if not dry_run:
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                dst_path.write_text(cleaned, encoding="utf-8")
        elif clean_suffix == ".css":
            if not dry_run:
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                dst_path.write_text(clean_css(src_path), encoding="utf-8")
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

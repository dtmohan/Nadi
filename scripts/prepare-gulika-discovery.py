"""Extract public birth fields for the fifth-house protocol from the user's local C-sample XML.

Usage: python3 scripts/prepare-gulika-discovery.py /path/to/c_sample.xml > /tmp/gulika-input.json
This does not use the export's research_data or write the bulk dataset into the repository.
"""
from datetime import datetime, timedelta
from xml.etree import ElementTree as ET
import json
import re
import sys

old = {
    "Nina Simone", "Glenn T. Seaborg", "Terence Hill", "Chaka Khan", "France Gall",
    "Zoë Saldaña", "Alberto Gironella", "Aldo Miyashiro", "Penélope Cruz",
    "Antonio Banderas", "Ronaldinho", "Neymar", "Sebastián Piñera",
}


def coordinate(value):
    match = re.fullmatch(r"(\d{1,3})([nsew])(\d{2})(\d{0,2})", value.lower())
    if not match:
        return None
    degrees, direction, minutes, seconds = match.groups()
    return (-1 if direction in "sw" else 1) * (int(degrees) + int(minutes) / 60 + (int(seconds) if seconds else 0) / 3600)


if len(sys.argv) != 2:
    raise SystemExit(__doc__)

records = []
for row in ET.parse(sys.argv[1]).getroot().findall("adb_entry"):
    public = row.find("public_data")
    datatype = public.find("datatype")
    birth = public.find("bdata")
    if datatype is None or birth is None or datatype.get("sdatatype") != "Public Figure" or public.findtext("roddenrating") != "AA":
        continue
    name = public.findtext("sflname")
    if not name or name in old:
        continue
    date, time, place = birth.find("sbdate"), birth.find("sbtime"), birth.find("place")
    if date is None or time is None or place is None or date.get("ccalendar") != "g":
        continue
    try:
        year, month, day = (int(date.get(key)) for key in ("iyear", "imonth", "iday"))
        if not 1880 <= year <= 1960:
            continue
        jd = float(time.get("jd_ut"))
        local = datetime.fromisoformat(f"{year:04}-{month:02}-{day:02}T{time.text.strip()}")
        utc = datetime(1970, 1, 1) + timedelta(days=jd - 2440587.5)
        offset_seconds = (local - utc).total_seconds()
        offset_minutes = round(offset_seconds / 60)
        if abs(offset_seconds - offset_minutes * 60) > 3 or abs(offset_minutes) > 14 * 60:
            continue
        latitude, longitude = coordinate(place.get("slati", "")), coordinate(place.get("slong", ""))
        if latitude is None or longitude is None or abs(latitude) >= 65:
            continue
        wikipedia, adb = row.findtext("text_data/wikipedia_link"), row.findtext("text_data/adb_link")
        country_element = birth.find("country")
        country = (country_element.text or "").strip()
        if not wikipedia or not adb or not country:
            continue
        country_key = "United States" if "(US)" in country_element.get("sctr", "") else country
        sign, absolute = ("+" if offset_minutes >= 0 else "-"), abs(offset_minutes)
        records.append(dict(id=row.get("adb_id"), name=name, date=local.isoformat(), jd=jd,
                            zone=f"UTC{sign}{absolute // 60}:{absolute % 60:02}", offsetMinutes=offset_minutes,
                            latitude=latitude, longitude=longitude, place=place.text, country=country,
                            countryKey=country_key, adb=adb, wikipedia=wikipedia))
    except (ValueError, TypeError, AttributeError, OverflowError):
        continue
json.dump(records, sys.stdout, ensure_ascii=False)

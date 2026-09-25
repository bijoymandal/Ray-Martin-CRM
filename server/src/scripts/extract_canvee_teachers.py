#!/usr/bin/env python3
"""
Extract and import teacher master data from Canvee SQL dump into Ray-Martin-CRM.
Extracts:
- Teacher Name & Phone
- Category Type ('School' / 'Private Tutor')
- School Type ('HS School', 'Primary School', 'Kg/Nursery School', 'CBSE SCHOOL', etc.)
- School / Center Name
- Class-wise associations (Class 5, 6, 7, 8, 9, 10, 11, 12, etc.)
- Subjects taught (Bengali, English, History, Geography, Mathematics, etc.)
- District, Zone, Board
Outputs MongoDB-ready NDJSON for fast mongoimport.
"""

import sys
import os
import csv
import io
import json
import secrets
from datetime import datetime

DEFAULT_SQL_PATH = "/Users/bijoy/Downloads/canvee-09-2026-02.sql"

def normalize_class(c):
    if not c:
        return None
    c = str(c).strip()
    # Normalize class numbers or names
    if c in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]:
        return c
    c_lower = c.lower()
    if "xii" in c_lower or "12" in c_lower:
        return "12"
    if "xi" in c_lower or "11" in c_lower:
        return "11"
    if "x" in c_lower or "10" in c_lower:
        return "10"
    if "ix" in c_lower or "9" in c_lower:
        return "9"
    if "viii" in c_lower or "8" in c_lower:
        return "8"
    if "vii" in c_lower or "7" in c_lower:
        return "7"
    if "vi" in c_lower or "6" in c_lower:
        return "6"
    if "v" in c_lower or "5" in c_lower:
        return "5"
    return c

def normalize_subject(s):
    if not s:
        return None
    s = s.strip()
    # Capitalize / normalize
    mapping = {
        "bangla": "Bengali",
        "bengali": "Bengali",
        "english": "English",
        "itihas": "History",
        "history": "History",
        "bhugol": "Geography",
        "geography": "Geography",
        "ganit": "Mathematics",
        "math": "Mathematics",
        "mathematics": "Mathematics",
        "bhoutabigyan": "Physical Science",
        "physical science": "Physical Science",
        "physics": "Physics",
        "jibanbigyan": "Life Science",
        "life science": "Life Science",
        "biology": "Biology",
        "chemistry": "Chemistry",
        "rasayan": "Chemistry",
        "poribesh": "Environmental Studies",
        "rastrabigyan": "Political Science",
        "political science": "Political Science",
        "shikshabigyan": "Education",
        "darshan": "Philosophy",
        "sanskrit": "Sanskrit",
        "economics": "Economics",
        "computer application": "Computer Application",
        "children book": "Primary / Pre-Primary",
    }
    return mapping.get(s.lower(), s.title())

def extract_teachers(sql_path=DEFAULT_SQL_PATH, limit=None):
    if not os.path.exists(sql_path):
        print(f"Error: SQL dump not found at {sql_path}", file=sys.stderr)
        sys.exit(1)

    teachers = {}
    row_count = 0

    with open(sql_path, "r", encoding="utf-8", errors="ignore") as f:
        in_rb = False
        for line in f:
            if not in_rb:
                if line.startswith("INSERT INTO `record_book`"):
                    in_rb = True
                continue

            line_str = line.strip()
            if not line_str.startswith("("):
                if line_str.startswith("INSERT INTO `record_book`"):
                    continue
                if line_str.startswith("DROP") or line_str.startswith("CREATE") or line_str.startswith("LOCK"):
                    break
                continue

            row_count += 1
            line_clean = line_str.rstrip(",;")
            if line_clean.startswith("(") and line_clean.endswith(")"):
                line_clean = line_clean[1:-1]

            try:
                reader = csv.reader(io.StringIO(line_clean), delimiter=",", quotechar="\x27", escapechar="\\")
                cols = next(reader)
                if len(cols) >= 39:
                    t_name = cols[19].strip()
                    t_phone = cols[20].strip()
                    school_name = cols[21].strip()
                    cat_type = cols[22].strip() or "School"
                    school_type = cols[23].strip()
                    board_name = cols[31].strip()
                    subj_name = cols[32].strip()
                    class_name = cols[34].strip()
                    dist = cols[36].strip()
                    zone = cols[38].strip()

                    # Filter invalid placeholder entries
                    if not t_name or len(t_name) < 2 or not t_phone or len(t_phone) < 7:
                        continue
                    if t_phone in ["0000000000", "1111111111", "9999999999", "1234567890"]:
                        continue

                    key = (t_name.upper(), t_phone)
                    if key not in teachers:
                        # Clean category type
                        cat_clean = "Private Tutor" if "private" in cat_type.lower() or "tutor" in cat_type.lower() else "School"
                        teachers[key] = {
                            "name": t_name,
                            "phone": t_phone,
                            "categoryType": cat_clean,
                            "schoolType": school_type or ("Private Coaching" if cat_clean == "Private Tutor" else "HS School"),
                            "schoolName": school_name or ("Private Tuition Center" if cat_clean == "Private Tutor" else "School"),
                            "district": dist or "",
                            "zone": zone or "",
                            "board": board_name or "State Board",
                            "classes": set(),
                            "subjects": set(),
                            "designation": "Private Tutor" if cat_clean == "Private Tutor" else "Subject Teacher",
                        }

                    norm_c = normalize_class(class_name)
                    if norm_c:
                        teachers[key]["classes"].add(norm_c)

                    norm_s = normalize_subject(subj_name)
                    if norm_s:
                        teachers[key]["subjects"].add(norm_s)

            except Exception:
                continue

            if limit and len(teachers) >= limit:
                break

    return teachers

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Extract teachers from Canvee SQL dump into NDJSON")
    parser.add_argument("--sql", default=DEFAULT_SQL_PATH, help="Path to Canvee SQL dump")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of unique teachers to extract")
    parser.add_argument("--output", default=None, help="Output file path (NDJSON). Defaults to stdout")
    args = parser.parse_args()

    teachers = extract_teachers(args.sql, args.limit)
    out = open(args.output, "w", encoding="utf-8") if args.output else sys.stdout

    now_iso = datetime.utcnow().isoformat() + "Z"

    for t in teachers.values():
        classes_list = sorted(list(t["classes"]), key=lambda x: int(x) if x.isdigit() else 99)
        subjects_list = sorted(list(t["subjects"]))
        primary_subject = subjects_list[0] if subjects_list else "General"

        doc = {
            "_id": {"$oid": secrets.token_hex(12)},
            "name": t["name"],
            "phone": t["phone"],
            "email": None,
            "subject": primary_subject,
            "subjects": subjects_list,
            "classes": classes_list,
            "categoryType": t["categoryType"],
            "schoolType": t["schoolType"],
            "schoolName": t["schoolName"],
            "district": t["district"],
            "zone": t["zone"],
            "board": t["board"],
            "designation": t["designation"],
            "createdAt": {"$date": now_iso},
            "updatedAt": {"$date": now_iso}
        }
        out.write(json.dumps(doc, ensure_ascii=False) + "\n")

    if args.output:
        out.close()
        print(f"Successfully exported {len(teachers)} teachers to {args.output}", file=sys.stderr)

if __name__ == "__main__":
    main()

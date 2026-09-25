#!/usr/bin/env python3
"""
Category-wise SQL to NoSQL MongoDB Teacher Data Transfer Script.
Ray-Martin-CRM | Teacher Master Data Pipeline

Features:
- Stream-extracts raw SQL dump or reads cached NDJSON files.
- Category-wise Filtering & Transfer:
    * School Teachers (High School, Primary, Nursery, CBSE)
    * Private Tutors / Private Teachers (Tuition centers, home tutors)
    * All Categories
- Class-wise Filtering (Classes 5 to 12).
- District & School-Type Filtering.
- Direct High-Speed MongoDB Ingestion (via containerized or local mongoimport).
- Category-wise Split Export (generates separate NDJSON files per category).
- Rich analytical report (category breakdown, class distribution, top districts).
"""

import sys
import os
import csv
import io
import json
import secrets
import argparse
import subprocess
import time
from datetime import datetime

DEFAULT_SQL_PATH = "/Users/bijoy/Downloads/canvee-09-2026-02.sql"
DEFAULT_CACHE_NDJSON = "/tmp/canvee_teachers_all.ndjson"
DEFAULT_MONGO_DB = "crm"
DEFAULT_MONGO_COLL = "Teacher"
DEFAULT_DOCKER_CONTAINER = "mongodb"

# ─── DATA NORMALIZERS ─────────────────────────────────────────────────────────

def normalize_class(c):
    if not c:
        return None
    c = str(c).strip()
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

def normalize_category(cat_str):
    if not cat_str:
        return "School"
    c = str(cat_str).lower().strip()
    if "private" in c or "tutor" in c or c == "4":
        return "Private Tutor"
    return "School"

# ─── EXTRACTION FUNCTIONS ─────────────────────────────────────────────────────

def stream_from_sql(sql_path, category_filter=None, class_filter=None, district_filter=None, limit=None):
    """
    Streams and normalizes teachers from raw SQL dump file (record_book table).
    """
    if not os.path.exists(sql_path):
        print(f"[-] Error: SQL dump file not found at {sql_path}", file=sys.stderr)
        return {}

    teachers = {}
    print(f"[*] Reading and streaming records from SQL dump: {sql_path}...", file=sys.stderr)
    start_time = time.time()
    processed_rows = 0

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

            processed_rows += 1
            if processed_rows % 200000 == 0:
                print(f"    Processed {processed_rows:,} rows, found {len(teachers):,} unique teachers...", file=sys.stderr)

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
                    raw_cat = cols[22].strip()
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

                    cat = normalize_category(raw_cat)
                    if category_filter and category_filter.lower() != "all":
                        if cat.lower() != category_filter.lower():
                            continue

                    norm_c = normalize_class(class_name)
                    if class_filter and class_filter.lower() != "all":
                        allowed_classes = [x.strip() for x in str(class_filter).split(",")]
                        if norm_c not in allowed_classes:
                            continue

                    if district_filter and district_filter.lower() != "all":
                        if dist.lower() != district_filter.lower():
                            continue

                    key = (t_name.upper(), t_phone)
                    if key not in teachers:
                        teachers[key] = {
                            "name": t_name,
                            "phone": t_phone,
                            "categoryType": cat,
                            "schoolType": school_type or ("Private Coaching" if cat == "Private Tutor" else "HS School"),
                            "schoolName": school_name or ("Private Tuition Center" if cat == "Private Tutor" else "School"),
                            "district": dist or "",
                            "zone": zone or "",
                            "board": board_name or "State Board",
                            "classes": set(),
                            "subjects": set(),
                            "designation": "Private Tutor" if cat == "Private Tutor" else "Subject Teacher",
                        }

                    if norm_c:
                        teachers[key]["classes"].add(norm_c)

                    norm_s = normalize_subject(subj_name)
                    if norm_s:
                        teachers[key]["subjects"].add(norm_s)

            except Exception:
                continue

            if limit and len(teachers) >= limit:
                break

    elapsed = time.time() - start_time
    print(f"[+] SQL Stream Complete: {processed_rows:,} rows scanned -> {len(teachers):,} unique teachers in {elapsed:.1f}s", file=sys.stderr)
    return teachers

def stream_from_ndjson(ndjson_path, category_filter=None, class_filter=None, district_filter=None, limit=None):
    """
    Streams and filters teachers from cached NDJSON.
    """
    if not os.path.exists(ndjson_path):
        print(f"[-] Error: NDJSON file not found at {ndjson_path}", file=sys.stderr)
        return {}

    teachers = {}
    print(f"[*] Reading teachers from cached NDJSON: {ndjson_path}...", file=sys.stderr)
    start_time = time.time()

    with open(ndjson_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                doc = json.loads(line)
                cat = doc.get("categoryType", "School")
                if category_filter and category_filter.lower() != "all":
                    if cat.lower() != category_filter.lower():
                        continue

                classes = doc.get("classes", [])
                if class_filter and class_filter.lower() != "all":
                    allowed = [x.strip() for x in str(class_filter).split(",")]
                    if not any(c in allowed for c in classes):
                        continue

                dist = doc.get("district", "")
                if district_filter and district_filter.lower() != "all":
                    if dist.lower() != district_filter.lower():
                        continue

                key = (doc.get("name", "").upper(), doc.get("phone", ""))
                teachers[key] = {
                    "name": doc.get("name", ""),
                    "phone": doc.get("phone", ""),
                    "categoryType": cat,
                    "schoolType": doc.get("schoolType", ""),
                    "schoolName": doc.get("schoolName", ""),
                    "district": dist,
                    "zone": doc.get("zone", ""),
                    "board": doc.get("board", "State Board"),
                    "classes": set(classes),
                    "subjects": set(doc.get("subjects", [])),
                    "designation": doc.get("designation", "Subject Teacher"),
                }

                if limit and len(teachers) >= limit:
                    break
            except Exception:
                continue

    elapsed = time.time() - start_time
    print(f"[+] Loaded {len(teachers):,} matching teachers from NDJSON in {elapsed:.1f}s", file=sys.stderr)
    return teachers

# ─── MONGO DOCUMENT BUILDER ───────────────────────────────────────────────────

def build_mongo_doc(t, now_iso):
    classes_list = sorted(list(t["classes"]), key=lambda x: int(x) if x.isdigit() else 99)
    subjects_list = sorted(list(t["subjects"]))
    primary_subject = subjects_list[0] if subjects_list else "General"

    return {
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
        "updatedAt": {"$date": now_iso},
    }

# ─── STATS & REPORTING ────────────────────────────────────────────────────────

def print_analytics_report(teachers):
    total = len(teachers)
    if total == 0:
        print("\n[!] No teachers found matching specified criteria.\n")
        return

    school_count = 0
    private_count = 0
    class_counts = {str(c): 0 for c in range(5, 13)}
    district_counts = {}
    subject_counts = {}

    for t in teachers.values():
        if t["categoryType"] == "Private Tutor":
            private_count += 1
        else:
            school_count += 1

        for c in t["classes"]:
            if c in class_counts:
                class_counts[c] += 1

        d = t.get("district") or "Unknown"
        district_counts[d] = district_counts.get(d, 0) + 1

        for s in t["subjects"]:
            subject_counts[s] = subject_counts.get(s, 0) + 1

    print("\n" + "=" * 70)
    print("       📊 TEACHER MASTER DATA - CATEGORY & CLASS SUMMARY")
    print("=" * 70)
    print(f"Total Unique Teachers: {total:,}")
    print("-" * 70)
    print("CATEGORIES:")
    school_pct = (school_count / total * 100) if total else 0
    private_pct = (private_count / total * 100) if total else 0
    print(f"  🏫 School Teachers:         {school_count:>8,} ({school_pct:.1f}%)")
    print(f"  👨‍🏫 Private Tutors / Others:  {private_count:>8,} ({private_pct:.1f}%)")
    print("-" * 70)
    print("CLASS DISTRIBUTION (A teacher can belong to multiple classes):")
    for c in range(5, 13):
        cls_key = str(c)
        c_cnt = class_counts.get(cls_key, 0)
        c_pct = (c_cnt / total * 100) if total else 0
        bar = "█" * int(c_pct / 4)
        print(f"  Class {cls_key:>2}: {c_cnt:>8,} ({c_pct:>5.1f}%)  {bar}")
    print("-" * 70)
    print("TOP 10 DISTRICTS:")
    top_dist = sorted(district_counts.items(), key=lambda x: -x[1])[:10]
    for dist_name, cnt in top_dist:
        d_pct = (cnt / total * 100) if total else 0
        print(f"  {dist_name:<26}: {cnt:>8,} ({d_pct:.1f}%)")
    print("-" * 70)
    print("TOP 8 SUBJECTS:")
    top_subj = sorted(subject_counts.items(), key=lambda x: -x[1])[:8]
    for subj_name, cnt in top_subj:
        print(f"  {subj_name:<26}: {cnt:>8,}")
    print("=" * 70 + "\n")

# ─── MONGO INGESTION ──────────────────────────────────────────────────────────

def import_to_mongodb(ndjson_file, db_name=DEFAULT_MONGO_DB, coll_name=DEFAULT_MONGO_COLL, drop=False, container=DEFAULT_DOCKER_CONTAINER):
    """
    Executes high-speed mongoimport using Docker container or local mongoimport CLI.
    """
    print(f"[*] Starting MongoDB ingestion into {db_name}.{coll_name}...", file=sys.stderr)
    start_time = time.time()

    # Check if Docker container is available
    docker_check = subprocess.run(["docker", "ps", "--filter", f"name={container}", "--format", "{{.Names}}"], capture_output=True, text=True)
    is_docker = container in docker_check.stdout

    if is_docker:
        print(f"[+] Found Docker container '{container}'. Streaming data through containerized mongoimport...", file=sys.stderr)
        cmd = [
            "docker", "exec", "-i", container,
            "mongoimport",
            "--db", db_name,
            "--collection", coll_name,
            "--type", "json"
        ]
        if drop:
            cmd.append("--drop")

        with open(ndjson_file, "rb") as f:
            proc = subprocess.run(cmd, stdin=f, capture_output=True, text=True)
            if proc.returncode != 0:
                print(f"[-] Docker mongoimport error:\n{proc.stderr}", file=sys.stderr)
                return False
            else:
                print(proc.stderr, file=sys.stderr)
    else:
        # Fallback to local mongoimport command
        print("[*] Docker container not detected directly. Attempting local mongoimport CLI...", file=sys.stderr)
        cmd = [
            "mongoimport",
            "--db", db_name,
            "--collection", coll_name,
            "--type", "json",
            "--file", ndjson_file
        ]
        if drop:
            cmd.append("--drop")
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            print(f"[-] Local mongoimport failed: {proc.stderr}", file=sys.stderr)
            return False
        else:
            print(proc.stderr, file=sys.stderr)

    elapsed = time.time() - start_time
    print(f"[+] MongoDB ingestion complete in {elapsed:.1f}s!", file=sys.stderr)
    return True

# ─── MAIN CLI DISPATCHER ──────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Transfer Teacher Data from SQL to NoSQL MongoDB Category-Wise",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("--source", choices=["auto", "sql", "ndjson"], default="auto",
                        help="Data source:\n"
                             "  auto: use cached NDJSON if available, else stream from SQL\n"
                             "  sql: stream directly from raw SQL dump file\n"
                             "  ndjson: read from pre-extracted NDJSON file")
    parser.add_argument("--sql-path", default=DEFAULT_SQL_PATH, help=f"Path to SQL dump (default: {DEFAULT_SQL_PATH})")
    parser.add_argument("--ndjson-path", default=DEFAULT_CACHE_NDJSON, help=f"Path to NDJSON (default: {DEFAULT_CACHE_NDJSON})")

    parser.add_argument("--category", choices=["ALL", "School", "Private Tutor"], default="ALL",
                        help="Filter by category type:\n"
                             "  School: School Teachers only\n"
                             "  Private Tutor: Private Tutors only\n"
                             "  ALL: Both categories (default)")
    parser.add_argument("--class", dest="class_filter", default=None,
                        help="Filter by class (e.g. 10, 12 or 5,6,7,8,9,10,11,12)")
    parser.add_argument("--district", default=None, help="Filter by District name (e.g. 'KOLKATA', 'HOWRAH')")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of teachers to process")

    parser.add_argument("--mode", choices=["import", "export", "stats", "both"], default="import",
                        help="Operation mode:\n"
                             "  import: Stream and import into MongoDB (default)\n"
                             "  export: Write to output NDJSON file\n"
                             "  stats: Display category & class statistics report only\n"
                             "  both: Export NDJSON and import to MongoDB")
    parser.add_argument("--output", default=None, help="Output NDJSON file path (for export mode)")
    parser.add_argument("--split-categories", action="store_true",
                        help="Export separate files: teachers_school.ndjson and teachers_private.ndjson")
    parser.add_argument("--drop", action="store_true", help="Drop MongoDB collection before importing")
    parser.add_argument("--mongo-db", default=DEFAULT_MONGO_DB, help=f"Target MongoDB database (default: {DEFAULT_MONGO_DB})")
    parser.add_argument("--mongo-coll", default=DEFAULT_MONGO_COLL, help=f"Target MongoDB collection (default: {DEFAULT_MONGO_COLL})")
    parser.add_argument("--container", default=DEFAULT_DOCKER_CONTAINER, help="MongoDB Docker container name (default: mongodb)")

    args = parser.parse_args()

    # Determine source
    use_ndjson = False
    if args.source == "ndjson":
        use_ndjson = True
    elif args.source == "sql":
        use_ndjson = False
    else:  # auto
        if os.path.exists(args.ndjson_path):
            use_ndjson = True
        else:
            use_ndjson = False

    # Extract / Load Teachers
    if use_ndjson:
        teachers = stream_from_ndjson(
            args.ndjson_path,
            category_filter=args.category,
            class_filter=args.class_filter,
            district_filter=args.district,
            limit=args.limit
        )
    else:
        teachers = stream_from_sql(
            args.sql_path,
            category_filter=args.category,
            class_filter=args.class_filter,
            district_filter=args.district,
            limit=args.limit
        )

    # Always display analytics summary
    print_analytics_report(teachers)

    if args.mode == "stats":
        sys.exit(0)

    now_iso = datetime.utcnow().isoformat() + "Z"

    # Export Mode / Split Categories
    if args.split_categories:
        school_path = "/tmp/teachers_school.ndjson"
        private_path = "/tmp/teachers_private_tutor.ndjson"
        print(f"[*] Splitting categories into:\n  -> {school_path}\n  -> {private_path}", file=sys.stderr)
        with open(school_path, "w", encoding="utf-8") as fs, open(private_path, "w", encoding="utf-8") as fp:
            for t in teachers.values():
                doc = build_mongo_doc(t, now_iso)
                line = json.dumps(doc, ensure_ascii=False) + "\n"
                if t["categoryType"] == "Private Tutor":
                    fp.write(line)
                else:
                    fs.write(line)
        print(f"[+] Category split export complete!", file=sys.stderr)

    target_export_path = args.output or f"/tmp/teachers_transfer_{int(time.time())}.ndjson"
    if args.mode in ["export", "both", "import"]:
        print(f"[*] Writing MongoDB-ready NDJSON to {target_export_path}...", file=sys.stderr)
        with open(target_export_path, "w", encoding="utf-8") as out:
            for t in teachers.values():
                doc = build_mongo_doc(t, now_iso)
                out.write(json.dumps(doc, ensure_ascii=False) + "\n")
        print(f"[+] Generated {target_export_path} ({len(teachers):,} documents)", file=sys.stderr)

    # Import Mode
    if args.mode in ["import", "both"]:
        success = import_to_mongodb(
            target_export_path,
            db_name=args.mongo_db,
            coll_name=args.mongo_coll,
            drop=args.drop,
            container=args.container
        )
        if success:
            print(f"\n[SUCCESS] Category-wise transfer completed: {len(teachers):,} teachers ingested into MongoDB '{args.mongo_db}.{args.mongo_coll}'!\n")
        else:
            print(f"\n[!] Ingestion failed. Please review error messages above or run with --output to inspect NDJSON.\n", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()

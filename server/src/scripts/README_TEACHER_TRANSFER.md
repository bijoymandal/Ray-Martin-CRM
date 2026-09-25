# 🚀 Teacher Category-Wise SQL to NoSQL MongoDB Transfer Pipeline

Production-ready scripts to transfer, normalize, and categorize teacher master data from relational SQL dumps into NoSQL MongoDB for **Ray-Martin-CRM**.

---

## 📁 Available Transfer Scripts

| Script | Location | Purpose |
|---|---|---|
| **Bash Runner** | [`./transfer_teachers.sh`](file:///Users/bijoy/projects/Ray-Martin-CRM/transfer_teachers.sh) | Interactive or CLI wrapper with one-command execution |
| **Python Engine** | [`server/src/scripts/transfer_teachers_sql_to_mongo.py`](file:///Users/bijoy/projects/Ray-Martin-CRM/server/src/scripts/transfer_teachers_sql_to_mongo.py) | High-speed streaming parser, filtering, and Docker `mongoimport` |
| **Node.js Engine** | [`server/src/scripts/transfer_teachers.js`](file:///Users/bijoy/projects/Ray-Martin-CRM/server/src/scripts/transfer_teachers.js) | Node.js & Prisma batch bulk-upsert / stats runner |

---

## 🏷️ Category-Wise Capabilities

1. **School Teachers (`School`)**:
   - Covers teachers belonging to High Schools, Higher Secondary (HS), Primary Schools, and CBSE Schools.
   - Includes school names, board, subjects, classes taught, district, and zone.
2. **Private Tutors / Teachers (`Private Tutor`)**:
   - Covers independent private tutors, home tutors, coaching center faculty, and private tuition teachers.
   - Categorized as `categoryType: "Private Tutor"` with coaching center/tuition center name and subjects.
3. **Class-Wise Assignment**:
   - Maps each teacher to an array of classes: `classes: ["5", "6", ..., "10", "11", "12"]`.
   - Indexed via MongoDB multikey indexes for sub-millisecond filtering.

---

## ⚡ Quick Start Examples

### 1. Interactive Menu
Simply run the script with no arguments to get an interactive menu:
```bash
./transfer_teachers.sh
```

### 2. View Category & Class Statistics Report (No DB changes)
```bash
./transfer_teachers.sh --stats
```

### 3. Transfer All Teachers (School + Private Tutors)
```bash
./transfer_teachers.sh --category all
```

### 4. Transfer School Teachers Only
```bash
./transfer_teachers.sh --category school
```

### 5. Transfer Private Tutors Only
```bash
./transfer_teachers.sh --category private
```

### 6. Transfer Class-Wise (e.g. Class 10 or Class 12 only)
```bash
# School Teachers teaching Class 10
./transfer_teachers.sh --category school --class 10

# Private Tutors teaching Class 12
./transfer_teachers.sh --category private --class 12
```

### 7. Filter by District
```bash
./transfer_teachers.sh --category school --district KOLKATA
```

### 8. Export Separate Files for Each Category
Generates `/tmp/teachers_school.ndjson` and `/tmp/teachers_private_tutor.ndjson`:
```bash
./transfer_teachers.sh --split
```

---

## 💻 Running via Python Directly

```bash
# Display full category & class breakdown
python3 server/src/scripts/transfer_teachers_sql_to_mongo.py --mode stats

# Import only Private Tutors
python3 server/src/scripts/transfer_teachers_sql_to_mongo.py --category "Private Tutor" --mode import

# Import only School Teachers for Class 10 & 12
python3 server/src/scripts/transfer_teachers_sql_to_mongo.py --category "School" --class 10,12 --mode import

# Stream directly from a new/different SQL dump file
python3 server/src/scripts/transfer_teachers_sql_to_mongo.py --source sql --sql-path /path/to/dump.sql --mode import
```

---

## 📦 Running via Node.js / Docker

Inside the Docker server container:
```bash
docker compose exec crm-server npm run transfer:teachers:stats
docker compose exec crm-server npm run transfer:teachers:school
docker compose exec crm-server npm run transfer:teachers:private
```

---

## 📊 SQL to MongoDB Schema Transformation

| SQL Column (`record_book`) | MongoDB Document Field | Type | Example Value |
|---|---|---|---|
| `t_name` (`cols[19]`) | `name` | `String` | `"Malay Mukherjee"` |
| `t_phone` (`cols[20]`) | `phone` | `String` | `"9433929365"` |
| `category_type` (`cols[22]`) | `categoryType` | `String` | `"School"` or `"Private Tutor"` |
| `school_type` (`cols[23]`) | `schoolType` | `String` | `"HS School"`, `"Private Coaching"` |
| `school_name` (`cols[21]`) | `schoolName` | `String` | `"Uttarpara Govt. High School"` |
| `class_name` (`cols[34]`) | `classes` | `String[]` | `["10", "11", "12"]` |
| `subj_name` (`cols[32]`) | `subjects` | `String[]` | `["Bengali", "History"]` |
| `dist` (`cols[36]`) | `district` | `String` | `"HOOGHLY"` |
| `zone` (`cols[38]`) | `zone` | `String` | `"Uttarpara"` |
| `board_name` (`cols[31]`) | `board` | `String` | `"WBBSE"` |

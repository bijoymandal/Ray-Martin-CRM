#!/bin/bash
# ==============================================================================
# Ray-Martin-CRM: Teacher Category-Wise SQL to MongoDB Transfer Utility
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/transfer_teachers_sql_to_mongo.py"
NODE_SCRIPT="$SCRIPT_DIR/transfer_teachers.js"
SQL_DEFAULT="/Users/bijoy/Downloads/canvee-09-2026-02.sql"
NDJSON_CACHE="/tmp/canvee_teachers_all.ndjson"

# Color formatting
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "    Ray-Martin CRM: SQL -> MongoDB Category-Wise Transfer Tool       "
echo "======================================================================"
echo -e "${NC}"

# Display usage help
show_help() {
    echo -e "${BOLD}Usage:${NC}"
    echo "  $0 [options]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  --category <all|school|private>   Filter by category (default: all)"
    echo "  --class <number>                  Filter by class (e.g. 10, 12, or 5..12)"
    echo "  --district <name>                 Filter by District name"
    echo "  --mode <import|export|stats>      Execution mode (default: import)"
    echo "  --sql <path>                      Path to SQL dump file"
    echo "  --split                           Export separate category files"
    echo "  --drop                            Drop existing teachers before importing"
    echo "  --stats                           Shortcut for --mode stats"
    echo "  --engine <python|node>            Execution engine (default: python)"
    echo "  -h, --help                        Show this help message"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  $0 --stats"
    echo "  $0 --category school"
    echo "  $0 --category private"
    echo "  $0 --category school --class 10"
    echo "  $0 --split"
    echo ""
}

CATEGORY="ALL"
CLASS=""
DISTRICT=""
MODE="import"
SQL_FILE="$SQL_DEFAULT"
SPLIT_FLAG=""
DROP_FLAG=""
ENGINE="python"

# Parse CLI arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --category)
            if [[ "$2" =~ ^[Ss]chool ]]; then
                CATEGORY="School"
            elif [[ "$2" =~ ^[Pp]rivate ]]; then
                CATEGORY="Private Tutor"
            else
                CATEGORY="ALL"
            fi
            shift 2
            ;;
        --class)
            CLASS="$2"
            shift 2
            ;;
        --district)
            DISTRICT="$2"
            shift 2
            ;;
        --mode)
            MODE="$2"
            shift 2
            ;;
        --sql)
            SQL_FILE="$2"
            shift 2
            ;;
        --split)
            SPLIT_FLAG="--split-categories"
            shift
            ;;
        --drop)
            DROP_FLAG="--drop"
            shift
            ;;
        --stats)
            MODE="stats"
            shift
            ;;
        --engine)
            ENGINE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# If no arguments provided, show interactive selector
if [ -z "$CLASS" ] && [ "$CATEGORY" == "ALL" ] && [ "$MODE" == "import" ] && [ -z "$SPLIT_FLAG" ] && [ -z "$DROP_FLAG" ] && [ -t 0 ]; then
    echo -e "${YELLOW}${BOLD}Select a transfer option:${NC}"
    echo "  1) 🚀 Transfer ALL Teachers (School + Private Tutors) into MongoDB"
    echo "  2) 🏫 Transfer School Teachers only into MongoDB"
    echo "  3) 👨‍🏫 Transfer Private Tutors only into MongoDB"
    echo "  4) 🎓 Transfer Class-wise (Class 5, 10, 12, etc.)"
    echo "  5) 📊 View Category & Class Statistics Report (No database changes)"
    echo "  6) 📦 Export Category-wise Split Files (/tmp/teachers_school.ndjson & /tmp/teachers_private_tutor.ndjson)"
    echo "  7) ❌ Exit"
    echo ""
    read -p "Enter choice [1-7]: " CHOICE

    case $CHOICE in
        1)
            CATEGORY="ALL"
            MODE="import"
            ;;
        2)
            CATEGORY="School"
            MODE="import"
            ;;
        3)
            CATEGORY="Private Tutor"
            MODE="import"
            ;;
        4)
            read -p "Enter Class number (e.g. 10 or 12): " CLASS_INPUT
            CLASS="$CLASS_INPUT"
            MODE="import"
            ;;
        5)
            MODE="stats"
            ;;
        6)
            MODE="export"
            SPLIT_FLAG="--split-categories"
            ;;
        7)
            echo "Exiting."
            exit 0
            ;;
        *)
            echo "Invalid choice. Exiting."
            exit 1
            ;;
    esac
fi

echo -e "${GREEN}[*] Target Category:${NC}   $CATEGORY"
echo -e "${GREEN}[*] Target Class:${NC}      ${CLASS:-All Classes}"
echo -e "${GREEN}[*] District Filter:${NC}   ${DISTRICT:-All Districts}"
echo -e "${GREEN}[*] Execution Mode:${NC}    $MODE"
echo -e "${GREEN}[*] Engine:${NC}            $ENGINE"
echo ""

if [ "$ENGINE" == "node" ]; then
    # Node.js Execution
    ARGS=("--category=$CATEGORY")
    if [ -n "$CLASS" ]; then ARGS+=("--class=$CLASS"); fi
    if [ -n "$DISTRICT" ]; then ARGS+=("--district=$DISTRICT"); fi
    if [ "$MODE" == "stats" ]; then ARGS+=("--stats"); fi
    if [ -n "$DROP_FLAG" ]; then ARGS+=("--drop"); fi

    cd "$SERVER_DIR"
    node "$NODE_SCRIPT" "${ARGS[@]}"
else
    # Python Execution
    PYTHON_CMD="python3"
    if ! command -v python3 &> /dev/null; then
        PYTHON_CMD="/usr/bin/python3"
    fi

    PY_ARGS=("$PYTHON_SCRIPT" "--category" "$CATEGORY" "--mode" "$MODE")
    if [ -n "$CLASS" ]; then PY_ARGS+=("--class" "$CLASS"); fi
    if [ -n "$DISTRICT" ]; then PY_ARGS+=("--district" "$DISTRICT"); fi
    if [ -n "$SPLIT_FLAG" ]; then PY_ARGS+=("$SPLIT_FLAG"); fi
    if [ -n "$DROP_FLAG" ]; then PY_ARGS+=("$DROP_FLAG"); fi
    if [ -f "$SQL_FILE" ]; then PY_ARGS+=("--sql-path" "$SQL_FILE"); fi

    $PYTHON_CMD "${PY_ARGS[@]}"
fi

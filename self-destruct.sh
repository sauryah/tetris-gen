#!/bin/bash
set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}╔══════════════════════════════════════╗${NC}"
echo -e "${RED}║       TETRIS GEN SELF-DESTRUCT       ║${NC}"
echo -e "${RED}╚══════════════════════════════════════╝${NC}"
echo ""

read -p "Type CONFIRM to destroy everything: " confirm
if [ "$confirm" != "CONFIRM" ]; then
    echo "Aborted."
    exit 1
fi

echo -e "${YELLOW}[1/3] Wiping database via API...${NC}"
SELF_DESTRUCT_KEY="${SELF_DESTRUCT_KEY:-destroy}"
response=$(curl -s -X POST http://localhost:4200/api/self-destruct \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$SELF_DESTRUCT_KEY\"}" 2>/dev/null || echo '{"error":"API unreachable"}')

if echo "$response" | grep -q '"destroyed":true'; then
    echo -e "${YELLOW}  Database wiped.${NC}"
else
    echo -e "${YELLOW}  API response: $response${NC}"
fi

echo -e "${YELLOW}[2/3] Stopping containers and removing volumes...${NC}"
docker-compose down -v 2>/dev/null || docker compose down -v

echo -e "${YELLOW}[3/3] Removing images and build cache...${NC}"
docker image prune -af 2>/dev/null || true
docker builder prune -af 2>/dev/null || true

echo ""
echo -e "${RED}══════════════════════════════════════${NC}"
echo -e "${RED}  ALL DESTROYED${NC}"
echo -e "${RED}══════════════════════════════════════${NC}"
echo ""
echo "To rebuild from scratch:"
echo "  docker-compose up --build"

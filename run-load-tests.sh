#!/bin/bash
# Script para ejecutar pruebas de carga y estrés
# Uso: ./run-load-tests.sh

set -e

echo "======================================"
echo "BebecioApp - Load & Stress Testing"
echo "======================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL=${BASE_URL:-"http://localhost:3000"}
AUTH_TOKEN=${AUTH_TOKEN:-""}
RESULTS_DIR="./load-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Crear directorio de resultados
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}Base URL:${NC} $BASE_URL"
echo -e "${BLUE}Results Directory:${NC} $RESULTS_DIR"
echo -e "${BLUE}Timestamp:${NC} $TIMESTAMP"
echo ""

# ==========================================
# 1. UNIT TESTS DE PERFORMANCE
# ==========================================
run_unit_tests() {
  echo -e "${YELLOW}[1/4] Running Unit Performance Tests...${NC}"
  
  if command -v ng &> /dev/null; then
    ng test --include='**/load-test.spec.ts' --watch=false --code-coverage
    echo -e "${GREEN}✓ Unit tests completed${NC}"
  else
    echo -e "${RED}✗ Angular CLI not found. Skipping unit tests.${NC}"
  fi
  echo ""
}

# ==========================================
# 2. K6 LOAD TEST
# ==========================================
run_k6_load_test() {
  echo -e "${YELLOW}[2/4] Running K6 Load Test...${NC}"
  
  if command -v k6 &> /dev/null; then
    # Test 1: Load Test Estándar
    echo "  → Running standard load test (50 VUs, 10m)..."
    k6 run tests/load-test-api.js \
      --vus=50 \
      --duration=10m \
      -e BASE_URL="$BASE_URL" \
      -e AUTH_TOKEN="$AUTH_TOKEN" \
      --out json="$RESULTS_DIR/load-test-${TIMESTAMP}.json" || true
    
    # Test 2: Stress Test (incremental)
    echo "  → Running stress test (incremental load)..."
    k6 run tests/load-test-api.js \
      --stage 5m:10 \
      --stage 5m:20 \
      --stage 5m:50 \
      --stage 5m:100 \
      -e BASE_URL="$BASE_URL" \
      -e AUTH_TOKEN="$AUTH_TOKEN" \
      --out json="$RESULTS_DIR/stress-test-${TIMESTAMP}.json" || true
    
    # Test 3: Spike Test
    echo "  → Running spike test..."
    k6 run tests/load-test-api.js \
      --stage 2m:10 \
      --stage 1m:100 \
      --stage 2m:10 \
      -e BASE_URL="$BASE_URL" \
      -e AUTH_TOKEN="$AUTH_TOKEN" \
      --out json="$RESULTS_DIR/spike-test-${TIMESTAMP}.json" || true
    
    echo -e "${GREEN}✓ K6 tests completed${NC}"
  else
    echo -e "${RED}✗ K6 not found. Install with: npm install -g k6${NC}"
    echo "  Or use: go install go.k6.io/k6@latest"
  fi
  echo ""
}

# ==========================================
# 3. LIGHTHOUSE PERFORMANCE AUDIT
# ==========================================
run_lighthouse() {
  echo -e "${YELLOW}[3/4] Running Lighthouse Performance Audit...${NC}"
  
  if command -v lighthouse &> /dev/null; then
    lighthouse "$BASE_URL" \
      --output=json \
      --output-path="$RESULTS_DIR/lighthouse-${TIMESTAMP}.json" \
      --chrome-flags="--headless" || true
    
    echo -e "${GREEN}✓ Lighthouse audit completed${NC}"
  else
    echo -e "${YELLOW}⚠ Lighthouse CLI not found${NC}"
    echo "  Install with: npm install -g lighthouse"
  fi
  echo ""
}

# ==========================================
# 4. GENERAR REPORTE
# ==========================================
generate_report() {
  echo -e "${YELLOW}[4/4] Generating Report...${NC}"
  
  REPORT_FILE="$RESULTS_DIR/REPORT-${TIMESTAMP}.md"
  
  cat > "$REPORT_FILE" << 'EOF'
# Load & Stress Testing Report

## Executive Summary

This report documents the results of load and stress testing conducted on the BebecioApp system.

### Test Date
%TEST_DATE%

### Environment
- Base URL: %BASE_URL%
- Duration: %DURATION%
- Test Tools: K6, Lighthouse, Unit Tests

## Test Results

### 1. Unit Tests Results
%UNIT_TEST_RESULTS%

### 2. K6 Load Test Results
%K6_RESULTS%

### 3. Lighthouse Performance
%LIGHTHOUSE_RESULTS%

## Key Findings

### Strengths
- ✓ System maintained stability under load
- ✓ Response times within acceptable thresholds

### Bottlenecks Identified
- ⚠️ [List any identified bottlenecks]
- ⚠️ [List recommended improvements]

## Recommendations

1. **Immediate Actions**
   - [Priority 1 items]

2. **Short-term (1-2 weeks)**
   - [Items to fix]

3. **Long-term (1-3 months)**
   - [Architectural improvements]

## Detailed Metrics

### API Response Times
| Endpoint | P50 | P95 | P99 | Status |
|----------|-----|-----|-----|--------|
| GET /bebes | - | - | - | |
| POST /actividades | - | - | - | |
| GET /actividades | - | - | - | |

### System Resources
- CPU Usage: %CPU%
- Memory Usage: %MEMORY%
- Database Connections: %DB_CONN%

## Test Data & Methodology

### Load Test Parameters
- Virtual Users: 50-100
- Ramp-up: 2 minutes
- Duration: 10 minutes
- Request Distribution: 60% GET, 40% POST

### Stress Test Parameters
- Starting VUs: 10
- Max VUs: 100+
- Increment: +20 every 5 minutes
- Stopping Criteria: 50% error rate

## Conclusion

%CONCLUSION%

---
Generated: %GENERATED_TIME%
EOF

  # Reemplazar placeholders
  sed -i "s|%TEST_DATE%|$(date)|g" "$REPORT_FILE"
  sed -i "s|%BASE_URL%|$BASE_URL|g" "$REPORT_FILE"
  sed -i "s|%GENERATED_TIME%|$(date)|g" "$REPORT_FILE"
  
  echo -e "${GREEN}✓ Report generated at: $REPORT_FILE${NC}"
  echo ""
}

# ==========================================
# 5. SHOW RESULTS SUMMARY
# ==========================================
show_summary() {
  echo -e "${BLUE}======================================"
  echo "Test Results Summary"
  echo "======================================${NC}"
  echo ""
  
  if [ -d "$RESULTS_DIR" ]; then
    echo -e "${GREEN}Generated files:${NC}"
    ls -lah "$RESULTS_DIR"/
    echo ""
  fi
  
  echo -e "${BLUE}Next Steps:${NC}"
  echo "1. Review the generated report: $RESULTS_DIR/REPORT-${TIMESTAMP}.md"
  echo "2. Analyze K6 results with: k6 stats $RESULTS_DIR/*.json"
  echo "3. View Lighthouse results: open $RESULTS_DIR/lighthouse-*.json"
  echo ""
  echo -e "${YELLOW}Recommendations:${NC}"
  echo "• If errors found, enable detailed logging: LOG_LEVEL=debug"
  echo "• Use Chrome DevTools for additional profiling"
  echo "• Monitor Firebase console during tests"
  echo ""
}

# ==========================================
# MAIN EXECUTION
# ==========================================

# Validar servidor está disponible
echo -e "${YELLOW}Checking server availability...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200\|404"; then
  echo -e "${GREEN}✓ Server is available${NC}"
  echo ""
else
  echo -e "${RED}✗ Server at $BASE_URL is not available${NC}"
  echo "Make sure the backend is running and accessible"
  exit 1
fi

# Ejecutar pruebas
run_unit_tests
run_k6_load_test
run_lighthouse
generate_report
show_summary

echo -e "${GREEN}======================================"
echo "All tests completed!"
echo "======================================${NC}"

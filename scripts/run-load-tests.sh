#!/bin/bash

# =============================================================================
# Load Testing Runner for Solarify
# =============================================================================
# Comprehensive load testing execution with multiple scenarios
# Integrates with CI/CD pipeline and deployment verification
# =============================================================================

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly RESULTS_DIR="${PROJECT_ROOT}/load-test-results"
readonly LOG_FILE="${RESULTS_DIR}/load-test-$(date +%Y%m%d-%H%M%S).log"

# Environment variables with defaults
readonly ENVIRONMENT="${ENVIRONMENT:-staging}"
readonly PROJECT_ID="${PROJECT_ID:-solarify-${ENVIRONMENT}}"
readonly BASE_URL="${BASE_URL:-https://${PROJECT_ID}.web.app}"

# Test configuration
readonly K6_VERSION="${K6_VERSION:-0.47.0}"
readonly TEST_SCENARIOS="${TEST_SCENARIOS:-light_load,peak_load,rfq_journey}"
readonly TEST_DURATION="${TEST_DURATION:-300s}"  # 5 minutes default
readonly MAX_VUS="${MAX_VUS:-50}"
readonly TARGET_RPS="${TARGET_RPS:-10}"

# Performance thresholds for different environments
declare -A ENVIRONMENT_THRESHOLDS
ENVIRONMENT_THRESHOLDS[development]="p(95)<3000,rate<0.10"    # More lenient for dev
ENVIRONMENT_THRESHOLDS[staging]="p(95)<2000,rate<0.05"        # Standard thresholds
ENVIRONMENT_THRESHOLDS[production]="p(95)<1500,rate<0.02"     # Strict for production

# Logging functions
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        INFO)  echo -e "${GREEN}[INFO]${NC}  ${timestamp} - $message" ;;
        WARN)  echo -e "${YELLOW}[WARN]${NC}  ${timestamp} - $message" ;;
        ERROR) echo -e "${RED}[ERROR]${NC} ${timestamp} - $message" ;;
        DEBUG) echo -e "${BLUE}[DEBUG]${NC} ${timestamp} - $message" ;;
    esac
    
    echo "[${level}] ${timestamp} - $message" >> "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# Setup functions
setup_k6() {
    log "INFO" "Setting up k6 load testing tool..."
    
    if command -v k6 &> /dev/null; then
        local k6_version=$(k6 version | grep -o 'v[0-9.]*' | head -1)
        log "INFO" "k6 already installed: $k6_version"
        return 0
    fi
    
    log "INFO" "Installing k6 version $K6_VERSION..."
    
    case "$OSTYPE" in
        darwin*)
            if command -v brew &> /dev/null; then
                brew install k6
            else
                error_exit "Homebrew not found. Please install k6 manually from https://k6.io/docs/getting-started/installation/"
            fi
            ;;
        linux*)
            curl -s https://dl.k6.io/key.gpg | sudo apt-key add -
            echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install -y k6
            ;;
        *)
            error_exit "Unsupported operating system: $OSTYPE"
            ;;
    esac
    
    if command -v k6 &> /dev/null; then
        log "INFO" "k6 installed successfully: $(k6 version)"
    else
        error_exit "Failed to install k6"
    fi
}

setup_results_directory() {
    log "INFO" "Setting up results directory..."
    
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$RESULTS_DIR/reports"
    mkdir -p "$RESULTS_DIR/metrics"
    mkdir -p "$RESULTS_DIR/logs"
    
    # Create timestamp for this test run
    export TEST_RUN_ID="loadtest-$(date +%Y%m%d-%H%M%S)"
    export TEST_RESULTS_FILE="${RESULTS_DIR}/results-${TEST_RUN_ID}.json"
    
    log "INFO" "Results will be saved to: $RESULTS_DIR"
    log "INFO" "Test run ID: $TEST_RUN_ID"
}

validate_target_url() {
    log "INFO" "Validating target URL: $BASE_URL"
    
    # Test basic connectivity
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" || echo "000")
    
    if [[ "$response_code" =~ ^[2-3][0-9][0-9]$ ]]; then
        log "INFO" "Target URL is accessible (HTTP $response_code)"
    else
        error_exit "Target URL is not accessible (HTTP $response_code)"
    fi
    
    # Test response time
    local start_time=$(date +%s%N)
    curl -s "$BASE_URL" > /dev/null || true
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    log "INFO" "Initial response time: ${response_time}ms"
    
    if [[ $response_time -gt 10000 ]]; then
        log "WARN" "High initial response time (${response_time}ms) - consider investigating before load testing"
    fi
}

generate_k6_config() {
    local scenario="$1"
    local config_file="${RESULTS_DIR}/k6-config-${scenario}.js"
    
    log "DEBUG" "Generating k6 configuration for scenario: $scenario"
    
    # Get environment-specific thresholds
    local thresholds="${ENVIRONMENT_THRESHOLDS[$ENVIRONMENT]:-p(95)<2000,rate<0.05}"
    
    cat > "$config_file" << EOF
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  scenarios: {
    ${scenario}: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '${TEST_DURATION}', target: ${MAX_VUS} },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['${thresholds%,*}'],
    http_req_failed: ['${thresholds#*,}'],
    http_reqs: ['rate>5'],
  },
  tags: {
    environment: '${ENVIRONMENT}',
    project: '${PROJECT_ID}',
    scenario: '${scenario}',
    test_run: '${TEST_RUN_ID}',
  },
};

export default function() {
  const response = http.get('${BASE_URL}');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}
EOF
    
    echo "$config_file"
}

run_scenario() {
    local scenario="$1"
    local scenario_file="${SCRIPT_DIR}/load-testing.js"
    
    log "INFO" "Running load test scenario: $scenario"
    
    # Create scenario-specific results file
    local scenario_results="${RESULTS_DIR}/results-${scenario}-${TEST_RUN_ID}.json"
    
    # Set environment variables for the test
    export BASE_URL="$BASE_URL"
    export PROJECT_ID="$PROJECT_ID"
    export ENVIRONMENT="$ENVIRONMENT"
    export SCENARIO="$scenario"
    
    # Run k6 test
    local k6_args=(
        "run"
        "--out" "json=${scenario_results}"
        "--summary-trend-stats" "avg,min,med,max,p(95),p(99),count"
        "--tag" "scenario=${scenario}"
        "--tag" "environment=${ENVIRONMENT}"
        "--tag" "project=${PROJECT_ID}"
    )
    
    # Add VU and duration overrides if specified
    if [[ -n "${MAX_VUS:-}" ]]; then
        k6_args+=("--vus" "$MAX_VUS")
    fi
    
    if [[ -n "${TEST_DURATION:-}" ]]; then
        k6_args+=("--duration" "$TEST_DURATION")
    fi
    
    k6_args+=("$scenario_file")
    
    log "DEBUG" "k6 command: k6 ${k6_args[*]}"
    
    # Run the test
    if k6 "${k6_args[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        log "INFO" "Scenario $scenario completed successfully"
        return 0
    else
        log "ERROR" "Scenario $scenario failed"
        return 1
    fi
}

analyze_results() {
    log "INFO" "Analyzing load test results..."
    
    local analysis_file="${RESULTS_DIR}/analysis-${TEST_RUN_ID}.md"
    
    # Create analysis report
    cat > "$analysis_file" << EOF
# Load Test Analysis Report

**Test Run ID:** ${TEST_RUN_ID}
**Environment:** ${ENVIRONMENT}
**Project:** ${PROJECT_ID}
**Target URL:** ${BASE_URL}
**Test Date:** $(date '+%Y-%m-%d %H:%M:%S')

## Test Configuration

- **Scenarios:** ${TEST_SCENARIOS}
- **Duration:** ${TEST_DURATION}
- **Max VUs:** ${MAX_VUS}
- **Target RPS:** ${TARGET_RPS}

## Summary

EOF
    
    # Analyze each scenario result file
    for result_file in "${RESULTS_DIR}"/results-*-"${TEST_RUN_ID}".json; do
        if [[ -f "$result_file" ]]; then
            local scenario_name=$(basename "$result_file" | sed "s/results-\(.*\)-${TEST_RUN_ID}\.json/\1/")
            
            log "DEBUG" "Analyzing results for scenario: $scenario_name"
            
            # Extract key metrics using jq (if available)
            if command -v jq &> /dev/null; then
                local avg_duration=$(jq -r '.metrics.http_req_duration.values.avg // "N/A"' "$result_file")
                local p95_duration=$(jq -r '.metrics.http_req_duration.values."p(95)" // "N/A"' "$result_file")
                local error_rate=$(jq -r '.metrics.http_req_failed.values.rate // "N/A"' "$result_file")
                local total_requests=$(jq -r '.metrics.http_reqs.values.count // "N/A"' "$result_file")
                
                cat >> "$analysis_file" << EOF

### ${scenario_name^} Scenario

- **Average Response Time:** ${avg_duration}ms
- **95th Percentile:** ${p95_duration}ms
- **Error Rate:** ${error_rate}
- **Total Requests:** ${total_requests}

EOF
            else
                echo "### ${scenario_name^} Scenario" >> "$analysis_file"
                echo "- Results file: $result_file" >> "$analysis_file"
                echo "" >> "$analysis_file"
            fi
        fi
    done
    
    # Add recommendations
    cat >> "$analysis_file" << EOF

## Recommendations

Based on the load test results:

1. **Performance:** Review response times and identify bottlenecks if p95 > 2000ms
2. **Reliability:** Investigate any error rates above 5%
3. **Scalability:** Consider infrastructure scaling if tests approach capacity limits
4. **Monitoring:** Ensure production monitoring captures similar metrics

## Next Steps

- [ ] Review detailed metrics in individual result files
- [ ] Check application logs during test execution
- [ ] Verify monitoring alerts triggered correctly
- [ ] Consider additional test scenarios if needed

## Files Generated

EOF
    
    # List all generated files
    for file in "${RESULTS_DIR}"/*-"${TEST_RUN_ID}"*; do
        if [[ -f "$file" ]]; then
            echo "- $(basename "$file")" >> "$analysis_file"
        fi
    done
    
    log "INFO" "Analysis report created: $analysis_file"
}

generate_summary_report() {
    log "INFO" "Generating summary report..."
    
    local summary_file="${RESULTS_DIR}/summary-${TEST_RUN_ID}.txt"
    
    cat > "$summary_file" << EOF
===============================================================================
                       SOLARIFY LOAD TEST SUMMARY
===============================================================================

Test Run ID: ${TEST_RUN_ID}
Environment: ${ENVIRONMENT}
Target URL: ${BASE_URL}
Date: $(date '+%Y-%m-%d %H:%M:%S')

Test Configuration:
- Scenarios: ${TEST_SCENARIOS}
- Duration: ${TEST_DURATION}
- Max Virtual Users: ${MAX_VUS}
- Target RPS: ${TARGET_RPS}

Results Summary:
EOF
    
    # Count successful/failed scenarios
    local total_scenarios=0
    local successful_scenarios=0
    
    IFS=',' read -ra SCENARIOS_ARRAY <<< "$TEST_SCENARIOS"
    for scenario in "${SCENARIOS_ARRAY[@]}"; do
        ((total_scenarios++))
        local result_file="${RESULTS_DIR}/results-${scenario}-${TEST_RUN_ID}.json"
        if [[ -f "$result_file" ]]; then
            ((successful_scenarios++))
        fi
    done
    
    cat >> "$summary_file" << EOF
- Total Scenarios: ${total_scenarios}
- Successful: ${successful_scenarios}
- Failed: $((total_scenarios - successful_scenarios))

Files Generated:
EOF
    
    # List result files
    for file in "${RESULTS_DIR}"/*-"${TEST_RUN_ID}"*; do
        if [[ -f "$file" ]]; then
            echo "  - $(basename "$file")" >> "$summary_file"
        fi
    done
    
    cat >> "$summary_file" << EOF

Log File: ${LOG_FILE}

===============================================================================
EOF
    
    # Display summary
    cat "$summary_file"
    
    log "INFO" "Summary report saved: $summary_file"
}

cleanup() {
    local exit_code=$?
    
    if [[ $exit_code -ne 0 ]]; then
        log "ERROR" "Load testing failed with exit code $exit_code"
    else
        log "INFO" "Load testing completed successfully"
    fi
    
    # Archive old results (keep only last 10 runs)
    find "$RESULTS_DIR" -name "results-*.json" -type f -mtime +7 -delete || true
    find "$RESULTS_DIR" -name "analysis-*.md" -type f -mtime +7 -delete || true
    
    log "INFO" "Cleanup completed"
    exit $exit_code
}

# Main execution
main() {
    log "INFO" "Starting comprehensive load testing for Solarify"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Project ID: $PROJECT_ID"
    log "INFO" "Target URL: $BASE_URL"
    log "INFO" "Test scenarios: $TEST_SCENARIOS"
    
    # Setup
    setup_results_directory
    setup_k6
    validate_target_url
    
    # Run tests
    local failed_scenarios=0
    IFS=',' read -ra SCENARIOS_ARRAY <<< "$TEST_SCENARIOS"
    
    for scenario in "${SCENARIOS_ARRAY[@]}"; do
        scenario=$(echo "$scenario" | xargs) # Trim whitespace
        
        if ! run_scenario "$scenario"; then
            ((failed_scenarios++))
            log "WARN" "Scenario $scenario failed"
        fi
        
        # Brief pause between scenarios
        sleep 5
    done
    
    # Analysis
    analyze_results
    generate_summary_report
    
    # Final result
    if [[ $failed_scenarios -eq 0 ]]; then
        log "INFO" "All load test scenarios completed successfully! ✅"
        return 0
    else
        log "ERROR" "$failed_scenarios scenario(s) failed. Check logs for details. ❌"
        return 1
    fi
}

# Script entry point
trap cleanup EXIT

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --base-url)
            BASE_URL="$2"
            shift 2
            ;;
        --scenarios)
            TEST_SCENARIOS="$2"
            shift 2
            ;;
        --duration)
            TEST_DURATION="$2"
            shift 2
            ;;
        --max-vus)
            MAX_VUS="$2"
            shift 2
            ;;
        --help)
            cat << EOF
Usage: $0 [options]

Options:
    --environment    Target environment (development|staging|production)
    --base-url      Base URL for testing (default: https://PROJECT_ID.web.app)
    --scenarios     Comma-separated list of scenarios to run
    --duration      Test duration (default: 300s)
    --max-vus       Maximum virtual users (default: 50)
    --help          Show this help message

Examples:
    # Run default scenarios on staging
    $0 --environment staging

    # Run specific scenarios with custom parameters
    $0 --environment production --scenarios light_load,peak_load --duration 600s --max-vus 100

    # Run against custom URL
    $0 --base-url https://custom.domain.com --scenarios mixed

Available scenarios: light_load, peak_load, stress_test, spike_test, soak_test, 
                     rfq_journey, quote_journey, mixed
EOF
            exit 0
            ;;
        *)
            error_exit "Unknown option: $1. Use --help for usage information."
            ;;
    esac
done

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
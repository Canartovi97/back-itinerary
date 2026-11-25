#!/usr/bin/env sh
# Smoke test run right after a deployment: the system is "up" only when
# every service answers and the core flow (register -> login -> protected
# endpoint) works end to end. Exits non-zero on the first failure.
set -eu

ITINERARY_URL="${ITINERARY_URL:-http://localhost:3000}"
AIRPORT_URL="${AIRPORT_URL:-http://localhost:3001}"
NOTIFICATION_URL="${NOTIFICATION_URL:-http://localhost:3002}"

wait_for() {
  name="$1"; url="$2"
  for _ in $(seq 1 30); do
    if curl -fsS -o /dev/null "$url"; then echo "ok   $name is up ($url)"; return 0; fi
    sleep 3
  done
  echo "FAIL $name did not come up ($url)"; return 1
}

wait_for "airport-service"       "$AIRPORT_URL/api/docs-json"
wait_for "itinerary-service"     "$ITINERARY_URL/api/docs-json"
wait_for "notification-function" "$NOTIFICATION_URL/health"

email="smoke-$(date +%s)@example.com"
password="smoke-test-$(date +%s)"

curl -fsS -o /dev/null -X POST "$ITINERARY_URL/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}"
echo "ok   register"

token=$(curl -fsS -X POST "$ITINERARY_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
[ -n "$token" ] || { echo "FAIL login returned no token"; exit 1; }
echo "ok   login"

status=$(curl -s -o /dev/null -w '%{http_code}' "$ITINERARY_URL/itineraries")
[ "$status" = "401" ] || { echo "FAIL /itineraries without token returned $status, expected 401"; exit 1; }
echo "ok   /itineraries rejects missing token (401)"

curl -fsS -o /dev/null -H "Authorization: Bearer $token" "$ITINERARY_URL/itineraries"
echo "ok   /itineraries with token (200)"

echo "Smoke test passed."

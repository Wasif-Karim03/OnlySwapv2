#!/bin/bash

# Test script for OnlySwap backend endpoints
# Usage: ./test-endpoints.sh

BASE_URL="http://206.21.136.212:3001"
# For local testing, use: BASE_URL="http://localhost:3001"

echo "🧪 Testing OnlySwap Backend Endpoints"
echo "======================================"
echo ""

# Test 1: Health check
echo "1️⃣ Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed"
    echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE"
else
    echo "❌ Health check failed (HTTP $HTTP_CODE)"
    echo "   Make sure the backend server is running: cd backend && npm run dev"
fi
echo ""

# Test 2: Auth routes test endpoint
echo "2️⃣ Testing Auth Routes..."
TEST_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/auth/test")
HTTP_CODE=$(echo "$TEST_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Auth routes are working"
    echo "$TEST_RESPONSE" | grep -v "HTTP_CODE"
else
    echo "❌ Auth routes test failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 3: CORS preflight (OPTIONS)
echo "3️⃣ Testing CORS Preflight (OPTIONS)..."
OPTIONS_RESPONSE=$(curl -s -X OPTIONS -H "Origin: http://localhost" \
    -H "Access-Control-Request-Method: PUT" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -w "\nHTTP_CODE:%{http_code}" \
    "$BASE_URL/api/auth/profile")
HTTP_CODE=$(echo "$OPTIONS_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ CORS preflight successful (HTTP $HTTP_CODE)"
else
    echo "⚠️  CORS preflight returned HTTP $HTTP_CODE (should be 204 or 200)"
fi
echo ""

# Test 4: PUT without auth (should fail with 401)
echo "4️⃣ Testing PUT /api/auth/profile without auth (should fail)..."
PUT_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" \
    -d '{"firstName":"Test"}' \
    -w "\nHTTP_CODE:%{http_code}" \
    "$BASE_URL/api/auth/profile")
HTTP_CODE=$(echo "$PUT_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ PUT endpoint exists and requires authentication (HTTP 401)"
else
    echo "⚠️  Unexpected response (HTTP $HTTP_CODE)"
    echo "$PUT_RESPONSE" | grep -v "HTTP_CODE"
fi
echo ""

echo "======================================"
echo "✅ All endpoint tests completed!"
echo ""
echo "📝 Next Steps:"
echo "   1. If any tests failed, check that the server is running:"
echo "      cd backend && npm run dev"
echo "   2. Make sure MongoDB is running"
echo "   3. Check the server logs for any errors"
echo ""


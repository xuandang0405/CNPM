#!/bin/bash

# Test Backend APIs

echo "Testing Backend Endpoints..."

# Test 1: Health check
echo ""
echo "1. Testing health check..."
curl -X GET http://localhost:25565/api/ping-db

# Test 2: Register
echo ""
echo ""
echo "2. Testing register..."
curl -X POST http://localhost:25565/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "test123",
    "full_name": "Admin User",
    "role": "admin"
  }'

# Test 3: Login
echo ""
echo ""
echo "3. Testing login..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:25565/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "test123"
  }')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Got token: $TOKEN"

# Test 4: Get stats
if [ ! -z "$TOKEN" ]; then
  echo ""
  echo "4. Testing get stats..."
  curl -X GET http://localhost:25565/api/admin/stats \
    -H "Authorization: Bearer $TOKEN"
else
  echo "Could not get token!"
fi

echo ""
echo ""
echo "Testing complete!"

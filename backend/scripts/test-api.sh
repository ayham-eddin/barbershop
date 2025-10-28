#!/usr/bin/env bash

BASE="http://localhost:3000/api"

echo "🔹 Register user (if exists → ignore error)"
curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123"}' \
  | jq .

echo "🔹 Login and extract token"
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}' \
  | jq -r '.token')

echo "🔹 Token:"
echo "$TOKEN"

echo "🔹 Test authorized endpoint (/me)"
curl -s "$BASE/bookings/me" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

echo "🔹 Test admin route (/admin/users)"
curl -s "$BASE/admin/users" \
  -H "Authorization: Bearer $TOKEN" \
  | jq .

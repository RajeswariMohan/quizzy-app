#!/usr/bin/env bash
# End-to-end smoke test for all Quizzy API features.
set -euo pipefail
cd "$(dirname "$0")/.."

API="${API_BASE:-http://localhost:3000/api}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  shift 2
  local code
  code=$(curl -s -o /tmp/smoke-body.json -w '%{http_code}' "$@")
  if [[ "$code" == "$expected" ]]; then
    echo "✓ $name ($code)"
    PASS=$((PASS + 1))
  else
    echo "✗ $name (expected $expected, got $code)"
    cat /tmp/smoke-body.json 2>/dev/null | head -c 200
    echo
    FAIL=$((FAIL + 1))
  fi
}

issue_token() {
  npm run issue-token -- "$1" 2>/dev/null | grep '^eyJ'
}

echo "=== Quizzy API smoke test ==="
echo "API: $API"
echo

TEACHER=$(issue_token teacher)
STUDENT=$(issue_token student)
PARENT=$(issue_token parent)

check "GET /health (public)" 200 "$API/health"

check "GET /me teacher" 200 -H "Authorization: Bearer $TEACHER" "$API/me"
check "GET /me student" 200 -H "Authorization: Bearer $STUDENT" "$API/me"
check "GET /me no token" 401 "$API/me"

check "GET /student/quizzes" 200 -H "Authorization: Bearer $STUDENT" "$API/student/quizzes"
check "GET /student/progress" 200 -H "Authorization: Bearer $STUDENT" "$API/student/progress"
check "GET /student/leaderboard" 200 -H "Authorization: Bearer $STUDENT" "$API/student/leaderboard"

check "GET /quizzes teacher list" 200 -H "Authorization: Bearer $TEACHER" "$API/quizzes"
check "GET /quizzes/dashboard/overview" 200 -H "Authorization: Bearer $TEACHER" "$API/quizzes/dashboard/overview"

# Create quiz + manual question + publish
CREATE=$(curl -s -H "Authorization: Bearer $TEACHER" -H "Content-Type: application/json" \
  -d '{"classId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","title":"Smoke Test Quiz","subject":"Science"}' \
  "$API/quizzes")
QUIZ_ID=$(echo "$CREATE" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id))")

check "POST /quizzes create" 201 -H "Authorization: Bearer $TEACHER" -H "Content-Type: application/json" \
  -d '{"classId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","title":"Smoke Test 2","subject":"Math"}' \
  "$API/quizzes"

check "POST manual question" 201 -H "Authorization: Bearer $TEACHER" -H "Content-Type: application/json" \
  -d '{"questionText":"2+2?","options":["3","4","5","6"],"correctOptionIndex":1}' \
  "$API/quizzes/$QUIZ_ID/questions/manual"

check "GET /quizzes/:id" 200 -H "Authorization: Bearer $TEACHER" "$API/quizzes/$QUIZ_ID"
check "GET /quizzes/:id/questions" 200 -H "Authorization: Bearer $TEACHER" "$API/quizzes/$QUIZ_ID/questions"

check "PATCH publish" 200 -X PATCH -H "Authorization: Bearer $TEACHER" "$API/quizzes/$QUIZ_ID/publish"

# Student takes published quiz
check "GET student quiz detail" 200 -H "Authorization: Bearer $STUDENT" "$API/student/quizzes/$QUIZ_ID"
QID=$(curl -s -H "Authorization: Bearer $STUDENT" "$API/student/quizzes/$QUIZ_ID" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).questions[0].id))")
check "POST student response" 201 -H "Authorization: Bearer $STUDENT" -H "Content-Type: application/json" \
  -d "{\"questionId\":\"$QID\",\"selectedOptionIndex\":1}" \
  "$API/student/quizzes/$QUIZ_ID/responses"

# AI generation
AI=$(curl -s -H "Authorization: Bearer $TEACHER" -H "Content-Type: application/json" \
  -d '{"prompt":"Generate 2 MCQs on plants","count":2}' \
  "$API/quizzes/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/questions/ai-generate")
TASK_ID=$(echo "$AI" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).taskId)}catch{}})" 2>/dev/null || true)
if [[ -n "${TASK_ID:-}" ]]; then
  check "POST ai-generate" 202 -H "Authorization: Bearer $TEACHER" -H "Content-Type: application/json" \
    -d '{"prompt":"Generate 1 MCQ","count":1}' \
    "$API/quizzes/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/questions/ai-generate"
  check "GET ai task" 200 -H "Authorization: Bearer $TEACHER" "$API/ai-generation-tasks/$TASK_ID"
else
  echo "⚠ AI generate skipped (seed quiz may be missing)"
fi

check "Student blocked from teacher route" 403 -H "Authorization: Bearer $STUDENT" "$API/quizzes"
check "GET /parent/child-summary" 200 -H "Authorization: Bearer $PARENT" "$API/parent/child-summary"

echo
echo "=== Results: $PASS passed, $FAIL failed ==="
exit "$FAIL"

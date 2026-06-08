See DAY_5_PLAN.md for detailed roadmap.
ENDFILE

cat > /mnt/c/Users/bhara/Projects/Claude/VibhaDashboard/DAY_5_PLAN.md << 'ENDFILE'
# 📋 Day 5 Plan: Kafka + Page Settings + HTTP Fix

## Hour 1: Fix HTTP POST (30 min) 🔧
- Debug POST response serialization
- Test with curl -v
- Gate: Response returns valid JSON

## Hour 2: Kafka Integration (1.5 hours) ⚙️
- Add rdkafka dependency
- Implement publish_question_to_kafka()
- Gate: cargo test --lib passes

## Hour 3: Page Settings (1 hour) 🗄️
- Add PageSettings type
- Load from DB in QuestionHandler
- Update API endpoint
- Gate: Full end-to-end works

## Hour 4+: Testing & Polish (1-2 hours) ✨
- Integration tests
- Manual testing with curl
- Documentation

## Key Files to Modify
- backend/agents/src/question_handler.rs
- backend/common/src/lib.rs
- backend/api/src/main.rs
- Cargo.toml

## Ready?
Start with: cargo test --lib (verify 6/6 passing)
Then: Hour 1 - Fix HTTP POST
ENDFILE

# Verify
ls -lh /mnt/c/Users/bhara/Projects/Claude/VibhaDashboard/*.md
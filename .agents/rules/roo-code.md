# Roo Code Memory Bank Protocol

To maintain durable context and eliminate context decay across sessions:

1. **Context Check**:
   - Check if a `memory-bank/` directory exists in the project root.
   - If present, read `activeContext.md` and `progress.md` to restore situational awareness before modifying code.

2. **Continuous Synchronization**:
   - Update `memory-bank/activeContext.md` whenever significant progress is made or focus shifts.
   - Record architectural choices in `memory-bank/decisionLog.md` with timestamps.
   - Mark completed deliverables in `memory-bank/progress.md`.

3. **Mode Discipline**:
   - Separate planning/architecture from implementation.
   - Never implement unverified architectural changes without recording them in the memory bank.

# Ralph Loop Autonomous Protocol

When running in an iterative or autonomous execution loop:

1. **State Persistence**: Always read disk state (`git status`, test logs, task checklists) before taking action rather than relying on session memory.
2. **Atomic Steps**: Tackle tasks one item at a time. Never implement multiple complex features in one unverified jump.
3. **Loop Verification**: Run tests after every change. If a test fails, fixing that regression takes priority over continuing to the next task.
4. **Honest Completion**: Only signal task completion when acceptance tests pass cleanly.

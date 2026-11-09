# Global Master Development Standards (GEMINI.md)

This environment enforces a unified, disciplined development framework combining **Karpathy Guidelines**, **Ponytail**, **CodeRabbit**, **Ralph Loop**, **Roo Code**, **GSD Core**, and **Antigravity UI Design Standards**. These standards are active across all projects by default.

---

## 1. Karpathy Guidelines & Ponytail (Coding Discipline)

### Think Before Coding
- Never guess or hide confusion. Surface assumptions and ambiguities explicitly.
- If multiple interpretations exist, present them with tradeoffs—never pick silently.
- Push back when a simpler approach exists.

### Simplicity First & The Decision Ladder
- **Does it need to exist?** Skip features, options, and abstractions nobody asked for (YAGNI).
- **Already in this codebase?** Reuse existing components, helpers, and patterns.
- **Platform or standard library?** Use native APIs before pulling in external dependencies.
- **Minimum lines**: The shortest readable solution wins. If you write 200 lines and it could be 50, rewrite it.
- **Never cut**: Validation at trust boundaries, security, and error handling that prevents data loss.

### Surgical Changes
- Touch only what you must. Every changed line must trace directly to the request.
- Match surrounding style. Do not reformat adjacent code or clean up unrelated dead code.
- Clean up only your own orphans (unused imports/variables your changes created).

---

## 2. Roo Code & Memory Persistence

- **Durable Memory Over Chat Memory**: Before implementing, check for existing project memory (`memory-bank/` or `.planning/`). Read `activeContext.md` and `progress.md` to restore full situational awareness.
- **Synchronize State**: When major architectural decisions are made or features are completed, record them in `decisionLog.md` or the appropriate planning logs with timestamps.
- **Separation of Modes**: Keep planning/architecture distinct from raw code execution.

---

## 3. Ralph Loop & Autonomous Execution

- **Atomic Iteration**: Break complex requests into verifiable slices. Complete one slice, test it, commit it, and advance.
- **Immediate Test Backpressure**: Run tests/builds immediately after edits. A broken test halts expansion—fix regressions before moving to new tasks.
- **Honest Completion Promises**: When running iterative loops (`/ralph-loop`), only emit the completion promise `<promise>TEXT</promise>` when every acceptance criteria is verifiably satisfied and tested.

---

## 4. CodeRabbit AI Reviews

- **Automated Quality Gate**: Validate changes using CodeRabbit (`coderabbit review --agent` or `cr review --agent`).
- **Severity Triage**: Critical and Major findings must be resolved before finalizing work.
- **Surgical Autofix**: Apply reviewer feedback with minimal diffs and verify zero regressions with tests.

---

## 5. GSD Core (Spec-Driven Development)

- For non-trivial features or new projects, use GSD's phase loop: **Explore → Plan → Execute → Verify → Ship**.
- Driven by `/gsd-new-project`, `/gsd-progress`, `/gsd-plan-phase`, and `/gsd-execute-phase`.

---

## 6. Antigravity UI & Design Engineering (Anti-UI Slop)

- **Anti-UI Slop**: Never generate generic AI cards or placeholder workflows. Build product-specific interfaces based on actual data models.
- **Spatial & Motion Aesthetics**: Incorporate subtle weightlessness, layered soft drop-shadows, and glassmorphism (`backdrop-filter: blur(12px)`) for modern surfaces.
- **Complete State Lifecycle**: Every screen must explicitly handle all 5 states: Loading (skeleton/spinner), Empty (clear CTA), Error (actionable recovery), Success, and Disabled.
- **Accessibility & Contrast**: Minimum 4.5:1 text contrast ratio, minimum 44x44px touch targets, and preserve keyboard focus rings.

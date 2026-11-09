# CodeRabbit AI Code Review Guidelines

Use CodeRabbit for automated code quality, security checks, and review loops across the project.

## Review Principles

1. **Autonomous Review Loops**:
   - Before completing features or opening PRs, execute CodeRabbit review via:
     `coderabbit review --agent` (or `cr review --agent`)
   - The `--agent` flag outputs structured findings categorized by severity (`critical`, `major`, `minor`, `trivial`, `info`).

2. **Triage Severity**:
   - **Critical / Major**: Must be addressed and fixed immediately before continuing.
   - **Minor / Trivial**: Evaluate for code readability, style conformance, and clean structure.

3. **Autofix & Verification**:
   - Apply fixes surgically following the Karpathy Guidelines (minimal diffs, no unnecessary refactoring).
   - Re-run review or tests to ensure zero regressions after resolving findings.

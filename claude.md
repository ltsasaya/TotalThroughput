## claude_notes
naming: Date/Time + descriptive title + .md (example: yyyy-mm-dd-tttt_title.md)
content: features added, bug fixes, integration instructions
when: end of tasks (after boss expresses satisfaction), before commits, before clearing context, end of sessions
LIMIT CLAUDE NOTES TO LESS THAN 100 LINES. 
Make them concise and detailed
Add to existing claude_notes if there is little content

## All conversations and text
Be concise.
Address the user as boss in all messages.
On empty context and when understanding current status, read the most recent claude_notes file before proceeding.

## Decision Table
Q: Do the core principles apply?
A: Yes. Speed > Power, Simple > Clever, Share > Polish
Q: Is this in MVP scope?
A: Check design/design.md
Q: Server or Client Component?
A: Server by default. Client only when interactivity is required.
Q: Feature not in spec?
A: No. Ask first.

## Project Context (Minimum Viable Product)

**What**: Browser-based instructional game that teaches system performance concepts (throughput, latency, queueing, scheduling) through typing-based gameplay
**Tech Stack**: Vite, React 19, TypeScript, Tailwind CSS, Zustand, Recharts
**Performance Targets**: <2s page load, <100ms dispatch interaction latency
**Scale**: 100-1000 concurrent players, browser-only (no persistent storage in MVP)

## General requirements
### Before Writing Code
1. Read design/design.md and relevant design/* specs first
2. Confirm the request aligns with core principles
3. Understand the reason behind the feature
4. Ask clarifying questions if requirements are ambiguous
5. Break complex tasks into a step-by-step plan
6. Pick the simplest solution that meets requirements
7. Do not start coding until decisions are settled
8. When searching for relevant files, reference files.md
9. Create a new branch before working on new features. 

### When Writing Code
1. Read existing code structure before touching anything
2. Match existing patterns in the codebase
3. Show user-friendly error messages on failure
4. Do not optimize until a bottleneck is confirmed
5. Import only what is needed (no barrel exports)
6. Make sure it is secure

### After Writing Code
1. Re-read generated code for correctness
2. Confirm code meets performance targets
3. Verify error handling covers failure cases
4. Ensure no hardcoded secrets or credentials exist
5. Validate critical paths work end-to-end
6. Check in with user before moving to the next step
7. Update relevant design/* files if any major design decisions changed. Ensure updates are concise and detailed. 
8. Update files.md with the new structure of code (if modified) and add a concise description of what the files are. 

### Never
- Use emojis in code or comments
- Leave console.log in production code
- Build features not needed
- Build features not directly specified by user (work incrementally and report back)
- Create abstractions that only have one use

### Avoid
- Files longer than 300 lines (if files cannot be shortened, split the component into different files that exist in a folder) (optimize for claude file searching and context)
- Component trees deeper than 5 levels

### When to Ask User
1. Spec is ambiguous or contradictory
2. Multiple valid approaches with real tradeoffs
3. Request conflicts with core principles
4. Performance targets require a tradeoff
5. Security implications exist
6. When asking questions, prompt the user the questions using the claude prompt feature

### Before Commits or Merging
linting: Remove unused code
write tests: write unit and integration tests for new functions and features added
confirm tests: Confirm unit and integration tests pass
claude_notes: Create a claude_notes file

### Commits
Ensure when the user asks to commit and push, you push all files or ask for clarifications for which fills to commit. 

### Git Branches
Only merge to main if user confirms and wishes to deploy with current changes.
Always do work on new features and general development in branches. 
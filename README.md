# prod-readiness-skills

A one-command installer for a set of production-readiness AI agent skills:
architecture review, security audit, code review, cloud infra review, SRE
readiness, and a full launch checklist. Works with Claude Code, Kimi Code
CLI, OpenAI Codex, or any agent that supports the open Agent Skills spec.

## Install into a project (for people using your skills)

No global install needed — just run this from inside their project folder:

```bash
npx github:ranniemp161/prod-readiness-skills
```

It auto-detects your agent's skills directory (`.claude/skills/` for Claude
Code, `.agents/skills/` for the open Agent Skills spec, `.cursor/skills/` for
Cursor). If none exists yet it defaults to `.agents/skills/`. It asks to
confirm before writing.

### Options

```bash
npx prod-readiness-skills --agent claude            # force .claude/skills (Claude Code)
npx prod-readiness-skills --agent agents            # force .agents/skills (open spec)
npx prod-readiness-skills --target path/to/skills   # fully custom location
npx prod-readiness-skills --only prod-security,prod-ai-engineering
npx prod-readiness-skills --yes                     # skip confirmation
npx prod-readiness-skills --force                   # overwrite existing
npx prod-readiness-skills --list                    # show available skills
```

## Publishing this so others can `npx` it

1. Create a free npm account if you don't have one: https://www.npmjs.com/signup
2. From this folder, log in and publish:

```bash
npm login
npm publish
```

   (If the name `prod-readiness-skills` is taken, change `"name"` in
   `package.json` to something scoped, e.g. `@yourusername/prod-skills`,
   and publish with `npm publish --access public`.)

3. From then on, anyone can run:

```bash
npx prod-readiness-skills
```

and it installs straight into their project — no manual copying, no cloning
a repo, no editing files by hand.

## Updating a skill later

Edit the relevant `skills/<name>/SKILL.md`, bump the `version` in
`package.json`, and run `npm publish` again. Users just re-run
`npx prod-readiness-skills --force` to pick up the new version.

## Available skills

| Skill | Purpose |
|-------|---------|
| `prod-architecture` | Evidence-based system design review: scalability, SPOFs, data architecture |
| `prod-security` | Security audit with active recon: injection, authz/IDOR, secrets, supply chain |
| `prod-readiness` | SRE readiness: observability, proven rollback, tested backups, on-call |
| `prod-code-review` | Staff-level code review: correctness, concurrency, failure modes, with patches |
| `prod-cloud-infra` | Cloud/IaC review: exposure, reliability, quantified cost optimization, DR |
| `prod-ai-engineering` | AI/LLM app review: prompt injection, agent tool safety, evals, cost, RAG |
| `prod-launch-checklist` | Orchestrates all applicable reviews into one Go/No-Go launch report |

All skills follow the same senior-engineer methodology: **investigate the repo
first** (never ask for what can be discovered), **cite evidence** (file:line)
for every finding, **calibrate severity** to the project's real scale and
criticality, and **prescribe concrete fixes** (code/config diffs, not advice).

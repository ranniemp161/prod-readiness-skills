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

It will ask to confirm, then drop the skills into `.agents/skills/`.

### Options

```bash
npx prod-readiness-skills --target .agents/skills   # custom location
npx prod-readiness-skills --only prod-security,prod-code-review
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
| `prod-architecture` | Review system design, scalability, SPOFs |
| `prod-security` | Security audit, STRIDE threat model, OWASP |
| `prod-readiness` | SRE readiness: observability, SLOs, on-call |
| `prod-code-review` | Production-grade code review |
| `prod-cloud-infra` | Cloud infrastructure: cost, security, DR |
| `prod-launch-checklist` | Full pre-launch flow (runs all above) |

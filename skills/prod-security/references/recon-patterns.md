# Security Recon Patterns

Concrete search patterns for Phase 0. Run these with your grep/search tool; treat hits as leads to verify, not automatic findings.

## Secret Detection (regex, case-insensitive where sensible)

| What | Pattern |
|------|---------|
| AWS access key | `AKIA[0-9A-Z]{16}` |
| AWS secret key (assignment) | `aws.{0,20}['"][0-9a-zA-Z/+]{40}['"]` |
| Google API key | `AIza[0-9A-Za-z\-_]{35}` |
| GitHub token | `gh[pousr]_[A-Za-z0-9_]{36,}` |
| Slack token | `xox[baprs]-[0-9A-Za-z-]{10,}` |
| Stripe key | `[sr]k_(live|test)_[0-9a-zA-Z]{24,}` |
| OpenAI/Anthropic-style key | `sk-[A-Za-z0-9_\-]{20,}` |
| Private key block | `BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY` |
| Connection string w/ creds | `(postgres|mysql|mongodb(\+srv)?|redis|amqp)://[^\s:@]+:[^\s@]+@` |
| JWT literal | `eyJ[A-Za-z0-9_-]{10,}\.eyJ` |
| Generic assignment | `(password|passwd|secret|api[_-]?key|auth[_-]?token)\s*[:=]\s*['"][^'"]{8,}` |

Also check: `git ls-files | grep -iE '\.env|credentials|\.pem|\.p12|\.pfx'` and, if feasible, `git log --diff-filter=D --name-only` for deleted-but-in-history secret files.

## Injection Leads by Language

**JavaScript/TypeScript**
- SQL: `query(` / `raw(` with template literals: `` query\(`.*\$\{ `` ; `sequelize.literal`, `knex.raw`
- Command: `child_process`, `execSync`, `spawn.*shell:\s*true`, `` exec\(` ``
- XSS: `dangerouslySetInnerHTML`, `innerHTML\s*=`, `v-html`, `insertAdjacentHTML`, `document.write`, handlebars `{{{`
- Prototype pollution: `merge(`, `extend(`, `Object.assign` with user input into config objects
- Eval family: `eval(`, `new Function(`, `vm.runInContext`

**Python**
- SQL: `execute(f"`, `execute(".*%s.*" %`, `.format(` inside execute, `text(` with f-strings (SQLAlchemy)
- Command: `os.system`, `subprocess.*shell=True`, `os.popen`
- Deserialization: `pickle.loads`, `yaml.load(` without `SafeLoader`, `marshal.loads`, `eval(`, `exec(`
- Path: `open(.*request`, `os.path.join(.*request` without normalization
- Templates: `render_template_string` (SSTI), `Markup(`, `| safe`

**Go**
- SQL: `fmt.Sprintf` feeding `db.Query|Exec`
- Command: `exec.Command("sh", "-c"`, `exec.Command("bash"`
- Templates: `text/template` used for HTML (should be `html/template`)

**Java/Kotlin**
- SQL: `createStatement`, `Statement` + string concat; `"SELECT.*" \+`
- Deserialization: `ObjectInputStream`, `XMLDecoder`, Jackson `enableDefaultTyping`
- Command: `Runtime.getRuntime().exec`, `ProcessBuilder` with concatenated input

## AuthZ / IDOR Leads
- List all routes: framework router files, decorators (`@app.route`, `@Get(`, `router.(get|post|put|delete)`), OpenAPI specs.
- For each route with `:id`/`{id}` params, find the DB query it triggers and check the WHERE clause includes an ownership/tenant predicate, not just the ID.
- Grep for middleware bypass smells: `skipAuth`, `public: true`, `allowAnonymous`, `@PermitAll`, routes registered before the auth middleware, path allowlists (`/health`, `/internal`, `/debug`, `/webhook`).
- Mass assignment: `**request.json`, `req.body` spread into ORM `create`/`update`, Rails without strong params, `Model(**data)`.

## SSRF Leads
- `fetch(`/`requests.get(`/`http.Get(` where the URL contains request data.
- Webhook registration endpoints, "import from URL" features, image/link preview generators, PDF renderers.
- Verify blocking of: private ranges (10/8, 172.16/12, 192.168/16, 127/8, ::1), link-local `169.254.169.254` (cloud metadata), and DNS-rebinding (resolve-then-connect gap).

## Config Red Flags
- `DEBUG\s*=\s*True`, `NODE_ENV.*development` in prod configs
- CORS: `Access-Control-Allow-Origin: *` combined with `credentials: true`; origin reflected from request
- Cookies missing `HttpOnly`/`Secure`/`SameSite`; `session.secret` hardcoded
- `verify=False` / `rejectUnauthorized: false` / `InsecureSkipVerify: true` (TLS validation disabled)
- Docker: `USER root` or no USER directive; secrets in `ENV`/`ARG`; `docker-compose` default passwords (`POSTGRES_PASSWORD=postgres`)
- Weak crypto in use for security purposes: `md5|sha1` near `password`, `Math.random`/`random.random` for tokens (need `crypto.randomBytes`/`secrets`)

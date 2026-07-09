#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SKILLS_SRC = path.join(__dirname, '..', 'skills');
const ALL_SKILLS = fs.readdirSync(SKILLS_SRC).filter((name) =>
  fs.statSync(path.join(SKILLS_SRC, name)).isDirectory()
);

function parseArgs(argv) {
  const args = {
    target: '.agents/skills',
    only: null,
    force: false,
    yes: false,
    list: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target' || a === '-t') {
      args.target = argv[++i];
    } else if (a === '--only') {
      args.only = argv[++i].split(',').map((s) => s.trim());
    } else if (a === '--force' || a === '-f') {
      args.force = true;
    } else if (a === '--yes' || a === '-y') {
      args.yes = true;
    } else if (a === '--list' || a === '-l') {
      args.list = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`
prod-skills-install — install production-readiness AI agent skills into your project

Usage:
  npx prod-readiness-skills [options]

Options:
  -t, --target <dir>   Install location (default: .agents/skills)
      --only <a,b,c>   Install only specific skills (comma-separated names)
  -y, --yes            Skip confirmation prompt
  -f, --force          Overwrite existing skill folders
  -l, --list           List available skills and exit
  -h, --help           Show this help

Available skills:
  ${ALL_SKILLS.join('\n  ')}
`);
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim() || 'y'));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.list) {
    console.log('Available skills:\n  ' + ALL_SKILLS.join('\n  '));
    return;
  }

  const toInstall = args.only
    ? ALL_SKILLS.filter((name) => args.only.includes(name))
    : ALL_SKILLS;

  if (args.only) {
    const missing = args.only.filter((name) => !ALL_SKILLS.includes(name));
    if (missing.length) {
      console.error(`Unknown skill(s): ${missing.join(', ')}`);
      console.error(`Available: ${ALL_SKILLS.join(', ')}`);
      process.exit(1);
    }
  }

  const targetDir = path.resolve(process.cwd(), args.target);

  console.log(`This will install ${toInstall.length} skill(s) into:\n  ${targetDir}\n`);
  toInstall.forEach((name) => console.log(`  - ${name}`));
  console.log('');

  if (!args.yes) {
    const ok = await confirm('Proceed? [Y/n] ');
    if (!ok) {
      console.log('Aborted.');
      return;
    }
  }

  let installed = 0;
  let skipped = 0;

  for (const name of toInstall) {
    const src = path.join(SKILLS_SRC, name);
    const dest = path.join(targetDir, name);

    if (fs.existsSync(dest) && !args.force) {
      console.log(`skip   ${name} (already exists, use --force to overwrite)`);
      skipped++;
      continue;
    }

    fs.rmSync(dest, { recursive: true, force: true });
    copyDirSync(src, dest);
    console.log(`✓ installed  ${name}/SKILL.md`);
    installed++;
  }

  console.log(`\nDone. ${installed} installed, ${skipped} skipped.`);
  if (installed > 0) {
    console.log(`\nInvoke a skill in your agent with e.g.:\n  /skill:${toInstall[0]}\n`);
  }
}

main().catch((err) => {
  console.error('Install failed:', err.message);
  process.exit(1);
});

# pkgman — Dependency Management System
### Mini Project | GROUP 1 | IUC Software Development

A **Command Line Interface (CLI)** tool built with Node.js that simulates how package managers like npm and yarn work.
Initialize projects, install dependencies, list them, update them, remove them, and run security audits — all from the terminal with an interactive and colorful interface.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Commands](#commands)
6. [Examples](#examples)
7. [Project Structure](#project-structure)
8. [Docker](#docker)
9. [Notes](#notes)
10. [Members](#members)

---

## Features

- Interactive prompts (Inquirer)
- Colored terminal output (Chalk)
- Formatted package tables (cli-table3)
- Loading spinners (Ora)
- Dependency tree visualization
- Security audit with vulnerability report
- npm and Yarn support
- Docker integration

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| `commander` | ^14 | CLI framework |
| `inquirer` | ^13 | Interactive prompts |
| `chalk` | ^5 | Terminal colors |
| `ora` | ^9 | Loading spinners |
| `cli-table3` | ^0.6 | Formatted tables |
| `boxen` | ^8 | Bordered boxes |
| `semver` | ^7 | Version parsing |

---

## Installation

**Requirements:** Node.js v18+ and npm

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MiniProject.git
cd MiniProject

# 2. Install dependencies
npm install

# 3. Verify it works
node bin/cli.js --help
```

---

## Usage

All commands are run with:

```bash
node bin/cli.js <command> [options]
```

Or using the npm script shorthand:

```bash
npm start -- <command> [options]
```

---

## Commands

### `init` — Initialize a new project
```bash
node bin/cli.js init          # Interactive prompts
node bin/cli.js init --yes    # Skip prompts, use defaults
```

### `install` — Install packages
```bash
node bin/cli.js install express          # Install a package
node bin/cli.js install express lodash   # Install multiple
node bin/cli.js install nodemon -D       # Save as dev dependency
node bin/cli.js install                  # Interactive mode
node bin/cli.js install express --yarn   # Use Yarn
```

### `list` — List installed packages
```bash
node bin/cli.js list            # Table view (all packages)
node bin/cli.js list --prod     # Production dependencies only
node bin/cli.js list --dev      # Dev dependencies only
node bin/cli.js list --tree     # Dependency tree view
node bin/cli.js list --tree --depth 4   # Tree with custom depth
```

### `remove` — Remove packages
```bash
node bin/cli.js remove express        # Remove a package
node bin/cli.js remove express lodash # Remove multiple
node bin/cli.js remove                # Interactive checkbox selection
```

### `update` — Update packages
```bash
node bin/cli.js update            # Check outdated, select to update
node bin/cli.js update express    # Update a specific package
node bin/cli.js update --latest   # Force latest versions
```

### `audit` — Security audit
```bash
node bin/cli.js audit         # Run security audit
node bin/cli.js audit --fix   # Audit and auto-fix vulnerabilities
node bin/cli.js audit --yarn  # Audit using Yarn
```

---

## Examples

```bash
# Initialize a new project
node bin/cli.js init

# Install express and save it
node bin/cli.js install express

# View all packages as a tree
node bin/cli.js list --tree

# Check for security vulnerabilities
node bin/cli.js audit

# Remove a package interactively
node bin/cli.js remove
```

---

## Project Structure

```
MiniProject/
├── bin/
│   └── cli.js              # Entry point — Commander.js setup
├── src/
│   ├── commands/
│   │   ├── init.js         # Project initializer
│   │   ├── install.js      # Package installer
│   │   ├── list.js         # Package lister & tree view
│   │   ├── remove.js       # Package remover
│   │   ├── update.js       # Package updater
│   │   └── audit.js        # Security auditor
│   ├── utils/
│   │   ├── display.js      # Chalk tables, trees, report printer
│   │   ├── loader.js       # Ora spinner helpers
│   │   ├── packageUtils.js # package.json read/write & tree builder
│   │   └── runner.js       # npm/yarn subprocess runner
│   └── index.js            # Module exports
├── Dockerfile
├── .dockerignore
├── .gitignore
└── package.json
```

---

## Docker

Build and run the CLI inside a Docker container:

```bash
# Build the image
npm run docker:build

# Run interactively
npm run docker:run

# Or manually
docker build -t pkgman .
docker run -it --rm -v $(pwd):/workspace pkgman list
```

---

## Notes

- This project is for educational purposes only.
- It is not intended for production use.
- Built with Node.js ES Modules (`"type": "module"`).

---

## Members

| Name |
|---|
| JOKY LEHMANN DIANE EVELYNE LAURE |
| BOUM ELIE JEREMIE |
| KAMGUIA ORLANE KEVINE |
| EYONG CHELSEA |
| TCHANTCHOU FRIDA |
| NGOUANEU JEASON |
| MBONDO MICHEL DANIEL |

---

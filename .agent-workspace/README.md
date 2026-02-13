# Agent Workspace

This directory stores intermediate outputs and execution traces from automated agents.

## Purpose

- Store agent execution logs and traces
- Keep intermediate analysis results
- Preserve decision-making records
- Enable debugging and monitoring

## Contents

- `knowledge-agent/` - Knowledge sync execution traces
- `research-agent/` - Research generation execution traces
- `social-research/` - Social research execution traces

## Important

- ⚠️ These files are **NOT** loaded by the web application
- Used only for observing agent behavior and debugging
- Can be safely deleted if disk space is needed
- Automatically managed by agents (old files may be cleaned up)

## .gitignore

This directory should be added to .gitignore to avoid committing large trace files.

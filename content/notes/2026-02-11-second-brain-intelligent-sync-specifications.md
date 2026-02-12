---
title: Second Brain Intelligent Sync Task Specifications
created: 2026-02-11
updated: 2026-02-11  
summary: "Comprehensive specifications for the Second Brain Intelligent Sync Task including data source analysis, intelligent processing requirements, knowledge base update procedures, system maintenance protocols, and quality assurance standards."
tags: ["second-brain", "cron-jobs", "intelligent-sync", "knowledge-management", "system-maintenance", "automation", "data-processing"]
ai_refined: true
---

# Second Brain Intelligent Sync Task Specifications

## Overview

The Second Brain Intelligent Sync Task is an automated cron job that processes new conversations into structured knowledge entries. This document outlines the complete specifications and requirements for the sync process.

## Data Source Analysis Requirements

- **Source File**: `data/raw-conversations.json` contains all conversations to be processed
- **Tracking Mechanism**: `sync-state.json` tracks the `lastProcessedTimestamp`
- **Processing Logic**: Only conversations with `timestamp > lastProcessedTimestamp` are processed
- **Timestamp Handling**: Never hardcode dates; always read from `sync-state.json`

## Intelligent Processing Standards

### Language Requirements
- **ALL generated content must be in English** (no Chinese mixed content allowed)
- Maintain consistent English-only content throughout the knowledge base

### Content Quality Standards
- Generate comprehensive, well-structured summaries
- Extract relevant topic tags from conversation content
- Prevent duplicate entries by merging related conversations into existing knowledge entries when possible
- Ensure summaries are not truncated in frontend display

### Topic Extraction
- Identify core topics and generate appropriate tags
- Use consistent tagging conventions across the knowledge base
- Avoid tag fragmentation by using standardized terminology

## Knowledge Base Update Procedures

### Knowledge Database (`data/knowledge-db.json`)
The knowledge database follows this structure:
- **Entry ID**: Format as `YYYY-MM-DD-topic-keywords`
- **Title**: Clear, descriptive title in English
- **Summary**: Comprehensive summary in English (not truncated)
- **Tags**: Array of relevant topic tags
- **Related Logs**: Array of conversation IDs and log file references
- **Timestamps**: ISO8601 format for created_at and updated_at
- **Version Control**: Increment version number on updates
- **AI Refined Flag**: Mark entries as `ai_refined: true`

### Frontend Files Generation
- **Notes Directory**: `content/notes/YYYY-MM-DD-title.md` - Knowledge Vault entries
- **Logs Directory**: `content/logs/YYYY-MM-DD-HH-MM-SS.md` - Raw conversation records
- Both directories feed the frontend interface and must maintain proper formatting

### Sync State Management
After successful processing:
- Update `sync-state.json` with new `lastProcessedTimestamp`
- Update `lastProcessedMessageId` with the latest processed conversation ID
- Add processed files to `processedFiles` array

### Knowledge Graph Generation
- Create/update `data/knowledge-graph.json` with nodes and edges
- Ensure proper D3.js compatible format for frontend visualization
- Maintain graph integrity with proper node relationships

## System Maintenance Protocols

### Server Health Monitoring
- **Status Check**: Verify Second Brain server is running
- **Auto-recovery**: Start server automatically if not running (`node server.js`)
- **Accessibility Test**: Verify server responds to HTTP requests on port 8000

### Frontend Validation
- **HTML Rendering**: Test if frontend loads correctly and displays proper content
- **API Functionality**: Confirm all API endpoints return valid JSON responses
- **Content Display**: Verify no truncation or formatting issues in displayed content

### File Integrity Checks
- **JSON Validation**: Ensure all JSON files are valid and parseable
- **Markdown Formatting**: Verify proper frontmatter in all Markdown files
- **Language Consistency**: Confirm all content is in English only
- **Cross-reference Integrity**: Validate conversation references and links

## Quality Assurance Standards

### Content Quality Assurance
- **No Truncation**: Ensure summaries display completely in frontend
- **English Only**: Maintain consistent English language throughout
- **Proper Formatting**: Use correct markdown syntax and structure
- **Consistent Tagging**: Apply standardized tagging system
- **Accurate References**: Maintain proper conversation-to-knowledge mapping

### System Quality Assurance
- **Server Reliability**: Ensure server remains running and accessible
- **Frontend Performance**: Verify complete, non-truncated content display
- **Graph Visualization**: Confirm knowledge graph renders properly with D3.js
- **API Stability**: Test all endpoints for consistent functionality

## Agent Logging Requirements

### Log Directory Management
- Create `agent-logs/` directory if it doesn't exist
- Read the last 3-5 log files before starting to understand recent history
- Always create a new log entry after completion

### Execution Log Format
Each execution log includes:
- **Timestamp and execution type** (Automatic/Manual)
- **Processing summary** (conversations processed, entries created/updated)
- **Data sources information** (file paths, timestamps, counts)
- **Actions performed** (detailed list of operations)
- **System health check results** (server status, accessibility, validation)
- **Issues encountered** (errors, warnings, recovery actions)
- **Next steps** (planned actions for future executions)

## Failure Recovery Procedures

If any step fails during sync:
1. **Document the error** comprehensively in the execution log
2. **Attempt automatic recovery** (restart server, fix permissions, etc.)
3. **Continue with remaining tasks** if possible to maximize progress
4. **Mark failed items** for retry in next execution attempt
5. **Do not update sync state** until successful completion to prevent data loss

## Agent Authority and Autonomy

The sync agent has full authority to:
- Read, write, and modify all files in the Second Brain directory
- Start, stop, and restart the Second Brain server automatically
- Create, update, and delete knowledge entries as needed
- Fix broken files and recover from system errors
- Make autonomous decisions about content organization and processing
- Implement improvements to the sync process based on observed patterns

This specification ensures consistent, reliable, and high-quality knowledge management through automated intelligent synchronization.
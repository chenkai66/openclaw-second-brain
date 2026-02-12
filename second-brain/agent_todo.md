# Second Brain Agent Todo Guide

## Project Structure Overview

```
/home/admin/clawd/second-brain/
├── agent_todo.md                 # This file - agent instructions
├── server.js                    # Main server application
├── server.log                   # Server runtime logs
├── sync-state.json             # Tracks last processed conversation timestamp
├── data/
│   ├── raw-conversations.json  # Source: All conversations to be processed
│   ├── knowledge-db.json       # Target: Structured knowledge entries
│   └── knowledge-graph.json    # Target: Knowledge graph for visualization
├── content/
│   ├── notes/                  # Target: Frontend-readable .md files (Knowledge Vault)
│   └── logs/                   # Target: Frontend-readable .md files (Raw Conversations)
└── agent-logs/                # Agent execution logs (created automatically)
```

## Agent Responsibilities

### 1. **Data Source Analysis**
- Read `data/raw-conversations.json` to get all conversations
- Check `sync-state.json` to find `lastProcessedTimestamp`
- Process only conversations with `timestamp > lastProcessedTimestamp`
- **DO NOT** hardcode dates - always read from `sync-state.json`

### 2. **Intelligent Processing Requirements**
- **Language**: ALL content must be in English (no Chinese mixed content)
- **Content Quality**: Generate comprehensive, well-structured summaries
- **Topic Extraction**: Extract relevant tags from conversation content
- **Duplicate Prevention**: Merge related conversations into existing knowledge entries when possible

### 3. **File Generation Standards**

#### Knowledge Database (`data/knowledge-db.json`)
```json
{
  "entries": [
    {
      "id": "YYYY-MM-DD-topic-keywords",
      "title": "Clear, descriptive title in English",
      "summary": "Comprehensive summary in English (not truncated)",
      "tags": ["tag1", "tag2", "tag3"],
      "related_logs": ["conversation-id-1", "conversation-id-2"],
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp", 
      "version": 1,
      "ai_refined": true
    }
  ],
  "metadata": {
    "last_compression": null,
    "total_entries": 3,
    "version": "1.0",
    "last_updated": "ISO8601 timestamp"
  }
}
```

#### Frontend Notes (`content/notes/YYYY-MM-DD-title.md`)
```markdown
---
title: Clear Title in English
created: YYYY-MM-DD
updated: YYYY-MM-DD  
summary: "Complete summary sentence in English (not truncated)"
tags: ["tag1", "tag2", "tag3"]
ai_refined: true
---

# Full Content Title

Comprehensive content in English with proper formatting, sections, and details.
No Chinese characters allowed.
```

#### Frontend Logs (`content/logs/YYYY-MM-DD-HH-MM-SS.md`)
```markdown
---
date: YYYY-MM-DD-HH-MM-SS
type: daily-log
summary: "Brief summary of conversation topic in English"
topics: ["topic1", "topic2"]
ai_generated: true
---

# YYYY-MM-DD-HH-MM-SS

## Conversation Record

**User**: [Original user message]

**Assistant**: [Original assistant response]

> Additional context or notes about this conversation.
```

### 4. **Post-Processing Requirements**

#### Update Sync State
After successful processing:
- Update `sync-state.json` with new `lastProcessedTimestamp`
- Update `lastProcessedMessageId` with the latest processed conversation ID
- Add processed files to `processedFiles` array

#### Generate Knowledge Graph
- Create/update `data/knowledge-graph.json` with nodes and edges
- Ensure proper D3.js compatible format for frontend visualization

#### System Health Check
**MUST verify these after every sync:**
1. **Server Status**: Check if Second Brain server is running
   - If not running, start it automatically: `node server.js`
   - Verify server responds to HTTP requests on port 8000
2. **Frontend Accessibility**: Test if frontend loads correctly
   - Fetch `/` and verify HTML content
   - Check that API endpoints return valid JSON
3. **File Integrity**: Validate all generated files
   - JSON files are valid and parseable
   - Markdown files have proper frontmatter
   - No mixed Chinese/English content

### 5. **Agent Logging Requirements**

#### Create Agent Log Directory
If `agent-logs/` doesn't exist, create it.

#### Generate Daily Execution Log
Create log file: `agent-logs/YYYY-MM-DD-HH-MM-SS-sync-execution.md`

Log content format:
```markdown
# Second Brain Sync Execution Log
**Timestamp**: YYYY-MM-DD HH:MM:SS
**Execution Type**: Automatic (cron) / Manual

## Summary
- Conversations processed: [X]
- New knowledge entries created: [Y]  
- Updated knowledge entries: [Z]
- Files generated: [list]

## Data Sources
- Raw conversations file: [path] ([size] bytes)
- Last processed timestamp: [timestamp from sync-state.json]
- New conversations found: [count]

## Actions Performed
- [Detailed list of actions taken]

## System Health Check
- Server status: [Running/Started/Failed]
- Frontend accessibility: [Accessible/Unavailable]  
- File validation: [All valid/Errors found]

## Issues Encountered
- [Any errors or warnings]

## Next Steps
- [Planned actions for next execution]
```

#### Log Management
- **Before starting**: Read the last 3-5 log files in `agent-logs/` to understand recent history
- **After completion**: Always create a new log entry
- **Error handling**: If issues occur, document them clearly in the log

### 6. **Failure Recovery**

If any step fails:
1. **Document the error** in the execution log
2. **Attempt recovery** (restart server, fix file permissions, etc.)
3. **Continue with remaining tasks** if possible
4. **Mark failed items** for next execution attempt
5. **Do not update sync state** until successful completion

### 7. **Quality Assurance**

**Content Standards:**
- No truncated summaries in frontend display
- All content in English only
- Proper markdown formatting
- Consistent tagging system
- Accurate conversation references

**System Standards:**
- Server always running and accessible
- Frontend displays complete, non-truncated content
- Knowledge graph renders properly
- All API endpoints functional

### 8. **Agent Authority**

You have full authority to:
- Read, write, and modify all files in this directory
- Start, stop, and restart the Second Brain server
- Create, update, and delete knowledge entries
- Fix broken files and recover from errors
- Make autonomous decisions about content organization
- Implement improvements to the sync process

**Trust Level**: Maximum - You can do everything I can do.

### 9. **Update Instructions**

**After each successful execution:**
1. Update this `agent_todo.md` file if process changes are needed
2. Update `sync-state.json` with latest timestamp
3. Create execution log in `agent-logs/`
4. Verify all changes are working correctly

**Remember**: Always check `agent-logs/` before starting, and always create a log after finishing.
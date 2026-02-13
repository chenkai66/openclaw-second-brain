# Knowledge Agent Skill

Automated knowledge management system that synchronizes conversations into structured notes and maintains knowledge organization.

## Overview

The Knowledge Agent automatically:
- Monitors conversation logs for new content
- Extracts key topics and concepts
- Creates or updates knowledge notes
- Maintains relationships between content
- Tracks synchronization state

## Features

- **Incremental Sync**: Only processes new or updated content
- **Smart Matching**: Uses semantic similarity to find related notes
- **Auto-Organization**: Automatically tags and categorizes content
- **Conflict Resolution**: Handles duplicate and conflicting information
- **State Tracking**: Maintains sync state for reliability

## Configuration

See `config.json` for configuration options:

```json
{
  "sync_interval": "daily",
  "similarity_threshold": 0.75,
  "min_content_length": 100,
  "auto_create_notes": true,
  "max_related_logs": 5
}
```

### Key Settings

- **sync_interval**: How often to run sync (hourly/daily/weekly)
- **similarity_threshold**: Minimum similarity score to link content (0-1)
- **min_content_length**: Minimum characters for content to be processed
- **auto_create_notes**: Automatically create new notes from logs
- **max_related_logs**: Maximum number of logs to link to a note

## Usage

### Manual Execution

```bash
# Run knowledge sync
python3 scripts/knowledge_sync.py

# Dry run (preview changes)
python3 scripts/knowledge_sync.py --dry-run

# Force full sync
python3 scripts/knowledge_sync.py --force
```

### With Claude/Clawdbot

Simply ask:
```
Sync my knowledge base
Update notes from recent conversations
Organize my second brain
```

## How It Works

### 1. Scan Phase
- Reads all conversation logs
- Checks sync state to identify new content
- Extracts topics and key information

### 2. Analysis Phase
- Analyzes content for main topics
- Calculates similarity with existing notes
- Identifies relationships and connections

### 3. Update Phase
- Creates new notes for new topics
- Updates existing notes with new information
- Links related content
- Updates tags and metadata

### 4. State Update
- Records processed content
- Updates timestamps
- Saves sync state

## Workflow Example

```
New Conversation Log
    ↓
Extract Topics: ["React", "Performance", "Hooks"]
    ↓
Find Similar Notes:
  - "React Performance Optimization" (similarity: 0.85)
  - "React Hooks Best Practices" (similarity: 0.78)
    ↓
Update Existing Notes:
  - Add new insights to "React Performance Optimization"
  - Link conversation log to note
  - Update tags: add "hooks", "optimization"
    ↓
Update Sync State:
  - Mark log as processed
  - Record timestamp
```

## Output

The agent generates:
- Updated or new note files in `content/notes/`
- Updated sync state in `.sync-state.json`
- Summary report of changes made

## Integration

Works seamlessly with:
- **Second Brain System**: Maintains knowledge organization
- **Research Agent**: Provides context for research
- **Content Manager**: Updates content database

## Scheduling

### Cron Job (Linux/Mac)

```bash
# Daily at 2 AM
0 2 * * * cd /path/to/openclaw-second-brain && python3 skills/knowledge-agent-skill/scripts/knowledge_sync.py
```

### Task Scheduler (Windows)

Create a scheduled task to run `knowledge_sync.py` daily.

## Monitoring

Check sync status:
```bash
# View last sync
cat .sync-state.json

# View sync logs
tail -f logs/knowledge-agent.log
```

## Troubleshooting

### No New Content Processed

- Check if logs have been added since last sync
- Verify `last_sync_timestamp` in `.sync-state.json`
- Try `--force` flag to reprocess all content

### Similarity Matching Issues

- Adjust `similarity_threshold` in config
- Lower threshold (e.g., 0.6) for more matches
- Higher threshold (e.g., 0.85) for stricter matching

### Performance Issues

- Reduce `max_related_logs` to process fewer relationships
- Increase `min_content_length` to filter short content
- Run sync less frequently

## Best Practices

1. **Regular Sync**: Run daily or after significant conversations
2. **Review Changes**: Periodically review auto-generated notes
3. **Adjust Thresholds**: Fine-tune similarity threshold for your content
4. **Monitor State**: Check sync state file for issues
5. **Backup**: Keep backups of `.sync-state.json`

## Future Enhancements

- [ ] Machine learning for better topic extraction
- [ ] Multi-language support
- [ ] Conflict resolution UI
- [ ] Real-time sync option
- [ ] Integration with external knowledge bases

## Related Skills

- **research-agent-skill**: Automated research generation
- **social-research-skill**: Community discussion research

---

For detailed implementation, see `SKILL.md`.


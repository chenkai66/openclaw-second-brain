---
title: Second Brain Intelligent Sync System and Maintenance Protocol
created: 2026-02-11
updated: 2026-02-11  
summary: "Comprehensive documentation of the Second Brain Intelligent Sync Task execution protocol, including data source analysis requirements, intelligent processing standards, knowledge base update procedures, system maintenance protocols, and quality assurance measures. The system ensures all content is generated in English only, maintains proper file synchronization between backend databases and frontend display files, and includes automated server health monitoring and recovery mechanisms."
tags: ["second-brain", "intelligent-sync", "system-maintenance", "knowledge-management", "automation", "cron-jobs", "quality-assurance"]
ai_refined: true
---

# Second Brain Intelligent Sync System and Maintenance Protocol

## Overview
The Second Brain Intelligent Sync Task is an automated cron job that processes new conversations into structured knowledge entries while maintaining system health and ensuring frontend accessibility. This comprehensive protocol defines the precise execution requirements for intelligent knowledge synthesis and system maintenance.

## Core Requirements

### 1. Data Source Analysis
- Read `data/raw-conversations.json` to extract all conversation records
- Compare against `sync-state.json` to identify unprocessed conversations (timestamp > lastProcessedTimestamp)
- Never hardcode dates - always use dynamic timestamp comparison from sync state
- Ensure conversation capture mechanism is functioning properly

### 2. Intelligent Processing Standards
- **Language Requirement**: ALL generated content must be in English only (no Chinese mixed content)
- **Content Quality**: Generate comprehensive, well-structured summaries without truncation
- **Topic Extraction**: Automatically identify relevant tags from conversation content
- **Duplicate Prevention**: Merge related conversations into existing knowledge entries when appropriate
- **AI Refinement**: All content should be AI-refined for clarity and completeness

### 3. Knowledge Base Update Procedures

#### Backend Database (`data/knowledge-db.json`)
- Maintain structured JSON format with proper metadata
- Include unique ID, descriptive title, comprehensive summary, relevant tags, related logs, timestamps, version tracking, and AI refinement status
- Update metadata with total entry count and last updated timestamp

#### Frontend Synchronization
- Generate `content/notes/YYYY-MM-DD-title.md` files with proper frontmatter
- Create `content/logs/YYYY-MM-DD-HH-MM-SS.md` files for raw conversation records
- Ensure frontend can access both distilled knowledge and original conversation logs

#### State Management
- Update `sync-state.json` with new `lastProcessedTimestamp` and `lastProcessedMessageId`
- Track processed files in `processedFiles` array for audit purposes
- Generate `data/knowledge-graph.json` with D3.js compatible format for visualization

### 4. System Maintenance Protocols

#### Server Health Monitoring
- Verify Second Brain server is running on port 8000
- Automatically start server if not running (`node server.js`)
- Test HTTP accessibility and proper HTML response
- Monitor server.log for runtime issues

#### File Integrity Validation
- Validate JSON files are parseable and properly formatted
- Ensure Markdown files have correct frontmatter structure
- Verify no mixed Chinese/English content exists
- Check file permissions and accessibility

#### Agent Logging Requirements
- Review last 3-5 agent log files before execution for context
- Create detailed execution log in `agent-logs/YYYY-MM-DD-HH-MM-SS-sync-execution.md`
- Document all actions performed, system health status, and any issues encountered
- Maintain comprehensive audit trail for troubleshooting

### 5. Quality Assurance Measures

#### Content Standards
- No truncated summaries in frontend display
- Consistent English-only language policy
- Proper markdown formatting with headers and sections
- Accurate conversation references and topic tagging

#### System Performance
- Server always running and accessible via public network
- Frontend displays complete, non-truncated content
- Knowledge graph renders properly with correct node/edge relationships
- All API endpoints return valid, functional responses

#### Failure Recovery
- Document all errors in execution logs
- Attempt automatic recovery (server restart, file fixes)
- Continue processing remaining tasks when possible
- Do not update sync state until successful completion
- Mark failed items for retry in next execution cycle

## Authority and Autonomy
The intelligent sync agent has maximum authority to:
- Read, write, and modify all files in the Second Brain directory
- Start, stop, and restart the Second Brain server automatically
- Create, update, and delete knowledge entries as needed
- Fix broken files and recover from system errors
- Make autonomous decisions about content organization
- Implement process improvements to enhance sync efficiency

This protocol ensures the Second Brain system maintains high-quality knowledge management while providing reliable, accessible frontend experiences with comprehensive system health monitoring and automated maintenance capabilities.
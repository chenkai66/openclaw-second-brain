# Research Agent Skill

Automated research report generation system that analyzes interest points and creates comprehensive research reports.

## Overview

The Research Agent automatically:
- Analyzes user interests from conversations and notes
- Identifies trending topics and research opportunities
- Generates comprehensive research reports
- Schedules and executes research tasks
- Maintains research quality standards

## Features

- **Interest Analysis**: Identifies topics worth researching
- **Automated Research**: Generates detailed reports automatically
- **Quality Control**: Ensures minimum content standards
- **Scheduling**: Runs on configurable schedule
- **Multi-Source**: Combines web search, community discussions, and analysis

## Configuration

See `config.json` for configuration options:

```json
{
  "execution_time": "weekly",
  "min_interest_score": 7,
  "reports_per_cycle": 2,
  "min_report_length": 2000,
  "search_sources": ["web", "reddit", "twitter"]
}
```

### Key Settings

- **execution_time**: How often to generate reports (daily/weekly/monthly)
- **min_interest_score**: Minimum score (1-10) to trigger research
- **reports_per_cycle**: Number of reports to generate per run
- **min_report_length**: Minimum words per report
- **search_sources**: Data sources to use for research

## Usage

### Manual Execution

```bash
# Generate research reports
python3 scripts/research_generator.py

# Analyze interests only
python3 scripts/research_generator.py --analyze-only

# Generate specific topic
python3 scripts/research_generator.py --topic "AI Agents 2026"
```

### With Claude/Clawdbot

Simply ask:
```
Generate research reports
Research trending topics in my interests
Create a report on [topic]
```

## How It Works

### 1. Interest Analysis Phase

Analyzes content to identify research-worthy topics:

```
Scan Content:
  - Recent conversation logs
  - Existing notes
  - User queries
    ↓
Extract Interest Points:
  - Frequently mentioned topics
  - Questions asked
  - Areas of focus
    ↓
Score Each Topic (1-10):
  - Frequency: How often mentioned
  - Recency: How recent
  - Depth: Level of engagement
  - Novelty: New vs familiar
    ↓
Select Top Topics (score ≥ 7)
```

### 2. Research Execution Phase

For each selected topic:

```
Topic: "AI Coding Assistants"
    ↓
Multi-Source Search:
  - Web search (Google, Bing)
  - Reddit discussions
  - X/Twitter posts
  - Academic sources
    ↓
Content Analysis:
  - Extract key information
  - Identify trends
  - Find examples
  - Gather statistics
    ↓
Report Generation:
  - Executive summary
  - Detailed analysis
  - Use cases
  - Recommendations
  - References
    ↓
Quality Check:
  - Length ≥ 2000 words
  - 30+ sources cited
  - Proper structure
  - Actionable insights
```

### 3. Output Phase

Generates and saves:
- Markdown report in `content/reports/`
- Metadata and tags
- Source citations
- Related content links

## Report Structure

Each report includes:

1. **Executive Summary**: Key findings and insights
2. **Introduction**: Context and scope
3. **Main Analysis**: Detailed research findings
4. **Use Cases**: Practical applications
5. **Trends**: Current and emerging trends
6. **Recommendations**: Actionable advice
7. **Conclusion**: Summary and future outlook
8. **References**: All sources cited

## Interest Scoring Algorithm

Topics are scored based on:

```python
score = (
    frequency_score * 0.3 +      # How often mentioned
    recency_score * 0.25 +       # How recent
    depth_score * 0.25 +         # Level of engagement
    novelty_score * 0.2          # Newness factor
)

# Score ranges:
# 9-10: Urgent research needed
# 7-8:  High interest, schedule research
# 5-6:  Moderate interest, monitor
# 1-4:  Low interest, skip
```

## Example Workflow

```
Week 1: User conversations about "AI Agents"
    ↓
Interest Analysis:
  - "AI Agents" mentioned 15 times
  - Questions asked: 8
  - Recent activity: Last 3 days
  - Interest Score: 8.5
    ↓
Research Scheduled:
  - Topic: "AI Agent Ecosystem 2026"
  - Priority: High
  - Estimated time: 2-3 hours
    ↓
Research Execution:
  - Web search: 50 sources
  - Reddit: 45 discussions
  - Twitter: 78 posts
  - Analysis: Trends, tools, use cases
    ↓
Report Generated:
  - 3,500 words
  - 65 sources cited
  - 8 sections
  - Saved to content/reports/
```

## Quality Standards

Reports must meet:
- **Length**: Minimum 2,000 words
- **Sources**: Minimum 30 citations
- **Structure**: All required sections
- **Depth**: Detailed analysis, not surface-level
- **Actionability**: Practical recommendations
- **Accuracy**: Verified information

## Integration

Works with:
- **Knowledge Agent**: Uses notes for context
- **Social Research Skill**: Gathers community insights
- **Content Manager**: Stores and organizes reports

## Scheduling

### Cron Job (Linux/Mac)

```bash
# Weekly on Sunday at 3 AM
0 3 * * 0 cd /path/to/openclaw-second-brain && python3 skills/research-agent-skill/scripts/research_generator.py
```

### Task Scheduler (Windows)

Create a scheduled task to run `research_generator.py` weekly.

## Monitoring

Check research status:
```bash
# View research queue
cat .research-queue.json

# View generation logs
tail -f logs/research-agent.log

# List recent reports
ls -lt content/reports/
```

## Customization

### Custom Interest Analysis

Edit `config.json` to adjust scoring:

```json
{
  "interest_scoring": {
    "frequency_weight": 0.3,
    "recency_weight": 0.25,
    "depth_weight": 0.25,
    "novelty_weight": 0.2
  }
}
```

### Custom Report Template

Create custom templates in `templates/` directory.

## Troubleshooting

### No Topics Selected

- Lower `min_interest_score` threshold
- Check if enough content exists for analysis
- Verify recent activity in logs and notes

### Reports Too Short

- Increase search depth
- Add more search sources
- Lower quality threshold temporarily

### Too Many Reports

- Increase `min_interest_score`
- Reduce `reports_per_cycle`
- Adjust execution frequency

## Best Practices

1. **Regular Execution**: Run weekly for best results
2. **Review Reports**: Manually review and refine generated reports
3. **Adjust Scoring**: Fine-tune interest scoring for your needs
4. **Monitor Quality**: Check report quality regularly
5. **Update Sources**: Keep search sources current

## Future Enhancements

- [ ] AI-powered writing improvement
- [ ] Multi-language report generation
- [ ] Interactive report builder
- [ ] Collaborative research features
- [ ] Integration with citation managers

## Related Skills

- **knowledge-agent-skill**: Maintains knowledge base
- **social-research-skill**: Community research
- **last30days-skill**: Broader web research

---

For detailed implementation, see `SKILL.md`.


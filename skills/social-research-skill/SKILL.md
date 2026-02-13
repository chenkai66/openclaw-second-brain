---
name: social-research
description: Research trending topics and real community discussions from Reddit and X (Twitter) in the last 30 days, with content creation and topic suggestions
argument-hint: 'AI coding tools, React performance tips, best productivity apps'
allowed-tools: Bash, Read, Write, WebSearch
---

# Social Research: Discover What Communities Are Actually Discussing

Research ANY topic across Reddit and X (Twitter) to surface real discussions, trending topics, and community feedback from the last 30 days. Get actionable insights with content creation and topic suggestions.

## What This Skill Does

- **Parallel Search**: Simultaneously searches Reddit and X for maximum efficiency
- **Real Engagement**: Focuses on posts with actual interactions (upvotes, comments, likes, retweets)
- **Trend Detection**: Identifies rising topics and popular discussions
- **Content Suggestions**: Provides ready-to-use content ideas and topic angles
- **Tool Discovery**: Shows how people actually use specific tools in practice

## Use Cases

1. **Tool Research**: "How are people using Cursor AI?" → Real usage patterns and tips
2. **Trend Spotting**: "What's trending in web development?" → Hot topics and discussions
3. **Content Ideas**: "React performance optimization" → Popular angles and questions
4. **Product Feedback**: "Feedback on Notion AI" → Real user experiences
5. **Competitive Analysis**: "Alternatives to ChatGPT" → What people recommend

## CRITICAL: Parse User Intent

Before starting research, parse the user's input for:

1. **TOPIC**: What they want to research (e.g., "AI coding assistants", "Next.js 14")
2. **RESEARCH TYPE**:
   - **USAGE** - "how to use X", "X tips", "X best practices" → User wants practical usage patterns
   - **TRENDS** - "what's trending", "hot topics", "popular X" → User wants current trends
   - **COMPARISON** - "X vs Y", "alternatives to X", "best X" → User wants comparisons
   - **FEEDBACK** - "X reviews", "thoughts on X", "is X good" → User wants opinions
   - **GENERAL** - anything else → User wants broad understanding

**Store these variables:**
- `TOPIC = [extracted topic]`
- `RESEARCH_TYPE = [USAGE | TRENDS | COMPARISON | FEEDBACK | GENERAL]`
- `TIME_RANGE = last 30 days (default)`

**DISPLAY your parsing to the user:**

```
I'll research "{TOPIC}" across Reddit and X to find real community discussions from the last 30 days.

Parsed intent:
- TOPIC: {TOPIC}
- RESEARCH_TYPE: {RESEARCH_TYPE}
- TIME_RANGE: {TIME_RANGE}

This typically takes 2-5 minutes. Starting parallel search now...
```

## Research Execution

### Step 1: Run Parallel Research

```bash
python3 "${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/skills/social-research-skill}/scripts/social_research.py" "$ARGUMENTS" --days=30 --min-engagement=5 2>&1
```

The script will:
- Search Reddit (via Reddit API or web scraping)
- Search X/Twitter (via API or web scraping)
- Filter for posts with real engagement (upvotes, comments, likes)
- Rank by relevance and engagement
- Deduplicate similar content

### Step 2: Supplement with WebSearch

While the script runs, do WebSearch to supplement:

**For USAGE type:**
- Search: `{TOPIC} tutorial guide 2026`
- Search: `{TOPIC} tips tricks examples`

**For TRENDS type:**
- Search: `{TOPIC} trending 2026`
- Search: `what's new in {TOPIC}`

**For COMPARISON type:**
- Search: `{TOPIC} comparison alternatives`
- Search: `best {TOPIC} 2026`

**For FEEDBACK type:**
- Search: `{TOPIC} review feedback`
- Search: `{TOPIC} pros cons`

## Output Format

### 1. Executive Summary

```markdown
## 🔍 Research Summary: {TOPIC}

**Key Findings:**
- [3-5 bullet points of main insights]

**Trending Topics:**
- [Top 3-5 trending subtopics]

**Community Sentiment:**
- [Overall sentiment: Positive/Mixed/Negative]
- [Key themes in discussions]
```

### 2. Top Discussions

```markdown
## 📊 Top Discussions (by Engagement)

### Reddit
1. **[Post Title]** (r/subreddit)
   - 👍 [upvotes] | 💬 [comments]
   - Key insight: [1-2 sentence summary]
   - Link: [URL]

2. [...]

### X (Twitter)
1. **[Tweet excerpt]** (@username)
   - ❤️ [likes] | 🔄 [retweets] | 💬 [replies]
   - Key insight: [1-2 sentence summary]
   - Link: [URL]

2. [...]
```

### 3. Trending Topics & Themes

```markdown
## 🔥 Trending Topics

1. **[Topic Name]** (mentioned in X posts)
   - What people are saying: [summary]
   - Example discussions: [links]

2. [...]

## 💡 Common Themes

- **[Theme 1]**: [description and frequency]
- **[Theme 2]**: [description and frequency]
- **[Theme 3]**: [description and frequency]
```

### 4. Content Creation Suggestions

```markdown
## ✍️ Content Ideas & Topic Suggestions

Based on community discussions, here are content angles that would resonate:

### Blog Post Ideas
1. **"[Title based on trending question]"**
   - Angle: [approach]
   - Why it works: [reason based on data]
   - Target audience: [who's asking]

2. [...]

### Social Media Posts
1. **Thread idea**: [topic]
   - Hook: [opening line]
   - Key points: [3-5 bullets]
   - CTA: [call to action]

2. [...]

### Video/Tutorial Ideas
1. **"[Title]"**
   - Format: [tutorial/review/comparison]
   - Key sections: [outline]
   - Estimated interest: [based on engagement data]

2. [...]
```

### 5. Tool Usage Patterns (if applicable)

```markdown
## 🛠️ How People Are Using {TOOL}

### Common Use Cases
1. **[Use case]** (mentioned X times)
   - Example: [quote from discussion]
   - Tips shared: [community tips]

2. [...]

### Popular Workflows
- [Workflow 1]: [description]
- [Workflow 2]: [description]

### Pain Points & Solutions
- **Pain point**: [issue]
  - Community solutions: [solutions discussed]
```

### 6. Recommendations

```markdown
## 🎯 Actionable Recommendations

### For Content Creators
- Focus on: [topics with high engagement]
- Avoid: [oversaturated topics]
- Timing: [when to post based on trends]

### For Product Teams
- Feature requests: [top requests from community]
- User feedback: [common feedback themes]
- Competitive insights: [what users compare]

### For Marketers
- Messaging angles: [what resonates]
- Target audiences: [who's discussing]
- Distribution channels: [where discussions happen]
```

## Advanced Features

### Engagement Filtering

The script automatically filters for quality:
- Reddit: Minimum 5 upvotes, 2 comments
- X: Minimum 5 likes or 2 retweets
- Adjustable via `--min-engagement` flag

### Time-based Analysis

Track how discussions evolve:
- Week 1 vs Week 4 comparison
- Trending up vs trending down
- Seasonal patterns

### Sentiment Analysis

Understand community sentiment:
- Positive mentions
- Negative mentions
- Mixed/neutral discussions

## Configuration

### Environment Variables

```bash
# Reddit API (optional, falls back to web scraping)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=your_app_name

# X/Twitter API (optional, falls back to web scraping)
TWITTER_BEARER_TOKEN=your_bearer_token

# OpenAI for analysis (optional)
OPENAI_API_KEY=your_api_key
```

### Script Options

```bash
--days=N              # Days to look back (default: 30)
--min-engagement=N    # Minimum engagement threshold (default: 5)
--max-results=N       # Maximum results per platform (default: 50)
--include-comments    # Include comment analysis
--sentiment           # Enable sentiment analysis
--export=FORMAT       # Export format: json|csv|md (default: md)
```

## Examples

### Example 1: Tool Research

**Input**: "How are people using Cursor AI?"

**Output**:
- 45 Reddit discussions analyzed
- 78 X posts analyzed
- Top use cases: Code completion, debugging, refactoring
- Content ideas: "5 Cursor AI workflows that save hours", "Cursor vs GitHub Copilot"

### Example 2: Trend Spotting

**Input**: "What's trending in React development?"

**Output**:
- Server Components (mentioned 156 times)
- React 19 features (mentioned 89 times)
- Performance optimization (mentioned 67 times)
- Content ideas: "React Server Components explained", "Migrating to React 19"

### Example 3: Product Feedback

**Input**: "Feedback on Notion AI"

**Output**:
- Positive: Fast, helpful for brainstorming (67%)
- Negative: Limited customization, expensive (23%)
- Mixed: Good but needs improvement (10%)
- Content ideas: "Notion AI review after 30 days", "Is Notion AI worth it?"

## Best Practices

1. **Be Specific**: "React performance tips" > "React"
2. **Use Quotes**: "AI coding tools" for exact phrase matching
3. **Combine Keywords**: "Next.js AND performance" for focused results
4. **Check Recency**: Default is 30 days, adjust if needed
5. **Review Engagement**: Higher engagement = more valuable insights

## Limitations

- Rate limits: Respect API rate limits (built-in throttling)
- Data freshness: Up to 24 hours delay for some sources
- Language: Primarily English content
- Access: Some content may require authentication

## Troubleshooting

**No results found:**
- Try broader keywords
- Reduce time range
- Lower engagement threshold

**Too many results:**
- Be more specific
- Increase engagement threshold
- Reduce time range

**API errors:**
- Check API credentials
- Verify rate limits
- Falls back to web scraping automatically

## Output Files

Results are saved to:
- `~/.claude/skills/social-research-skill/output/{timestamp}_{topic}.md`
- JSON export: `{timestamp}_{topic}.json`
- CSV export: `{timestamp}_{topic}.csv`

## Integration with Other Skills

This skill works well with:
- **last30days**: For broader web research
- **content-writer**: To create content from insights
- **trend-analyzer**: For deeper trend analysis

---

**Note**: This skill respects platform terms of service and implements rate limiting. Always review and verify insights before using them.


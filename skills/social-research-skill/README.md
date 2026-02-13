# Social Research Skill

Research trending topics and real community discussions from Reddit and X (Twitter) in the last 30 days, with content creation and topic suggestions.

## Intermediate Outputs

When executing, this skill saves intermediate results to:

```
.agent-workspace/social-research/
```

**Saved content**:
- `execution-YYYY-MM-DD-HH-mm-ss.log` - Execution logs
- `search-results-YYYY-MM-DD-HH-mm-ss.json` - Raw search results from Reddit and X
- `filtered-results-YYYY-MM-DD-HH-mm-ss.json` - After engagement filtering
- `trend-analysis-YYYY-MM-DD-HH-mm-ss.json` - Trend detection results
- `content-suggestions-YYYY-MM-DD-HH-mm-ss.json` - Generated content ideas

⚠️ **Important**: These files in `.agent-workspace/` are **NOT** loaded by the web application. They are only for observing agent behavior and debugging.

## Features

- **Parallel Search**: Simultaneously searches Reddit and X for maximum efficiency
- **Real Engagement**: Focuses on posts with actual interactions (upvotes, comments, likes, retweets)
- **Trend Detection**: Identifies rising topics and popular discussions
- **Content Suggestions**: Provides ready-to-use content ideas and topic angles
- **Sentiment Analysis**: Understands community sentiment and opinions
- **Tool Discovery**: Shows how people actually use specific tools in practice

## Installation

### 1. Install Dependencies

```bash
pip install requests
```

### 2. Set Up API Credentials (Optional)

The skill works without API credentials by falling back to web scraping, but API access provides better results.

#### Reddit API

1. Go to https://www.reddit.com/prefs/apps
2. Create an app (script type)
3. Set environment variables:

```bash
export REDDIT_CLIENT_ID="your_client_id"
export REDDIT_CLIENT_SECRET="your_secret"
export REDDIT_USER_AGENT="social-research-skill/1.0"
```

#### Twitter/X API

1. Apply for Twitter API access at https://developer.twitter.com
2. Get your Bearer Token
3. Set environment variable:

```bash
export TWITTER_BEARER_TOKEN="your_bearer_token"
```

### 3. Install the Skill

Copy the `social-research-skill` directory to your Claude skills folder:

```bash
cp -r social-research-skill ~/.claude/skills/
```

## Usage

### Basic Usage

```
Research "AI coding tools" from the last 30 days
```

### Advanced Usage

```bash
# Custom time range
python3 social_research.py "React performance" --days=60

# Higher engagement threshold
python3 social_research.py "Next.js 14" --min-engagement=10

# Include sentiment analysis
python3 social_research.py "Notion AI" --sentiment

# Export to JSON
python3 social_research.py "productivity apps" --export=json
```

## Use Cases

### 1. Tool Research
**Query**: "How are people using Cursor AI?"

**Output**:
- Real usage patterns and workflows
- Common use cases
- Tips and tricks from the community
- Pain points and solutions

### 2. Trend Spotting
**Query**: "What's trending in web development?"

**Output**:
- Hot topics and discussions
- Rising technologies
- Community sentiment
- Content opportunities

### 3. Content Ideas
**Query**: "React performance optimization"

**Output**:
- Popular angles and questions
- Blog post ideas
- Social media content
- Video tutorial topics

### 4. Product Feedback
**Query**: "Feedback on Notion AI"

**Output**:
- User experiences
- Pros and cons
- Feature requests
- Competitive comparisons

## Output Format

The skill generates comprehensive reports including:

1. **Executive Summary**: Key findings and statistics
2. **Top Discussions**: Highest engagement posts from Reddit and X
3. **Trending Topics**: Most mentioned keywords and themes
4. **Content Suggestions**: Blog posts, social media, videos, newsletters
5. **Sentiment Analysis**: Community sentiment breakdown
6. **Temporal Trends**: What's trending up or down

## Configuration

### Environment Variables

```bash
# Reddit API (optional)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=your_app_name

# Twitter API (optional)
TWITTER_BEARER_TOKEN=your_bearer_token
```

### Script Options

```bash
--days=N              # Days to look back (default: 30)
--min-engagement=N    # Minimum engagement threshold (default: 5)
--max-results=N       # Maximum results per platform (default: 50)
--include-comments    # Include comment analysis
--sentiment           # Enable sentiment analysis
--export=FORMAT       # Export format: json|csv|md (default: md)
--debug               # Enable debug logging
```

## Examples

### Example 1: Tool Research

```bash
python3 social_research.py "Cursor AI usage patterns" --days=30 --sentiment
```

**Output**:
- 45 Reddit discussions analyzed
- 78 X posts analyzed
- Top use cases: Code completion, debugging, refactoring
- Content ideas: "5 Cursor AI workflows", "Cursor vs GitHub Copilot"

### Example 2: Trend Analysis

```bash
python3 social_research.py "React 19 features" --days=14 --min-engagement=10
```

**Output**:
- Server Components trending (156 mentions)
- New hooks discussed (89 mentions)
- Migration guides needed (67 mentions)

### Example 3: Content Planning

```bash
python3 social_research.py "AI video tools" --export=json
```

**Output**:
- JSON file with all data
- 8 blog post ideas
- 6 social media concepts
- 5 video tutorial topics

## Output Files

Results are saved to:
- `~/.claude/skills/social-research-skill/output/{timestamp}_{topic}.md`
- JSON export: `{timestamp}_{topic}.json`
- CSV export: `{timestamp}_{topic}.csv`

## Troubleshooting

### No Results Found

- Try broader keywords
- Reduce time range (`--days=14`)
- Lower engagement threshold (`--min-engagement=3`)

### API Errors

- Check API credentials
- Verify rate limits
- Skill automatically falls back to web scraping

### Rate Limiting

- Built-in throttling (1 second between requests)
- Respects platform rate limits
- Use `--max-results` to limit requests

## Best Practices

1. **Be Specific**: "React performance tips" > "React"
2. **Use Quotes**: "AI coding tools" for exact phrase matching
3. **Combine Keywords**: "Next.js AND performance"
4. **Check Recency**: Default is 30 days, adjust if needed
5. **Review Engagement**: Higher engagement = more valuable insights

## Limitations

- Rate limits: Respects API rate limits
- Data freshness: Up to 24 hours delay
- Language: Primarily English content
- Access: Some content may require authentication

## Integration

Works well with other skills:
- **last30days**: For broader web research
- **content-writer**: To create content from insights
- **trend-analyzer**: For deeper trend analysis

## License

MIT License

## Contributing

Contributions welcome! Please submit issues and pull requests.

## Credits

Inspired by [last30days-skill](https://github.com/mvanhorn/last30days-skill) by mvanhorn.


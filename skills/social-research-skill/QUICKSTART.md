# Social Research Skill - Quick Start Guide

## 🚀 Quick Start

### 1. Basic Usage (No API Keys Required)

```bash
# Research a topic
python3 scripts/social_research.py "AI coding tools" --days=30
```

The skill will automatically fall back to web scraping if API credentials are not available.

### 2. With API Credentials (Recommended)

#### Set up Reddit API:
```bash
export REDDIT_CLIENT_ID="your_client_id"
export REDDIT_CLIENT_SECRET="your_secret"
export REDDIT_USER_AGENT="social-research-skill/1.0"
```

#### Set up Twitter API:
```bash
export TWITTER_BEARER_TOKEN="your_bearer_token"
```

### 3. Use with Claude/Clawdbot

Simply ask:
```
Research "React performance optimization" from the last 30 days
```

Claude will automatically:
1. Parse your intent
2. Run parallel searches on Reddit and X
3. Filter by engagement
4. Analyze trends
5. Generate content suggestions
6. Provide a comprehensive report

## 📊 Example Outputs

### Example 1: Tool Research
**Input**: "Cursor AI usage patterns"

**Output**:
- 45 Reddit discussions
- 78 X posts
- Top use cases identified
- 8 blog post ideas
- 6 social media concepts
- Sentiment: 82% positive

### Example 2: Trend Analysis
**Input**: "What's trending in React development"

**Output**:
- Server Components (156 mentions)
- React 19 features (89 mentions)
- Performance optimization (67 mentions)
- Content ideas for each trend

### Example 3: Product Feedback
**Input**: "Notion AI feedback"

**Output**:
- Positive: 67% (fast, helpful)
- Negative: 23% (expensive, limited)
- Mixed: 10%
- Feature requests identified

## 🎯 Common Use Cases

### Content Creation
```bash
python3 scripts/social_research.py "web development trends" --sentiment
```
Get content ideas based on what's actually being discussed.

### Competitive Analysis
```bash
python3 scripts/social_research.py "Cursor vs GitHub Copilot" --days=14
```
See what people are comparing and why.

### Product Research
```bash
python3 scripts/social_research.py "best productivity apps 2026" --min-engagement=10
```
Find highly-engaged discussions about products.

### Trend Spotting
```bash
python3 scripts/social_research.py "AI agents" --days=7
```
Catch emerging trends early.

## 📁 Output Files

All results are saved to `output/` directory:
- `{timestamp}_{topic}.md` - Full markdown report
- `{timestamp}_{topic}.json` - Raw data (with --export=json)
- `{timestamp}_{topic}.csv` - Spreadsheet format (with --export=csv)

## 🔧 Advanced Options

### Custom Time Range
```bash
--days=60  # Look back 60 days instead of 30
```

### Higher Quality Filter
```bash
--min-engagement=20  # Only posts with 20+ engagement score
```

### More Results
```bash
--max-results=100  # Get up to 100 posts per platform
```

### Enable Sentiment Analysis
```bash
--sentiment  # Analyze positive/negative sentiment
```

### Debug Mode
```bash
--debug  # See detailed logging
```

## 💡 Tips

1. **Be Specific**: "React performance tips" works better than just "React"
2. **Use Quotes**: "AI coding tools" for exact phrase matching
3. **Adjust Time Range**: Recent trends use --days=7, broader research use --days=60
4. **Check Engagement**: Higher engagement = more valuable insights
5. **Export Data**: Use --export=json to analyze data further

## 🐛 Troubleshooting

### No Results Found
- Try broader keywords
- Reduce time range
- Lower engagement threshold

### API Errors
- Check credentials
- Verify rate limits
- Skill automatically falls back to web scraping

### Slow Performance
- Reduce --max-results
- Use --days=14 for shorter time range
- Check internet connection

## 📚 Next Steps

1. Try the examples above
2. Experiment with different topics
3. Adjust parameters for your needs
4. Use content suggestions for your projects
5. Integrate with your workflow

## 🤝 Integration with Clawdbot

This skill is designed to work seamlessly with Clawdbot. Just ask natural language questions:

- "What are people saying about X?"
- "Research Y from the last 30 days"
- "Find trending topics in Z"
- "Give me content ideas for A"

Clawdbot will handle the rest!

---

**Need help?** Check the full README.md or open an issue.


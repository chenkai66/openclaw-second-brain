"""
Output formatter module - Format research results for display
"""

from typing import Dict, List
import csv


def format_summary(data: Dict) -> str:
    """Format executive summary."""
    stats = data.get("stats", {})
    trends = data.get("trends", {})
    sentiment = data.get("sentiment")
    
    output = []
    output.append(f"## 🔍 Research Summary: {data['topic']}\n")
    
    # Stats
    output.append("**Statistics:**")
    output.append(f"- Total posts analyzed: {stats.get('total_posts', 0)}")
    output.append(f"- Reddit posts: {stats.get('reddit_posts', 0)}")
    output.append(f"- X/Twitter posts: {stats.get('twitter_posts', 0)}")
    output.append(f"- Date range: {data['date_range']['days']} days\n")
    
    # Top trending topics
    topics = trends.get("topics", [])[:5]
    if topics:
        output.append("**Top Trending Topics:**")
        for topic in topics:
            output.append(f"- **{topic['keyword']}** ({topic['percentage']}% of discussions)")
        output.append("")
    
    # Sentiment
    if sentiment:
        output.append("**Community Sentiment:**")
        output.append(f"- Positive: {sentiment['positive_pct']}%")
        output.append(f"- Negative: {sentiment['negative_pct']}%")
        output.append(f"- Neutral/Mixed: {sentiment['neutral_pct'] + sentiment['mixed_pct']}%")
        output.append("")
    
    return "\n".join(output)


def format_top_discussions(data: Dict, limit: int = 10) -> str:
    """Format top discussions by engagement."""
    posts = data.get("posts", [])[:limit]
    
    if not posts:
        return "No discussions found.\n"
    
    output = []
    
    # Group by platform
    reddit_posts = [p for p in posts if p.get("platform") == "reddit"]
    twitter_posts = [p for p in posts if p.get("platform") == "twitter"]
    
    if reddit_posts:
        output.append("### Reddit\n")
        for i, post in enumerate(reddit_posts[:5], 1):
            output.append(f"{i}. **{post.get('title', 'Untitled')}** (r/{post.get('subreddit', 'unknown')})")
            output.append(f"   - 👍 {post.get('score', 0)} upvotes | 💬 {post.get('num_comments', 0)} comments")
            output.append(f"   - Engagement score: {post.get('engagement_score', 0)}")
            output.append(f"   - Link: {post.get('url', 'N/A')}")
            output.append("")
    
    if twitter_posts:
        output.append("### X (Twitter)\n")
        for i, post in enumerate(twitter_posts[:5], 1):
            text = post.get('text', '')[:100] + ('...' if len(post.get('text', '')) > 100 else '')
            output.append(f"{i}. **{text}** (@{post.get('author', 'unknown')})")
            output.append(f"   - ❤️ {post.get('likes', 0)} likes | 🔄 {post.get('retweets', 0)} retweets | 💬 {post.get('replies', 0)} replies")
            output.append(f"   - Engagement score: {post.get('engagement_score', 0)}")
            output.append(f"   - Link: {post.get('url', 'N/A')}")
            output.append("")
    
    return "\n".join(output)


def format_content_suggestions(suggestions: Dict) -> str:
    """Format content creation suggestions."""
    output = []
    
    # Blog posts
    blog_posts = suggestions.get("blog_posts", [])
    if blog_posts:
        output.append("### 📝 Blog Post Ideas\n")
        for i, idea in enumerate(blog_posts[:3], 1):
            output.append(f"{i}. **{idea['title']}**")
            output.append(f"   - Angle: {idea['angle']}")
            output.append(f"   - Why it works: {idea['why_it_works']}")
            output.append(f"   - Target audience: {idea['target_audience']}")
            output.append("")
    
    # Social media
    social_posts = suggestions.get("social_posts", [])
    if social_posts:
        output.append("### 📱 Social Media Ideas\n")
        for i, idea in enumerate(social_posts[:3], 1):
            output.append(f"{i}. **{idea['format']}**: {idea['hook']}")
            output.append(f"   - Estimated engagement: {idea['estimated_engagement']}")
            output.append("")
    
    # Videos
    videos = suggestions.get("videos", [])
    if videos:
        output.append("### 🎥 Video/Tutorial Ideas\n")
        for i, idea in enumerate(videos[:3], 1):
            output.append(f"{i}. **{idea['title']}**")
            output.append(f"   - Format: {idea['format']}")
            output.append(f"   - Platform: {idea['target_platform']}")
            output.append("")
    
    return "\n".join(output)


def format_markdown(data: Dict) -> str:
    """Format complete markdown report."""
    output = []
    
    # Header
    output.append(f"# Social Research Report: {data['topic']}\n")
    output.append(f"*Generated: {data['date_range']['start'][:10]} to {data['date_range']['end'][:10]}*\n")
    output.append("---\n")
    
    # Summary
    output.append(format_summary(data))
    output.append("\n---\n")
    
    # Top discussions
    output.append("## 📊 Top Discussions\n")
    output.append(format_top_discussions(data, limit=10))
    output.append("\n---\n")
    
    # Trending topics
    trends = data.get("trends", {})
    topics = trends.get("topics", [])
    if topics:
        output.append("## 🔥 Trending Topics\n")
        for i, topic in enumerate(topics[:10], 1):
            output.append(f"{i}. **{topic['keyword']}** - mentioned {topic['frequency']} times ({topic['percentage']}%)")
        output.append("\n---\n")
    
    # Common themes
    themes = trends.get("themes", [])
    if themes:
        output.append("## 💡 Common Themes\n")
        for i, theme in enumerate(themes[:10], 1):
            output.append(f"{i}. **{theme['theme']}** - {theme['frequency']} mentions")
        output.append("\n---\n")
    
    # Temporal trends
    temporal = trends.get("temporal", {})
    if temporal.get("trending_up"):
        output.append("## 📈 Trending Up\n")
        for item in temporal["trending_up"][:5]:
            output.append(f"- **{item['keyword']}** (+{item['growth']}% growth)")
        output.append("\n---\n")
    
    # Content suggestions
    output.append("## ✍️ Content Creation Suggestions\n")
    output.append(format_content_suggestions(data.get("suggestions", {})))
    output.append("\n---\n")
    
    # Sentiment
    sentiment = data.get("sentiment")
    if sentiment:
        output.append("## 😊 Sentiment Analysis\n")
        output.append(f"- **Positive**: {sentiment['positive_pct']}% ({sentiment['positive']} posts)")
        output.append(f"- **Negative**: {sentiment['negative_pct']}% ({sentiment['negative']} posts)")
        output.append(f"- **Neutral**: {sentiment['neutral_pct']}% ({sentiment['neutral']} posts)")
        output.append(f"- **Mixed**: {sentiment['mixed_pct']}% ({sentiment['mixed']} posts)")
        output.append("\n---\n")
    
    # Errors
    errors = data.get("errors", [])
    if errors:
        output.append("## ⚠️ Notes\n")
        for error in errors:
            output.append(f"- {error}")
        output.append("")
    
    return "\n".join(output)


def export_csv(data: Dict, output_file: str):
    """Export posts to CSV file."""
    posts = data.get("posts", [])
    
    if not posts:
        return
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'platform', 'title', 'text', 'author', 'url',
            'engagement_score', 'created_date'
        ]
        
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        
        for post in posts:
            # Prepare row
            row = {
                'platform': post.get('platform', ''),
                'title': post.get('title', ''),
                'text': post.get('text', ''),
                'author': post.get('author', ''),
                'url': post.get('url', ''),
                'engagement_score': post.get('engagement_score', 0),
                'created_date': post.get('created_date') or post.get('created_at', ''),
            }
            writer.writerow(row)


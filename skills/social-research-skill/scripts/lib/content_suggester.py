"""
Content suggester module - Generate content ideas based on trends
"""

from typing import List, Dict
import random


def generate_blog_post_ideas(posts: List[Dict], trends: Dict, topic: str) -> List[Dict]:
    """Generate blog post ideas based on trending topics."""
    ideas = []
    
    # From trending topics
    for trend_item in trends.get("topics", [])[:5]:
        keyword = trend_item["keyword"]
        frequency = trend_item["frequency"]
        
        # Generate title variations
        titles = [
            f"The Complete Guide to {keyword.title()} in 2026",
            f"Everything You Need to Know About {keyword.title()}",
            f"{keyword.title()}: Best Practices and Common Mistakes",
            f"How to Master {keyword.title()} (Based on Community Insights)",
            f"Top {frequency} Things People Are Saying About {keyword.title()}",
        ]
        
        ideas.append({
            "title": random.choice(titles),
            "angle": f"Comprehensive guide based on {frequency} community discussions",
            "why_it_works": f"High interest ({trend_item['percentage']}% of discussions mention this)",
            "target_audience": "People researching or learning about " + keyword,
            "estimated_length": "2000-3000 words",
            "key_points": [
                f"What is {keyword}",
                f"Why {keyword} matters",
                f"Common use cases",
                f"Best practices from the community",
                f"Tools and resources"
            ]
        })
    
    # From common themes
    for theme_item in trends.get("themes", [])[:3]:
        theme = theme_item["theme"]
        frequency = theme_item["frequency"]
        
        ideas.append({
            "title": f"Understanding {theme.title()}: A Deep Dive",
            "angle": f"Focused analysis of a trending theme ({frequency} mentions)",
            "why_it_works": "Addresses a specific pain point or interest area",
            "target_audience": f"People interested in {theme}",
            "estimated_length": "1500-2000 words",
            "key_points": [
                f"What is {theme}",
                f"Why it's trending",
                f"Real-world examples",
                f"How to apply it",
                f"Future outlook"
            ]
        })
    
    # From temporal trends
    temporal = trends.get("temporal", {})
    for trending_up in temporal.get("trending_up", [])[:2]:
        keyword = trending_up["keyword"]
        growth = trending_up["growth"]
        
        ideas.append({
            "title": f"Why Everyone Is Talking About {keyword.title()} Right Now",
            "angle": f"Timely piece on rapidly growing topic ({growth}% growth)",
            "why_it_works": "Capitalizes on rising interest and search volume",
            "target_audience": "Early adopters and trend followers",
            "estimated_length": "1000-1500 words",
            "key_points": [
                f"What sparked the interest in {keyword}",
                "Key developments and news",
                "What the community is saying",
                "What to expect next",
                "How to get started"
            ]
        })
    
    return ideas[:8]


def generate_social_media_ideas(posts: List[Dict], trends: Dict, topic: str) -> List[Dict]:
    """Generate social media post ideas."""
    ideas = []
    
    # Thread ideas from trending topics
    for trend_item in trends.get("topics", [])[:3]:
        keyword = trend_item["keyword"]
        
        ideas.append({
            "format": "Twitter/X Thread",
            "hook": f"🧵 {keyword.title()}: What you need to know (based on 100+ community discussions)",
            "key_points": [
                f"1/ What is {keyword} and why it matters",
                f"2/ Top 3 use cases people are discussing",
                f"3/ Common mistakes to avoid",
                f"4/ Best resources and tools",
                f"5/ What's next for {keyword}"
            ],
            "cta": "What's your experience with " + keyword + "? Drop a comment 👇",
            "estimated_engagement": "High (trending topic)"
        })
    
    # Quick tips from themes
    for theme_item in trends.get("themes", [])[:2]:
        theme = theme_item["theme"]
        
        ideas.append({
            "format": "LinkedIn Post",
            "hook": f"💡 Quick insight on {theme}",
            "key_points": [
                f"After analyzing {theme_item['frequency']} discussions about {theme}...",
                "Here's what the community agrees on:",
                "• [Key insight 1]",
                "• [Key insight 2]",
                "• [Key insight 3]"
            ],
            "cta": "Agree or disagree? Let me know in the comments.",
            "estimated_engagement": "Medium-High"
        })
    
    # Comparison posts
    if len(trends.get("topics", [])) >= 2:
        topic1 = trends["topics"][0]["keyword"]
        topic2 = trends["topics"][1]["keyword"]
        
        ideas.append({
            "format": "Instagram Carousel / Twitter Thread",
            "hook": f"{topic1.title()} vs {topic2.title()}: Which one should you choose?",
            "key_points": [
                f"Slide 1: The debate",
                f"Slide 2: {topic1.title()} - Pros & Cons",
                f"Slide 3: {topic2.title()} - Pros & Cons",
                f"Slide 4: Use cases for each",
                f"Slide 5: Community verdict"
            ],
            "cta": f"Team {topic1.title()} or Team {topic2.title()}? 👇",
            "estimated_engagement": "Very High (comparison content)"
        })
    
    # Trending hashtags
    hashtags = trends.get("hashtags", [])
    if hashtags:
        top_hashtags = " ".join([h["hashtag"] for h in hashtags[:5]])
        ideas.append({
            "format": "Multi-platform Post",
            "hook": f"🔥 Trending now in {topic}",
            "key_points": [
                "Quick roundup of what's hot:",
                "• [Trend 1]",
                "• [Trend 2]",
                "• [Trend 3]",
                f"Follow these hashtags: {top_hashtags}"
            ],
            "cta": "Which trend are you most excited about?",
            "estimated_engagement": "High (timely content)"
        })
    
    return ideas[:6]


def generate_video_ideas(posts: List[Dict], trends: Dict, topic: str) -> List[Dict]:
    """Generate video/tutorial ideas."""
    ideas = []
    
    # Tutorial from trending topics
    for trend_item in trends.get("topics", [])[:3]:
        keyword = trend_item["keyword"]
        
        ideas.append({
            "title": f"Complete {keyword.title()} Tutorial for Beginners",
            "format": "Long-form tutorial (10-15 minutes)",
            "sections": [
                f"0:00 - Introduction to {keyword}",
                "1:00 - Why this matters",
                "3:00 - Step-by-step walkthrough",
                "8:00 - Common mistakes",
                "10:00 - Pro tips from the community",
                "12:00 - Resources and next steps"
            ],
            "estimated_interest": f"High ({trend_item['percentage']}% of discussions)",
            "target_platform": "YouTube, TikTok (short version)"
        })
    
    # Comparison videos
    if len(trends.get("topics", [])) >= 2:
        topic1 = trends["topics"][0]["keyword"]
        topic2 = trends["topics"][1]["keyword"]
        
        ideas.append({
            "title": f"{topic1.title()} vs {topic2.title()}: Honest Comparison",
            "format": "Comparison video (8-12 minutes)",
            "sections": [
                "0:00 - Introduction",
                f"1:00 - What is {topic1}",
                f"3:00 - What is {topic2}",
                "5:00 - Side-by-side comparison",
                "7:00 - Real-world use cases",
                "9:00 - Which one should you choose?",
                "11:00 - Final verdict"
            ],
            "estimated_interest": "Very High (comparison content)",
            "target_platform": "YouTube"
        })
    
    # Quick tips from themes
    for theme_item in trends.get("themes", [])[:2]:
        theme = theme_item["theme"]
        
        ideas.append({
            "title": f"5 Things You Should Know About {theme.title()}",
            "format": "Short-form video (60-90 seconds)",
            "sections": [
                "Quick intro (5s)",
                "Tip 1 (15s)",
                "Tip 2 (15s)",
                "Tip 3 (15s)",
                "Tip 4 (15s)",
                "Tip 5 (15s)",
                "CTA (10s)"
            ],
            "estimated_interest": f"Medium-High ({theme_item['frequency']} mentions)",
            "target_platform": "TikTok, Instagram Reels, YouTube Shorts"
        })
    
    return ideas[:5]


def generate_newsletter_ideas(posts: List[Dict], trends: Dict, topic: str) -> List[Dict]:
    """Generate newsletter/email content ideas."""
    ideas = []
    
    # Weekly roundup
    ideas.append({
        "title": f"This Week in {topic.title()}: Top Discussions & Trends",
        "format": "Weekly newsletter",
        "sections": [
            "🔥 Trending This Week",
            "💬 Top Community Discussions",
            "🆕 What's New",
            "💡 Quick Tips",
            "📚 Recommended Reading",
            "🎯 Action Items"
        ],
        "estimated_length": "800-1000 words",
        "target_audience": f"{topic} enthusiasts and professionals"
    })
    
    # Deep dive
    if trends.get("topics"):
        top_topic = trends["topics"][0]["keyword"]
        ideas.append({
            "title": f"Deep Dive: {top_topic.title()}",
            "format": "Educational newsletter",
            "sections": [
                f"What is {top_topic}",
                "Why it matters now",
                "How people are using it",
                "Common challenges",
                "Expert tips",
                "Resources to learn more"
            ],
            "estimated_length": "1200-1500 words",
            "target_audience": f"People learning about {top_topic}"
        })
    
    return ideas


def generate(posts: List[Dict], trends: Dict, topic: str) -> Dict:
    """
    Generate all content suggestions.
    
    Returns dictionary with different content types.
    """
    return {
        "blog_posts": generate_blog_post_ideas(posts, trends, topic),
        "social_posts": generate_social_media_ideas(posts, trends, topic),
        "videos": generate_video_ideas(posts, trends, topic),
        "newsletters": generate_newsletter_ideas(posts, trends, topic),
    }


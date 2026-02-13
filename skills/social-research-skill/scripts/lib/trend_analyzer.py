"""
Trend analyzer module - Analyze trends and themes from posts
"""

from typing import List, Dict, Counter
from collections import Counter
import re


def extract_keywords(text: str, min_length: int = 3) -> List[str]:
    """Extract keywords from text."""
    # Remove URLs, mentions, hashtags
    text = re.sub(r'http\S+|www\.\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#\w+', '', text)
    
    # Extract words
    words = re.findall(r'\b[a-zA-Z]{' + str(min_length) + r',}\b', text.lower())
    
    # Common stop words to filter
    stop_words = {
        'the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with',
        'to', 'for', 'of', 'as', 'by', 'an', 'be', 'this', 'that', 'from',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'are', 'was', 'were', 'been', 'being',
        'not', 'no', 'yes', 'all', 'any', 'some', 'more', 'most', 'very',
        'just', 'only', 'also', 'too', 'than', 'then', 'now', 'here', 'there',
        'when', 'where', 'why', 'how', 'what', 'who', 'which', 'their', 'them',
        'they', 'these', 'those', 'such', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'under', 'again', 'further',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
        'each', 'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too',
        'very', 'can', 'will', 'just', 'don', 'should', 'now', 'use', 'using',
        'used', 'get', 'got', 'like', 'know', 'think', 'want', 'need', 'make',
        'see', 'look', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask',
        'feel', 'become', 'leave', 'put'
    }
    
    return [w for w in words if w not in stop_words]


def extract_hashtags(text: str) -> List[str]:
    """Extract hashtags from text."""
    return re.findall(r'#(\w+)', text)


def extract_mentions(text: str) -> List[str]:
    """Extract mentions from text."""
    return re.findall(r'@(\w+)', text)


def find_trending_topics(posts: List[Dict], top_n: int = 10) -> List[Dict]:
    """
    Find trending topics from posts.
    
    Returns list of topics with frequency and example posts.
    """
    keyword_counter = Counter()
    keyword_posts = {}
    
    for post in posts:
        text = ""
        if post.get("platform") == "reddit":
            text = post.get("title", "") + " " + post.get("text", "")
        else:
            text = post.get("text", "")
        
        keywords = extract_keywords(text)
        
        for keyword in keywords:
            keyword_counter[keyword] += 1
            if keyword not in keyword_posts:
                keyword_posts[keyword] = []
            if len(keyword_posts[keyword]) < 3:  # Keep top 3 examples
                keyword_posts[keyword].append(post)
    
    # Get top keywords
    trending = []
    for keyword, count in keyword_counter.most_common(top_n):
        trending.append({
            "keyword": keyword,
            "frequency": count,
            "percentage": round(count / len(posts) * 100, 1),
            "example_posts": keyword_posts[keyword][:3]
        })
    
    return trending


def find_common_themes(posts: List[Dict], min_posts: int = 3) -> List[Dict]:
    """
    Identify common themes across posts.
    
    Returns list of themes with descriptions and related posts.
    """
    # Extract bigrams and trigrams
    phrase_counter = Counter()
    phrase_posts = {}
    
    for post in posts:
        text = ""
        if post.get("platform") == "reddit":
            text = post.get("title", "") + " " + post.get("text", "")
        else:
            text = post.get("text", "")
        
        # Extract phrases (2-3 words)
        words = extract_keywords(text, min_length=4)
        
        # Bigrams
        for i in range(len(words) - 1):
            phrase = f"{words[i]} {words[i+1]}"
            phrase_counter[phrase] += 1
            if phrase not in phrase_posts:
                phrase_posts[phrase] = []
            if len(phrase_posts[phrase]) < 5:
                phrase_posts[phrase].append(post)
        
        # Trigrams
        for i in range(len(words) - 2):
            phrase = f"{words[i]} {words[i+1]} {words[i+2]}"
            phrase_counter[phrase] += 1
            if phrase not in phrase_posts:
                phrase_posts[phrase] = []
            if len(phrase_posts[phrase]) < 5:
                phrase_posts[phrase].append(post)
    
    # Filter themes that appear in multiple posts
    themes = []
    for phrase, count in phrase_counter.most_common(20):
        if count >= min_posts:
            themes.append({
                "theme": phrase,
                "frequency": count,
                "posts": phrase_posts[phrase]
            })
    
    return themes


def analyze_hashtags(posts: List[Dict], top_n: int = 10) -> List[Dict]:
    """Analyze hashtag usage."""
    hashtag_counter = Counter()
    
    for post in posts:
        text = post.get("text", "") or post.get("title", "")
        hashtags = extract_hashtags(text)
        hashtag_counter.update(hashtags)
    
    return [
        {"hashtag": f"#{tag}", "count": count}
        for tag, count in hashtag_counter.most_common(top_n)
    ]


def analyze_temporal_trends(posts: List[Dict]) -> Dict:
    """Analyze how trends change over time."""
    from datetime import datetime
    from collections import defaultdict
    
    # Group posts by week
    weekly_keywords = defaultdict(Counter)
    
    for post in posts:
        date_str = post.get("created_date") or post.get("created_at", "")
        if not date_str:
            continue
        
        try:
            date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            week = date.strftime("%Y-W%U")
            
            text = ""
            if post.get("platform") == "reddit":
                text = post.get("title", "") + " " + post.get("text", "")
            else:
                text = post.get("text", "")
            
            keywords = extract_keywords(text)
            weekly_keywords[week].update(keywords)
        except:
            continue
    
    # Find trending up/down
    weeks = sorted(weekly_keywords.keys())
    if len(weeks) < 2:
        return {"trending_up": [], "trending_down": [], "stable": []}
    
    first_week = weekly_keywords[weeks[0]]
    last_week = weekly_keywords[weeks[-1]]
    
    trending_up = []
    trending_down = []
    
    all_keywords = set(first_week.keys()) | set(last_week.keys())
    
    for keyword in all_keywords:
        first_count = first_week.get(keyword, 0)
        last_count = last_week.get(keyword, 0)
        
        if last_count > first_count * 1.5 and last_count >= 3:
            trending_up.append({
                "keyword": keyword,
                "growth": round((last_count - first_count) / max(first_count, 1) * 100, 1)
            })
        elif first_count > last_count * 1.5 and first_count >= 3:
            trending_down.append({
                "keyword": keyword,
                "decline": round((first_count - last_count) / first_count * 100, 1)
            })
    
    trending_up.sort(key=lambda x: x["growth"], reverse=True)
    trending_down.sort(key=lambda x: x["decline"], reverse=True)
    
    return {
        "trending_up": trending_up[:10],
        "trending_down": trending_down[:10],
        "weeks_analyzed": len(weeks)
    }


def analyze(posts: List[Dict], topic: str) -> Dict:
    """
    Comprehensive trend analysis.
    
    Returns dictionary with all trend data.
    """
    return {
        "topic": topic,
        "total_posts": len(posts),
        "topics": find_trending_topics(posts, top_n=15),
        "themes": find_common_themes(posts, min_posts=3),
        "hashtags": analyze_hashtags(posts, top_n=10),
        "temporal": analyze_temporal_trends(posts),
    }


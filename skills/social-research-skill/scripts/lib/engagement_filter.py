"""
Engagement filter module - Filter posts by engagement metrics
"""

from typing import List, Dict


def calculate_engagement_score(post: Dict, platform: str) -> int:
    """Calculate engagement score for a post."""
    if platform == "reddit":
        score = post.get("score", 0)
        comments = post.get("num_comments", 0)
        # Reddit: upvotes + (comments * 2) to value discussion
        return score + (comments * 2)
    
    elif platform == "twitter":
        likes = post.get("likes", 0)
        retweets = post.get("retweets", 0)
        replies = post.get("replies", 0)
        # Twitter: likes + (retweets * 3) + (replies * 2)
        return likes + (retweets * 3) + (replies * 2)
    
    return 0


def filter_posts(
    posts: List[Dict], min_engagement: int = 5, platform: str = None
) -> List[Dict]:
    """
    Filter posts by minimum engagement threshold.
    
    Args:
        posts: List of posts to filter
        min_engagement: Minimum engagement score
        platform: Platform name (reddit/twitter) or None to auto-detect
    
    Returns:
        Filtered list of posts with engagement scores
    """
    filtered = []
    
    for post in posts:
        detected_platform = platform or post.get("platform", "unknown")
        engagement_score = calculate_engagement_score(post, detected_platform)
        
        if engagement_score >= min_engagement:
            post["engagement_score"] = engagement_score
            filtered.append(post)
    
    # Sort by engagement score (highest first)
    filtered.sort(key=lambda x: x.get("engagement_score", 0), reverse=True)
    
    return filtered


def get_top_posts(posts: List[Dict], limit: int = 10) -> List[Dict]:
    """Get top N posts by engagement."""
    return sorted(
        posts, key=lambda x: x.get("engagement_score", 0), reverse=True
    )[:limit]


def filter_by_date_range(posts: List[Dict], start_date: str, end_date: str) -> List[Dict]:
    """Filter posts by date range."""
    filtered = []
    
    for post in posts:
        post_date = post.get("created_date") or post.get("created_at")
        if post_date and start_date <= post_date <= end_date:
            filtered.append(post)
    
    return filtered


def filter_by_keywords(posts: List[Dict], keywords: List[str], exclude: bool = False) -> List[Dict]:
    """
    Filter posts by keywords.
    
    Args:
        posts: List of posts
        keywords: List of keywords to match
        exclude: If True, exclude posts with keywords; if False, include only posts with keywords
    """
    filtered = []
    keywords_lower = [k.lower() for k in keywords]
    
    for post in posts:
        text = (post.get("title", "") + " " + post.get("text", "")).lower()
        has_keyword = any(keyword in text for keyword in keywords_lower)
        
        if (has_keyword and not exclude) or (not has_keyword and exclude):
            filtered.append(post)
    
    return filtered


"""
Deduplicator module - Remove duplicate and similar posts
"""

from typing import List, Dict, Set
from difflib import SequenceMatcher


def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate similarity ratio between two texts."""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()


def get_post_text(post: Dict) -> str:
    """Extract text content from post."""
    if post.get("platform") == "reddit":
        return (post.get("title", "") + " " + post.get("text", "")).strip()
    else:  # twitter
        return post.get("text", "").strip()


def deduplicate(posts: List[Dict], similarity_threshold: float = 0.85) -> List[Dict]:
    """
    Remove duplicate and highly similar posts.
    
    Args:
        posts: List of posts to deduplicate
        similarity_threshold: Similarity ratio threshold (0-1)
    
    Returns:
        Deduplicated list of posts
    """
    if not posts:
        return []
    
    unique_posts = []
    seen_urls: Set[str] = set()
    seen_texts: List[str] = []
    
    # Sort by engagement score to keep higher quality posts
    sorted_posts = sorted(
        posts, key=lambda x: x.get("engagement_score", 0), reverse=True
    )
    
    for post in sorted_posts:
        # Check URL duplicates
        url = post.get("url", "")
        if url and url in seen_urls:
            continue
        
        # Check text similarity
        post_text = get_post_text(post)
        if not post_text:
            continue
        
        is_duplicate = False
        for seen_text in seen_texts:
            similarity = calculate_similarity(post_text, seen_text)
            if similarity >= similarity_threshold:
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique_posts.append(post)
            if url:
                seen_urls.add(url)
            seen_texts.append(post_text)
    
    return unique_posts


def group_similar_posts(posts: List[Dict], similarity_threshold: float = 0.7) -> List[List[Dict]]:
    """
    Group similar posts together.
    
    Returns:
        List of groups, where each group is a list of similar posts
    """
    if not posts:
        return []
    
    groups = []
    ungrouped = posts.copy()
    
    while ungrouped:
        # Start new group with first ungrouped post
        current_post = ungrouped.pop(0)
        current_group = [current_post]
        current_text = get_post_text(current_post)
        
        # Find similar posts
        remaining = []
        for post in ungrouped:
            post_text = get_post_text(post)
            similarity = calculate_similarity(current_text, post_text)
            
            if similarity >= similarity_threshold:
                current_group.append(post)
            else:
                remaining.append(post)
        
        groups.append(current_group)
        ungrouped = remaining
    
    # Sort groups by total engagement
    groups.sort(
        key=lambda g: sum(p.get("engagement_score", 0) for p in g),
        reverse=True
    )
    
    return groups


def merge_duplicate_info(posts: List[Dict]) -> Dict:
    """
    Merge information from duplicate/similar posts.
    
    Returns a single post with combined metrics and sources.
    """
    if not posts:
        return {}
    
    # Use the post with highest engagement as base
    base_post = max(posts, key=lambda x: x.get("engagement_score", 0))
    merged = base_post.copy()
    
    # Combine engagement metrics
    if merged.get("platform") == "reddit":
        merged["total_score"] = sum(p.get("score", 0) for p in posts)
        merged["total_comments"] = sum(p.get("num_comments", 0) for p in posts)
    else:  # twitter
        merged["total_likes"] = sum(p.get("likes", 0) for p in posts)
        merged["total_retweets"] = sum(p.get("retweets", 0) for p in posts)
        merged["total_replies"] = sum(p.get("replies", 0) for p in posts)
    
    # Add source URLs
    merged["related_urls"] = [p.get("url") for p in posts if p.get("url")]
    merged["duplicate_count"] = len(posts)
    
    return merged


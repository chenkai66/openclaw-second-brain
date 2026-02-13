"""
Sentiment analyzer module - Analyze sentiment of posts
"""

from typing import List, Dict


# Simple sentiment word lists
POSITIVE_WORDS = {
    'good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'best', 'perfect',
    'fantastic', 'wonderful', 'brilliant', 'outstanding', 'superb', 'impressive',
    'helpful', 'useful', 'easy', 'simple', 'fast', 'efficient', 'reliable',
    'recommend', 'recommended', 'better', 'improved', 'improvement', 'success',
    'successful', 'win', 'winning', 'solved', 'works', 'working', 'fixed'
}

NEGATIVE_WORDS = {
    'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor', 'disappointing',
    'disappointed', 'frustrating', 'frustrated', 'annoying', 'annoyed', 'useless',
    'broken', 'bug', 'bugs', 'buggy', 'slow', 'difficult', 'hard', 'complicated',
    'confusing', 'confused', 'problem', 'problems', 'issue', 'issues', 'error',
    'errors', 'fail', 'failed', 'failure', 'crash', 'crashed', 'wrong', 'sucks'
}


def analyze_text_sentiment(text: str) -> Dict:
    """
    Analyze sentiment of a single text.
    
    Returns dict with sentiment label and scores.
    """
    text_lower = text.lower()
    words = text_lower.split()
    
    positive_count = sum(1 for word in words if word in POSITIVE_WORDS)
    negative_count = sum(1 for word in words if word in NEGATIVE_WORDS)
    
    total_sentiment_words = positive_count + negative_count
    
    if total_sentiment_words == 0:
        return {
            "sentiment": "neutral",
            "positive_score": 0,
            "negative_score": 0,
            "confidence": 0
        }
    
    positive_ratio = positive_count / total_sentiment_words
    negative_ratio = negative_count / total_sentiment_words
    
    # Determine sentiment
    if positive_count > negative_count * 1.5:
        sentiment = "positive"
        confidence = positive_ratio
    elif negative_count > positive_count * 1.5:
        sentiment = "negative"
        confidence = negative_ratio
    else:
        sentiment = "mixed"
        confidence = 0.5
    
    return {
        "sentiment": sentiment,
        "positive_score": positive_count,
        "negative_score": negative_count,
        "confidence": round(confidence, 2)
    }


def analyze(posts: List[Dict]) -> Dict:
    """
    Analyze sentiment across all posts.
    
    Returns aggregated sentiment data.
    """
    if not posts:
        return {
            "total_posts": 0,
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "mixed": 0,
            "positive_pct": 0,
            "negative_pct": 0,
            "neutral_pct": 0,
            "mixed_pct": 0,
            "positive_posts": [],
            "negative_posts": [],
        }
    
    sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0, "mixed": 0}
    positive_posts = []
    negative_posts = []
    
    for post in posts:
        # Get text
        if post.get("platform") == "reddit":
            text = post.get("title", "") + " " + post.get("text", "")
        else:
            text = post.get("text", "")
        
        # Analyze
        sentiment_data = analyze_text_sentiment(text)
        sentiment = sentiment_data["sentiment"]
        
        # Update counts
        sentiment_counts[sentiment] += 1
        
        # Store examples
        post_with_sentiment = post.copy()
        post_with_sentiment["sentiment_data"] = sentiment_data
        
        if sentiment == "positive" and len(positive_posts) < 10:
            positive_posts.append(post_with_sentiment)
        elif sentiment == "negative" and len(negative_posts) < 10:
            negative_posts.append(post_with_sentiment)
    
    total = len(posts)
    
    return {
        "total_posts": total,
        "positive": sentiment_counts["positive"],
        "negative": sentiment_counts["negative"],
        "neutral": sentiment_counts["neutral"],
        "mixed": sentiment_counts["mixed"],
        "positive_pct": round(sentiment_counts["positive"] / total * 100, 1),
        "negative_pct": round(sentiment_counts["negative"] / total * 100, 1),
        "neutral_pct": round(sentiment_counts["neutral"] / total * 100, 1),
        "mixed_pct": round(sentiment_counts["mixed"] / total * 100, 1),
        "positive_posts": positive_posts,
        "negative_posts": negative_posts,
    }


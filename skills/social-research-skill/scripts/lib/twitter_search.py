"""
Twitter/X search module - Search X for discussions
"""

import os
import time
from datetime import datetime
from typing import List, Dict, Optional
import requests


def get_twitter_credentials() -> Optional[str]:
    """Get Twitter API bearer token from environment."""
    return os.getenv("TWITTER_BEARER_TOKEN")


def search_via_api(
    query: str, start_date: datetime, end_date: datetime, limit: int, bearer_token: str
) -> List[Dict]:
    """Search Twitter using official API v2."""
    headers = {"Authorization": f"Bearer {bearer_token}"}
    
    # Format dates for Twitter API
    start_time = start_date.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_time = end_date.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    params = {
        "query": f"{query} -is:retweet lang:en",
        "start_time": start_time,
        "end_time": end_time,
        "max_results": min(100, limit),
        "tweet.fields": "created_at,public_metrics,author_id,conversation_id",
        "expansions": "author_id",
        "user.fields": "username,name",
    }
    
    results = []
    next_token = None
    
    while len(results) < limit:
        if next_token:
            params["pagination_token"] = next_token
        
        try:
            response = requests.get(
                "https://api.twitter.com/2/tweets/search/recent",
                headers=headers,
                params=params,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            
            tweets = data.get("data", [])
            users = {u["id"]: u for u in data.get("includes", {}).get("users", [])}
            
            if not tweets:
                break
            
            for tweet in tweets:
                author_id = tweet.get("author_id")
                author = users.get(author_id, {})
                metrics = tweet.get("public_metrics", {})
                
                results.append({
                    "id": tweet.get("id"),
                    "text": tweet.get("text"),
                    "author": author.get("username"),
                    "author_name": author.get("name"),
                    "url": f"https://twitter.com/{author.get('username')}/status/{tweet.get('id')}",
                    "likes": metrics.get("like_count", 0),
                    "retweets": metrics.get("retweet_count", 0),
                    "replies": metrics.get("reply_count", 0),
                    "created_at": tweet.get("created_at"),
                    "platform": "twitter",
                })
            
            next_token = data.get("meta", {}).get("next_token")
            if not next_token:
                break
            
            # Rate limiting
            time.sleep(1)
            
        except Exception as e:
            print(f"Twitter API error: {e}")
            break
    
    return results[:limit]


def search_via_nitter(
    query: str, start_date: datetime, end_date: datetime, limit: int
) -> List[Dict]:
    """
    Search Twitter using Nitter instances (fallback).
    Note: This is a simplified implementation. Real implementation would
    need to handle Nitter HTML parsing or use a library.
    """
    # This is a placeholder - actual implementation would scrape Nitter
    # For now, return empty list and suggest using API
    print("Twitter API credentials not found. Please set TWITTER_BEARER_TOKEN.")
    print("Alternatively, you can use WebSearch to supplement Twitter data.")
    return []


def search(
    query: str, start_date: datetime, end_date: datetime, limit: int = 50
) -> List[Dict]:
    """
    Search Twitter/X for discussions.
    
    Tries official API first, falls back to alternative methods if needed.
    """
    bearer_token = get_twitter_credentials()
    
    if bearer_token:
        print("Using Twitter official API...")
        return search_via_api(query, start_date, end_date, limit, bearer_token)
    
    print("Twitter API credentials not available...")
    return search_via_nitter(query, start_date, end_date, limit)


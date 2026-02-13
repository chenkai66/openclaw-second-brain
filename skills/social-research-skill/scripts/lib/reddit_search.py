"""
Reddit search module - Search Reddit for discussions
"""

import os
import time
from datetime import datetime
from typing import List, Dict, Optional
import requests


def get_reddit_credentials() -> Optional[Dict[str, str]]:
    """Get Reddit API credentials from environment."""
    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "social-research-skill/1.0")
    
    if client_id and client_secret:
        return {
            "client_id": client_id,
            "client_secret": client_secret,
            "user_agent": user_agent,
        }
    return None


def get_access_token(credentials: Dict[str, str]) -> Optional[str]:
    """Get Reddit OAuth access token."""
    auth = requests.auth.HTTPBasicAuth(
        credentials["client_id"], credentials["client_secret"]
    )
    
    data = {"grant_type": "client_credentials"}
    headers = {"User-Agent": credentials["user_agent"]}
    
    try:
        response = requests.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=auth,
            data=data,
            headers=headers,
            timeout=10,
        )
        response.raise_for_status()
        return response.json()["access_token"]
    except Exception as e:
        print(f"Failed to get Reddit access token: {e}")
        return None


def search_via_api(
    query: str,
    start_date: datetime,
    end_date: datetime,
    limit: int,
    credentials: Dict[str, str],
) -> List[Dict]:
    """Search Reddit using official API."""
    access_token = get_access_token(credentials)
    if not access_token:
        return []
    
    headers = {
        "Authorization": f"bearer {access_token}",
        "User-Agent": credentials["user_agent"],
    }
    
    results = []
    after = None
    
    # Convert dates to timestamps
    start_ts = int(start_date.timestamp())
    end_ts = int(end_date.timestamp())
    
    while len(results) < limit:
        params = {
            "q": query,
            "sort": "relevance",
            "t": "month",  # Last month
            "limit": min(100, limit - len(results)),
        }
        
        if after:
            params["after"] = after
        
        try:
            response = requests.get(
                "https://oauth.reddit.com/search",
                headers=headers,
                params=params,
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            
            posts = data.get("data", {}).get("children", [])
            if not posts:
                break
            
            for post in posts:
                post_data = post.get("data", {})
                created_utc = post_data.get("created_utc", 0)
                
                # Filter by date range
                if start_ts <= created_utc <= end_ts:
                    results.append({
                        "id": post_data.get("id"),
                        "title": post_data.get("title"),
                        "text": post_data.get("selftext", ""),
                        "author": post_data.get("author"),
                        "subreddit": post_data.get("subreddit"),
                        "url": f"https://reddit.com{post_data.get('permalink')}",
                        "score": post_data.get("score", 0),
                        "num_comments": post_data.get("num_comments", 0),
                        "created_utc": created_utc,
                        "created_date": datetime.fromtimestamp(created_utc).isoformat(),
                        "platform": "reddit",
                    })
            
            after = data.get("data", {}).get("after")
            if not after:
                break
            
            # Rate limiting
            time.sleep(1)
            
        except Exception as e:
            print(f"Reddit API error: {e}")
            break
    
    return results[:limit]


def search_via_pushshift(
    query: str, start_date: datetime, end_date: datetime, limit: int
) -> List[Dict]:
    """Search Reddit using Pushshift API (fallback)."""
    base_url = "https://api.pushshift.io/reddit/search/submission"
    
    params = {
        "q": query,
        "after": int(start_date.timestamp()),
        "before": int(end_date.timestamp()),
        "size": min(100, limit),
        "sort": "desc",
        "sort_type": "score",
    }
    
    results = []
    
    try:
        response = requests.get(base_url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        for post in data.get("data", []):
            results.append({
                "id": post.get("id"),
                "title": post.get("title"),
                "text": post.get("selftext", ""),
                "author": post.get("author"),
                "subreddit": post.get("subreddit"),
                "url": f"https://reddit.com/r/{post.get('subreddit')}/comments/{post.get('id')}",
                "score": post.get("score", 0),
                "num_comments": post.get("num_comments", 0),
                "created_utc": post.get("created_utc", 0),
                "created_date": datetime.fromtimestamp(post.get("created_utc", 0)).isoformat(),
                "platform": "reddit",
            })
        
    except Exception as e:
        print(f"Pushshift API error: {e}")
    
    return results[:limit]


def search(
    query: str, start_date: datetime, end_date: datetime, limit: int = 50
) -> List[Dict]:
    """
    Search Reddit for discussions.
    
    Tries official API first, falls back to Pushshift if needed.
    """
    credentials = get_reddit_credentials()
    
    if credentials:
        print("Using Reddit official API...")
        results = search_via_api(query, start_date, end_date, limit, credentials)
        if results:
            return results
    
    print("Falling back to Pushshift API...")
    return search_via_pushshift(query, start_date, end_date, limit)


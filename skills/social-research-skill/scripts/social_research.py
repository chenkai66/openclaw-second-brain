#!/usr/bin/env python3
"""
social_research.py - Research trending topics from Reddit and X (Twitter)

Usage:
    python3 social_research.py <topic> [options]

Options:
    --days=N              Days to look back (default: 30)
    --min-engagement=N    Minimum engagement threshold (default: 5)
    --max-results=N       Maximum results per platform (default: 50)
    --include-comments    Include comment analysis
    --sentiment           Enable sentiment analysis
    --export=FORMAT       Export format: json|csv|md (default: md)
    --debug               Enable debug logging
"""

import argparse
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

# Add lib to path
SCRIPT_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(SCRIPT_DIR))

from lib import (
    reddit_search,
    twitter_search,
    engagement_filter,
    deduplicator,
    trend_analyzer,
    content_suggester,
    sentiment_analyzer,
    output_formatter,
)


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Research trending topics from Reddit and X"
    )
    parser.add_argument("topic", help="Topic to research")
    parser.add_argument(
        "--days", type=int, default=30, help="Days to look back (default: 30)"
    )
    parser.add_argument(
        "--min-engagement",
        type=int,
        default=5,
        help="Minimum engagement threshold (default: 5)",
    )
    parser.add_argument(
        "--max-results",
        type=int,
        default=50,
        help="Maximum results per platform (default: 50)",
    )
    parser.add_argument(
        "--include-comments",
        action="store_true",
        help="Include comment analysis",
    )
    parser.add_argument(
        "--sentiment", action="store_true", help="Enable sentiment analysis"
    )
    parser.add_argument(
        "--export",
        choices=["json", "csv", "md"],
        default="md",
        help="Export format (default: md)",
    )
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")

    return parser.parse_args()


def calculate_date_range(days: int) -> tuple:
    """Calculate start and end dates for search."""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    return start_date, end_date


def search_reddit(
    topic: str, start_date: datetime, end_date: datetime, max_results: int, debug: bool
) -> Dict:
    """Search Reddit for topic discussions."""
    if debug:
        print(f"[DEBUG] Searching Reddit for: {topic}")

    try:
        results = reddit_search.search(
            query=topic,
            start_date=start_date,
            end_date=end_date,
            limit=max_results,
        )

        if debug:
            print(f"[DEBUG] Found {len(results)} Reddit posts")

        return {"platform": "reddit", "results": results, "error": None}

    except Exception as e:
        if debug:
            print(f"[DEBUG] Reddit search error: {e}")
        return {"platform": "reddit", "results": [], "error": str(e)}


def search_twitter(
    topic: str, start_date: datetime, end_date: datetime, max_results: int, debug: bool
) -> Dict:
    """Search X/Twitter for topic discussions."""
    if debug:
        print(f"[DEBUG] Searching X/Twitter for: {topic}")

    try:
        results = twitter_search.search(
            query=topic,
            start_date=start_date,
            end_date=end_date,
            limit=max_results,
        )

        if debug:
            print(f"[DEBUG] Found {len(results)} X posts")

        return {"platform": "twitter", "results": results, "error": None}

    except Exception as e:
        if debug:
            print(f"[DEBUG] X search error: {e}")
        return {"platform": "twitter", "results": [], "error": str(e)}


def main():
    """Main execution function."""
    args = parse_args()

    # Print header
    print(f"\n{'='*60}")
    print(f"Social Research: {args.topic}")
    print(f"{'='*60}\n")

    # Calculate date range
    start_date, end_date = calculate_date_range(args.days)
    print(f"📅 Time range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"🔍 Minimum engagement: {args.min_engagement}")
    print(f"📊 Max results per platform: {args.max_results}\n")

    # Parallel search
    print("🚀 Starting parallel search...\n")

    all_results = {"reddit": [], "twitter": []}
    errors = []

    with ThreadPoolExecutor(max_workers=2) as executor:
        # Submit both searches
        reddit_future = executor.submit(
            search_reddit, args.topic, start_date, end_date, args.max_results, args.debug
        )
        twitter_future = executor.submit(
            search_twitter, args.topic, start_date, end_date, args.max_results, args.debug
        )

        # Collect results
        for future in as_completed([reddit_future, twitter_future]):
            result = future.result()
            platform = result["platform"]
            
            if result["error"]:
                errors.append(f"{platform.title()}: {result['error']}")
                print(f"⚠️  {platform.title()} search failed: {result['error']}")
            else:
                all_results[platform] = result["results"]
                print(f"✅ {platform.title()}: Found {len(result['results'])} posts")

    print()

    # Filter by engagement
    print(f"🔎 Filtering by engagement (min: {args.min_engagement})...")
    
    filtered_reddit = engagement_filter.filter_posts(
        all_results["reddit"], min_engagement=args.min_engagement, platform="reddit"
    )
    filtered_twitter = engagement_filter.filter_posts(
        all_results["twitter"], min_engagement=args.min_engagement, platform="twitter"
    )

    print(f"   Reddit: {len(filtered_reddit)} posts after filtering")
    print(f"   Twitter: {len(filtered_twitter)} posts after filtering\n")

    # Deduplicate
    print("🔄 Removing duplicates...")
    all_posts = filtered_reddit + filtered_twitter
    unique_posts = deduplicator.deduplicate(all_posts)
    print(f"   {len(unique_posts)} unique posts\n")

    # Analyze trends
    print("📈 Analyzing trends...")
    trends = trend_analyzer.analyze(unique_posts, args.topic)
    print(f"   Found {len(trends['topics'])} trending topics")
    print(f"   Identified {len(trends['themes'])} common themes\n")

    # Generate content suggestions
    print("💡 Generating content suggestions...")
    suggestions = content_suggester.generate(unique_posts, trends, args.topic)
    print(f"   {len(suggestions['blog_posts'])} blog post ideas")
    print(f"   {len(suggestions['social_posts'])} social media ideas")
    print(f"   {len(suggestions['videos'])} video ideas\n")

    # Sentiment analysis (optional)
    sentiment_data = None
    if args.sentiment:
        print("😊 Analyzing sentiment...")
        sentiment_data = sentiment_analyzer.analyze(unique_posts)
        print(f"   Positive: {sentiment_data['positive_pct']:.1f}%")
        print(f"   Negative: {sentiment_data['negative_pct']:.1f}%")
        print(f"   Neutral: {sentiment_data['neutral_pct']:.1f}%\n")

    # Format output
    print("📝 Formatting output...\n")
    
    output_data = {
        "topic": args.topic,
        "date_range": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "days": args.days,
        },
        "stats": {
            "total_posts": len(unique_posts),
            "reddit_posts": len(filtered_reddit),
            "twitter_posts": len(filtered_twitter),
        },
        "posts": unique_posts,
        "trends": trends,
        "suggestions": suggestions,
        "sentiment": sentiment_data,
        "errors": errors,
    }

    # Export based on format
    output_dir = SCRIPT_DIR.parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_topic = "".join(c if c.isalnum() else "_" for c in args.topic)
    base_filename = f"{timestamp}_{safe_topic}"

    if args.export == "json":
        output_file = output_dir / f"{base_filename}.json"
        with open(output_file, "w") as f:
            json.dump(output_data, f, indent=2, default=str)
        print(f"💾 Saved JSON: {output_file}")

    elif args.export == "csv":
        output_file = output_dir / f"{base_filename}.csv"
        output_formatter.export_csv(output_data, output_file)
        print(f"💾 Saved CSV: {output_file}")

    else:  # markdown
        output_file = output_dir / f"{base_filename}.md"
        markdown = output_formatter.format_markdown(output_data)
        with open(output_file, "w") as f:
            f.write(markdown)
        print(f"💾 Saved Markdown: {output_file}")

    # Print summary to stdout
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}\n")
    
    summary = output_formatter.format_summary(output_data)
    print(summary)

    # Print top discussions
    print(f"\n{'='*60}")
    print("TOP DISCUSSIONS")
    print(f"{'='*60}\n")
    
    top_discussions = output_formatter.format_top_discussions(output_data, limit=5)
    print(top_discussions)

    # Print content suggestions
    print(f"\n{'='*60}")
    print("CONTENT SUGGESTIONS")
    print(f"{'='*60}\n")
    
    content_ideas = output_formatter.format_content_suggestions(suggestions)
    print(content_ideas)

    print(f"\n✨ Research complete! Full report saved to: {output_file}\n")

    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Research interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        if "--debug" in sys.argv:
            import traceback
            traceback.print_exc()
        sys.exit(1)


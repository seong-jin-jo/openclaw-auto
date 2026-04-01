#!/usr/bin/env python3
"""Threads 콘텐츠 대시보드 — Flask 백엔드
데이터: queue.json, growth.json, popular-posts.txt, style-data.json 직접 읽기/쓰기
"""
import fcntl
import json
import logging
import os
import re
import secrets
from datetime import datetime, timezone, timedelta
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, abort

app = Flask(__name__, static_folder="static", static_url_path="")

# ── 로깅 설정 ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── 경로 설정 ──
DATA_DIR = Path(os.environ.get("DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
QUEUE_PATH = Path(os.environ.get("THREADS_QUEUE_PATH", DATA_DIR / "queue.json"))
STYLE_PATH = Path(os.environ.get("THREADS_STYLE_PATH", DATA_DIR / "style-data.json"))
GROWTH_PATH = DATA_DIR / "growth.json"
POPULAR_PATH = DATA_DIR / "popular-posts.txt"
KEYWORDS_PATH = DATA_DIR / "search-keywords.txt"
SETTINGS_PATH = DATA_DIR / "settings.json"
CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", Path(__file__).resolve().parent.parent / "config"))
CRON_JOBS_PATH = CONFIG_DIR / "cron" / "jobs.json"
CHANNEL_SETTINGS_PATH = Path(DATA_DIR) / "channel-settings.json"

AUTOMATION_FEATURES = [
    {"key": "content_generation",    "label": "Content Generation",    "description": "콘텐츠 배치 생성", "default": True},
    {"key": "auto_publish",          "label": "Auto Publish",          "description": "승인 글 자동 발행", "default": True},
    {"key": "insights_collection",   "label": "Insights Collection",   "description": "발행 글 반응 수집", "default": True},
    {"key": "auto_like_replies",     "label": "Auto Like Replies",     "description": "댓글 자동 좋아요", "default": True},
    {"key": "auto_reply",            "label": "Auto Reply",            "description": "댓글 자동 답글 (AI 톤)", "default": False},
    {"key": "low_engagement_cleanup","label": "Low Engagement Cleanup","description": "저조한 글 자동 삭제", "default": False},
    {"key": "trending_collection",   "label": "Trending Collection",   "description": "외부 인기글 수집", "default": True},
    {"key": "trending_rewrite",      "label": "Trending Rewrite",      "description": "트렌드 재가공", "default": False},
    {"key": "quote_trending",        "label": "Quote Trending",        "description": "인기글 인용 게시", "default": False},
    {"key": "series_followup",       "label": "Series Follow-up",      "description": "반응 좋은 토픽 시리즈 후속글", "default": False},
    {"key": "casual_posts",          "label": "Casual Posts",          "description": "일상/감성 글 자동 생성", "default": False},
    {"key": "follower_tracking",     "label": "Follower Tracking",     "description": "팔로워 추적", "default": True},
    {"key": "image_generation",      "label": "Image Generation",      "description": "이미지 자동 생성/첨부", "default": False},
]

DEFAULT_SETTINGS = {
    "viralThreshold": 500,
    "minLikes": 10,
    "searchDays": 7,
    "maxPopularPosts": 30,
    "insightsIntervalHours": 24,
    "insightsMaxCollections": 3,
    "publishIntervalHours": 2,
    "draftsPerBatch": 5,
    "imagePerBatch": 1,
    "casualPerBatch": 1,
    "quotePerBatch": 0,
}

# ── 인증 ──
AUTH_TOKEN = os.environ.get("DASHBOARD_AUTH_TOKEN", "")
if not AUTH_TOKEN:
    AUTH_TOKEN = secrets.token_hex(24)
    logger.warning("DASHBOARD_AUTH_TOKEN not set! Generated random token: %s", AUTH_TOKEN)


def read_settings():
    saved = read_json(SETTINGS_PATH)
    if saved is None:
        saved = {}
    return {**DEFAULT_SETTINGS, **saved}


VIRAL_THRESHOLD = int(os.environ.get("VIRAL_THRESHOLD", "500"))


# ── CORS ──
DASHBOARD_PORT = os.environ.get("DASHBOARD_PORT", "3000")
ALLOWED_ORIGINS = {
    f"http://localhost:{DASHBOARD_PORT}",
    f"http://127.0.0.1:{DASHBOARD_PORT}",
}


@app.after_request
def add_cors(response):
    origin = request.headers.get("Origin", "")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# ── 인증 미들웨어 ──
@app.before_request
def check_auth():
    if request.method == "OPTIONS":
        return  # CORS preflight 통과
    if request.path == "/" or request.path.startswith("/images/") or (not request.path.startswith("/api/") and request.path.endswith((".js", ".css", ".ico", ".png", ".svg"))):
        return  # 정적 파일 통과
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if token != AUTH_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401


# ── 유틸 ──
def read_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            json.dump(data, f, ensure_ascii=False, indent=2)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)


def get_json_body():
    """요청 body에서 JSON 안전하게 파싱"""
    try:
        return request.get_json(force=True) if request.is_json else {}
    except Exception:
        return {}


def parse_popular_posts():
    """popular-posts.txt 파싱"""
    posts = []
    try:
        with open(POPULAR_PATH, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        return posts

    blocks = content.split("---")
    for block in blocks:
        block = block.strip()
        if not block or block.startswith("#"):
            continue
        post = {}
        lines = block.split("\n")
        text_lines = []
        in_text = False
        for line in lines:
            if line.startswith("text:"):
                in_text = True
                text_lines.append(line[5:].strip())
            elif in_text:
                text_lines.append(line.strip())
            elif ":" in line:
                key, val = line.split(":", 1)
                post[key.strip()] = val.strip()
        if text_lines:
            post["text"] = " ".join(text_lines).strip()
        if post.get("text"):
            posts.append(post)
    return posts


# ── 정적 파일 서빙 ──
@app.route("/")
def index():
    return send_from_directory("static", "index.html")


# ── 이미지 서빙 ──
IMAGES_DIR = os.path.join(DATA_DIR, "images")


@app.route("/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)


@app.route("/api/images")
def api_images():
    if not os.path.isdir(IMAGES_DIR):
        return jsonify([])
    files = []
    for f in sorted(os.listdir(IMAGES_DIR), key=lambda x: os.path.getmtime(os.path.join(IMAGES_DIR, x)), reverse=True):
        ext = os.path.splitext(f)[1].lower()
        if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            path = os.path.join(IMAGES_DIR, f)
            files.append({
                "filename": f,
                "url": f"/images/{f}",
                "size": os.path.getsize(path),
                "createdAt": datetime.fromtimestamp(os.path.getmtime(path)).isoformat(),
            })
    return jsonify(files)


@app.route("/api/images/<filename>", methods=["DELETE"])
def api_delete_image(filename):
    path = os.path.join(IMAGES_DIR, filename)
    if not os.path.isfile(path):
        return jsonify({"error": "File not found"}), 404
    os.remove(path)
    return jsonify({"success": True})


@app.route("/api/generate-image", methods=["POST"])
def api_generate_image():
    import subprocess
    data = get_json_body()
    prompt = data.get("prompt", "").strip()
    if not prompt or len(prompt) > 500:
        return jsonify({"error": "prompt required (max 500 chars)"}), 400
    safe_prompt = prompt.replace("'", "\\'").replace('"', '\\"')
    msg = f'image_generate tool로 "{safe_prompt}" 이미지를 생성하라. 생성된 이미지를 /home/node/data/images/ 폴더에 저장하라.'
    try:
        result = subprocess.run(
            ["docker", "exec", "marketing-ai-openclaw-gateway-1",
             "node", "dist/index.js", "agent", "--agent", "main", "--message", msg],
            capture_output=True, text=True, timeout=120,
        )
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Image generation timed out"}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # Find newly created images
    os.makedirs(IMAGES_DIR, exist_ok=True)
    images = []
    for f in sorted(os.listdir(IMAGES_DIR), key=lambda x: os.path.getmtime(os.path.join(IMAGES_DIR, x)), reverse=True):
        if os.path.splitext(f)[1].lower() in (".jpg", ".jpeg", ".png", ".webp"):
            images.append({"filename": f, "url": f"/images/{f}"})
            break
    if not images:
        # Check config/media for gateway-generated images and copy latest
        media_dir = CONFIG_DIR / "media" / "tool-image-generation"
        if media_dir.is_dir():
            media_files = sorted(media_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)
            for mf in media_files:
                if mf.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                    import shutil
                    dest = os.path.join(IMAGES_DIR, mf.name)
                    shutil.copy2(mf, dest)
                    images.append({"filename": mf.name, "url": f"/images/{mf.name}"})
                    break
    if not images:
        return jsonify({"error": "Image generation failed", "output": result.stdout[-500:]}), 500
    return jsonify({"success": True, "image": images[0]})


# ── API: Queue ──
@app.route("/api/queue")
def api_queue():
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    status_filter = request.args.get("status")
    posts = queue.get("posts", [])
    if status_filter:
        posts = [p for p in posts if p.get("status") == status_filter]
    posts.sort(key=lambda p: p.get("generatedAt", ""), reverse=True)

    return jsonify({"posts": posts, "total": len(posts)})


@app.route("/api/queue/<post_id>/approve", methods=["POST"])
def api_approve(post_id):
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    data = get_json_body()
    for post in queue.get("posts", []):
        if post["id"] == post_id:
            post["status"] = "approved"
            now = datetime.now(timezone.utc)
            post["approvedAt"] = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            hours = data.get("hours", 0)
            if not isinstance(hours, (int, float)) or hours < 0:
                hours = 0
            scheduled = now + timedelta(hours=hours)
            post["scheduledAt"] = scheduled.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            write_json(QUEUE_PATH, queue)
            logger.info("Post approved: %s", post_id)
            return jsonify({"ok": True, "post": post})

    return jsonify({"error": "post not found"}), 404


@app.route("/api/queue/<post_id>/update", methods=["POST"])
def api_update(post_id):
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    data = get_json_body()
    for post in queue.get("posts", []):
        if post["id"] == post_id:
            if "status" in data and data["status"] in ("draft", "approved"):
                post["status"] = data["status"]
            if "text" in data:
                text = data["text"]
                if not isinstance(text, str) or not text.strip():
                    return jsonify({"error": "text must be a non-empty string"}), 400
                if post.get("originalText") is None and post["text"] != text:
                    post["originalText"] = post["text"]
                post["text"] = text
            if "topic" in data:
                post["topic"] = data["topic"]
            if "hashtags" in data:
                post["hashtags"] = data["hashtags"]
            if "scheduledAt" in data:
                post["scheduledAt"] = data["scheduledAt"]
            if "imageUrl" in data:
                img = data["imageUrl"]
                if img is None or (isinstance(img, str) and (img.startswith("/images/") or img.startswith("https://"))):
                    post["imageUrl"] = img
                else:
                    return jsonify({"error": "imageUrl must be null, /images/ path, or https:// URL"}), 400
            write_json(QUEUE_PATH, queue)
            logger.info("Post updated: %s", post_id)
            return jsonify({"ok": True, "post": post})

    return jsonify({"error": "post not found"}), 404


@app.route("/api/queue/<post_id>/delete", methods=["POST"])
def api_delete(post_id):
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    posts = queue.get("posts", [])
    queue["posts"] = [p for p in posts if p["id"] != post_id]
    if len(queue["posts"]) == len(posts):
        return jsonify({"error": "post not found"}), 404

    write_json(QUEUE_PATH, queue)
    logger.info("Post deleted: %s", post_id)
    return jsonify({"ok": True})


@app.route("/api/queue/bulk-approve", methods=["POST"])
def api_bulk_approve():
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    data = get_json_body()
    ids = data.get("ids", [])
    if not isinstance(ids, list):
        return jsonify({"error": "ids must be an array"}), 400

    now = datetime.now(timezone.utc)
    interval_hours = data.get("intervalHours", 2)
    approved = 0

    for i, post in enumerate(queue.get("posts", [])):
        if post["id"] in ids and post["status"] == "draft":
            post["status"] = "approved"
            post["approvedAt"] = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            scheduled = now + timedelta(hours=interval_hours * approved)
            post["scheduledAt"] = scheduled.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            approved += 1

    write_json(QUEUE_PATH, queue)
    logger.info("Bulk approved: %d posts", approved)
    return jsonify({"ok": True, "approved": approved})


@app.route("/api/queue/bulk-delete", methods=["POST"])
def api_bulk_delete():
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    data = get_json_body()
    ids = data.get("ids", [])
    if not isinstance(ids, list):
        return jsonify({"error": "ids must be an array"}), 400

    id_set = set(ids)
    before = len(queue.get("posts", []))
    queue["posts"] = [p for p in queue.get("posts", []) if p["id"] not in id_set]
    deleted = before - len(queue["posts"])

    write_json(QUEUE_PATH, queue)
    logger.info("Bulk deleted: %d posts", deleted)
    return jsonify({"ok": True, "deleted": deleted})


# ── API: Trend Report ──
@app.route("/api/trend-report")
def api_trend_report():
    report_path = os.path.join(DATA_DIR, "trend-report.json")
    report = read_json(report_path)
    if report is None:
        return jsonify({"generatedAt": None, "keywords": {}, "rewriteCandidates": []})
    return jsonify(report)


# ── API: Growth ──
@app.route("/api/growth")
def api_growth():
    growth = read_json(GROWTH_PATH)
    if growth is None:
        return jsonify({"records": []})
    return jsonify(growth)


# ── API: Popular Posts ──
@app.route("/api/popular")
def api_popular():
    posts = parse_popular_posts()
    source_filter = request.args.get("source")
    if source_filter:
        posts = [p for p in posts if p.get("source") == source_filter]
    return jsonify({"posts": posts, "total": len(posts)})


# ── API: Keywords ──
@app.route("/api/keywords")
def api_keywords():
    try:
        with open(KEYWORDS_PATH, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]
        return jsonify({"keywords": lines})
    except FileNotFoundError:
        return jsonify({"keywords": []})


@app.route("/api/keywords", methods=["POST"])
def api_keywords_update():
    data = get_json_body()
    keywords = data.get("keywords", [])
    if not isinstance(keywords, list):
        return jsonify({"error": "keywords must be an array"}), 400
    with open(KEYWORDS_PATH, "w", encoding="utf-8") as f:
        f.write("# Threads 인기글 검색 키워드 (한 줄에 하나, #=주석, 빈 줄 무시)\n")
        for kw in keywords:
            f.write(f"{kw}\n")
    logger.info("Keywords updated: %d keywords", len(keywords))
    return jsonify({"ok": True, "count": len(keywords)})


# ── API: Analytics ──
def _hourly_performance(post_stats):
    """시간대별 평균 engagement 계산"""
    hours = {}
    for p in post_stats:
        if not p.get("publishedAt"):
            continue
        try:
            h = datetime.fromisoformat(p["publishedAt"].replace("Z", "+00:00")).hour
        except Exception:
            continue
        if h not in hours:
            hours[h] = {"count": 0, "views": 0, "likes": 0}
        hours[h]["count"] += 1
        hours[h]["views"] += p.get("views", 0)
        hours[h]["likes"] += p.get("likes", 0)
    result = {}
    for h, d in hours.items():
        c = d["count"]
        result[h] = {"count": c, "avgViews": round(d["views"] / c), "avgLikes": round(d["likes"] / c)}
    return result


@app.route("/api/analytics")
def api_analytics():
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    posts = queue.get("posts", [])
    published = [p for p in posts if p.get("status") == "published"]

    # Merge archived posts from analytics-history.json
    history_path = os.path.join(DATA_DIR, "analytics-history.json")
    history = read_json(history_path)
    archived = history.get("posts", []) if history else []

    # 포스트별 engagement (current + archived)
    post_stats = []
    for p in archived:
        eng = p.get("engagement") or {}
        post_stats.append({
            "id": p["id"],
            "text": p.get("text", "")[:80],
            "topic": p.get("topic", ""),
            "publishedAt": p.get("publishedAt"),
            "views": eng.get("views", 0),
            "likes": eng.get("likes", 0),
            "replies": eng.get("replies", 0),
            "reposts": eng.get("reposts", 0),
            "quotes": eng.get("quotes", 0),
            "archived": True,
        })
    for p in published:
        eng = p.get("engagement") or {}
        post_stats.append({
            "id": p["id"],
            "text": p["text"][:80],
            "topic": p.get("topic", ""),
            "publishedAt": p.get("publishedAt"),
            "views": eng.get("views", 0),
            "likes": eng.get("likes", 0),
            "replies": eng.get("replies", 0),
            "reposts": eng.get("reposts", 0),
            "quotes": eng.get("quotes", 0),
        })

    # 토픽별 평균
    topic_stats = {}
    for p in post_stats:
        topic = p["topic"] or "unknown"
        if topic not in topic_stats:
            topic_stats[topic] = {"count": 0, "views": 0, "likes": 0, "replies": 0}
        topic_stats[topic]["count"] += 1
        topic_stats[topic]["views"] += p["views"]
        topic_stats[topic]["likes"] += p["likes"]
        topic_stats[topic]["replies"] += p["replies"]

    for topic in topic_stats:
        c = topic_stats[topic]["count"]
        if c > 0:
            topic_stats[topic]["avgViews"] = round(topic_stats[topic]["views"] / c)
            topic_stats[topic]["avgLikes"] = round(topic_stats[topic]["likes"] / c)
            topic_stats[topic]["avgReplies"] = round(topic_stats[topic]["replies"] / c)

    # 해시태그별 성과
    hashtag_stats = {}
    for p in published + archived:
        eng = p.get("engagement") or {}
        views = eng.get("views", 0)
        likes = eng.get("likes", 0)
        for tag in p.get("hashtags", []):
            tag = tag.lstrip("#")
            if tag not in hashtag_stats:
                hashtag_stats[tag] = {"count": 0, "views": 0, "likes": 0}
            hashtag_stats[tag]["count"] += 1
            hashtag_stats[tag]["views"] += views
            hashtag_stats[tag]["likes"] += likes
    for tag in hashtag_stats:
        c = hashtag_stats[tag]["count"]
        if c > 0:
            hashtag_stats[tag]["avgViews"] = round(hashtag_stats[tag]["views"] / c)
            hashtag_stats[tag]["avgLikes"] = round(hashtag_stats[tag]["likes"] / c)

    # 전체 요약
    total_views = sum(p["views"] for p in post_stats)
    total_likes = sum(p["likes"] for p in post_stats)
    settings = read_settings()
    vt = settings["viralThreshold"]
    viral_count = sum(1 for p in post_stats if p["views"] >= vt)

    return jsonify({
        "summary": {
            "totalPublished": len(published),
            "totalViews": total_views,
            "totalLikes": total_likes,
            "avgViews": round(total_views / len(published)) if published else 0,
            "avgLikes": round(total_likes / len(published)) if published else 0,
            "viralCount": viral_count,
            "viralThreshold": vt,
        },
        "posts": post_stats,
        "topics": topic_stats,
        "hashtags": hashtag_stats,
        "hourlyPerformance": _hourly_performance(post_stats),
        "statusCounts": {
            "draft": sum(1 for p in posts if p.get("status") == "draft"),
            "approved": sum(1 for p in posts if p.get("status") == "approved"),
            "published": sum(1 for p in posts if p.get("status") == "published"),
            "failed": sum(1 for p in posts if p.get("status") == "failed"),
        },
    })


# ── API: Overview (대시보드 상단 요약) ──
@app.route("/api/overview")
def api_overview():
    # Queue 상태
    queue = read_json(QUEUE_PATH) or {"posts": []}
    posts = queue.get("posts", [])
    status_counts = {
        "draft": sum(1 for p in posts if p.get("status") == "draft"),
        "approved": sum(1 for p in posts if p.get("status") == "approved"),
        "published": sum(1 for p in posts if p.get("status") == "published"),
        "failed": sum(1 for p in posts if p.get("status") == "failed"),
    }

    # 팔로워 정보
    growth = read_json(GROWTH_PATH) or {"records": []}
    records = growth.get("records", [])
    followers = records[-1]["followers"] if records else None
    week_delta = None
    if len(records) >= 2:
        week_records = records[-7:]
        week_delta = week_records[-1]["followers"] - week_records[0]["followers"]

    # 터진 글
    settings = read_settings()
    vt = settings["viralThreshold"]
    viral_posts = []
    for p in posts:
        eng = p.get("engagement") or {}
        if eng.get("views", 0) >= vt:
            viral_posts.append({
                "id": p["id"],
                "text": p["text"][:80],
                "views": eng["views"],
                "likes": eng.get("likes", 0),
            })

    # 인기글 소스 분포
    popular = parse_popular_posts()
    source_counts = {}
    for pp in popular:
        src = pp.get("source", "unknown")
        source_counts[src] = source_counts.get(src, 0) + 1

    # 채널별 발행 카운트
    channel_counts = {"threads": 0, "x": 0}
    for p in posts:
        ch = p.get("channels") or {}
        if ch.get("threads", {}).get("status") == "published":
            channel_counts["threads"] += 1
        if ch.get("x", {}).get("status") == "published":
            channel_counts["x"] += 1

    return jsonify({
        "statusCounts": status_counts,
        "followers": followers,
        "weekDelta": week_delta,
        "viralPosts": viral_posts,
        "popularPostsCount": len(popular),
        "popularSourceCounts": source_counts,
        "channelCounts": channel_counts,
    })


# ── API: Settings ──
@app.route("/api/settings")
def api_settings():
    return jsonify(read_settings())


@app.route("/api/settings", methods=["POST"])
def api_settings_update():
    data = get_json_body()
    current = read_settings()
    allowed_keys = set(DEFAULT_SETTINGS.keys())
    updated = {}
    for key in allowed_keys:
        if key in data:
            val = data[key]
            if isinstance(val, (int, float)) and val >= 0:
                updated[key] = int(val)
    current.update(updated)
    write_json(SETTINGS_PATH, current)
    logger.info("Settings updated: %s", list(updated.keys()))
    return jsonify({"ok": True, "settings": current})


# ── API: Cron Status ──
@app.route("/api/cron-status")
def api_cron_status():
    cron_data = read_json(CRON_JOBS_PATH)
    if cron_data is None:
        return jsonify({"jobs": []})
    name_map = {
        "threads-generate-drafts": "콘텐츠 생성",
        "threads-auto-publish": "자동 발행",
        "multi-channel-publish": "멀티채널 발행",
        "threads-collect-insights": "반응 수집 + 좋아요 + 저조삭제",
        "threads-track-growth": "팔로워 추적",
        "threads-fetch-trending": "인기글 수집",
        "threads-rewrite-trending": "트렌드 재가공",
    }
    jobs = []
    for job in cron_data.get("jobs", []):
        state = job.get("state", {})
        jobs.append({
            "name": name_map.get(job["name"], job["name"]),
            "id": job["name"],
            "enabled": job.get("enabled", False),
            "lastRunAt": state.get("lastRunAtMs"),
            "nextRunAt": state.get("nextRunAtMs"),
            "lastStatus": state.get("lastRunStatus", "unknown"),
            "everyMs": job.get("schedule", {}).get("everyMs"),
        })
    return jsonify({"jobs": jobs})


@app.route("/api/cron/<job_name>/interval", methods=["POST"])
def api_cron_interval(job_name):
    import subprocess
    cron_data = read_json(CRON_JOBS_PATH)
    if cron_data is None:
        return jsonify({"error": "cron jobs not found"}), 404
    job = next((j for j in cron_data.get("jobs", []) if j["name"] == job_name), None)
    if not job:
        return jsonify({"error": "job not found"}), 404
    data = get_json_body()
    hours = data.get("hours")
    if not isinstance(hours, (int, float)) or hours < 1 or hours > 168:
        return jsonify({"error": "hours must be between 1 and 168"}), 400
    try:
        result = subprocess.run(
            ["node", "dist/index.js", "cron", "edit", job["id"], "--every", f"{int(hours)}h"],
            capture_output=True, text=True, timeout=15,
            cwd="/app" if os.path.isdir("/app/dist") else os.path.join(os.path.dirname(__file__), "..", "openclaw"),
        )
        if result.returncode != 0:
            return jsonify({"error": result.stderr.strip() or "cron edit failed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    logger.info("Cron interval updated: %s → %dh", job_name, hours)
    return jsonify({"ok": True, "hours": hours})


# ── API: Prompt Guide ──
GUIDE_PATH = DATA_DIR / "prompt-guide.txt"


@app.route("/api/guide")
def api_guide():
    try:
        with open(GUIDE_PATH, "r", encoding="utf-8") as f:
            return jsonify({"guide": f.read()})
    except FileNotFoundError:
        return jsonify({"guide": ""})


@app.route("/api/guide", methods=["POST"])
def api_guide_update():
    data = get_json_body()
    guide = data.get("guide", "")
    if not isinstance(guide, str):
        return jsonify({"error": "guide must be a string"}), 400
    with open(GUIDE_PATH, "w", encoding="utf-8") as f:
        f.write(guide)
    logger.info("Guide updated (%d chars)", len(guide))
    return jsonify({"ok": True})


# ── API: Alerts ──
@app.route("/api/alerts")
def api_alerts():
    alerts = []

    # Failed posts
    queue = read_json(QUEUE_PATH) or {"posts": []}
    failed = [p for p in queue.get("posts", []) if p.get("status") == "failed"]
    if failed:
        alerts.append({
            "severity": "error",
            "message": f"발행 실패 {len(failed)}건",
            "count": len(failed),
            "type": "failed_posts",
        })

    # Cron errors
    cron_data = read_json(CRON_JOBS_PATH) or {"jobs": []}
    for job in cron_data.get("jobs", []):
        state_data = job.get("state", {})
        if state_data.get("lastRunStatus") == "error":
            alerts.append({
                "severity": "warning",
                "message": f"Cron 에러: {job.get('name', 'unknown')}",
                "type": "cron_error",
                "jobName": job.get("name"),
            })

    return jsonify({"alerts": alerts})


# ── API: Activity Timeline ──
@app.route("/api/activity")
def api_activity():
    queue = read_json(QUEUE_PATH) or {"posts": []}
    posts = queue.get("posts", [])
    events = []
    settings = read_settings()
    for p in posts:
        ch = p.get("channels") or {}
        if p.get("publishedAt"):
            channels_published = []
            if ch.get("threads", {}).get("status") == "published":
                channels_published.append("Threads")
            if ch.get("x", {}).get("status") == "published":
                channels_published.append("X")
            events.append({"type": "publish", "text": p["text"][:60], "channel": " + ".join(channels_published) or "Threads", "at": p["publishedAt"]})
        if p.get("status") == "draft" and p.get("generatedAt"):
            events.append({"type": "draft", "text": p["text"][:60], "at": p["generatedAt"]})
        eng = p.get("engagement") or {}
        if eng.get("views", 0) >= settings["viralThreshold"]:
            events.append({"type": "viral", "text": p["text"][:60], "views": eng["views"], "at": eng.get("collectedAt") or p.get("publishedAt", "")})
    events.sort(key=lambda e: e.get("at", ""), reverse=True)
    return jsonify({"events": events[:20]})


# ── API: Channel Config ──
@app.route("/api/channel-config")
def api_channel_config():
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path) or {}
    plugins = config.get("plugins", {}).get("entries", {})
    channels = {}
    tp = plugins.get("threads-publish", {})
    channels["threads"] = {"enabled": tp.get("enabled", False), "userId": tp.get("config", {}).get("userId", ""), "connected": bool(tp.get("config", {}).get("accessToken", ""))}
    xp = plugins.get("x-publish", {})
    channels["x"] = {"enabled": xp.get("enabled", False), "connected": bool(xp.get("config", {}).get("apiKey", ""))}
    return jsonify(channels)


@app.route("/api/channel-config/x", methods=["POST"])
def api_channel_config_x():
    data = get_json_body()
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path)
    if config is None:
        return jsonify({"error": "openclaw.json not found"}), 404
    plugins = config.setdefault("plugins", {}).setdefault("entries", {})
    xp = plugins.setdefault("x-publish", {"enabled": False, "config": {}})
    for key in ("apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"):
        if key in data and isinstance(data[key], str) and data[key].strip():
            xp["config"][key] = data[key].strip()
    creds = xp.get("config", {})
    if all(creds.get(k) for k in ("apiKey", "apiKeySecret", "accessToken", "accessTokenSecret")):
        xp["enabled"] = True
    write_json(config_path, config)
    logger.info("X channel config updated")
    return jsonify({"ok": True, "enabled": xp["enabled"]})


# ── API: Channel Automation Settings ──
def _read_channel_settings():
    data = read_json(CHANNEL_SETTINGS_PATH)
    if data is None:
        data = {}
    for ch in ("threads", "x"):
        if ch not in data:
            data[ch] = {}
        for f in AUTOMATION_FEATURES:
            if f["key"] not in data[ch]:
                data[ch][f["key"]] = f["default"]
    return data


@app.route("/api/channel-settings")
def api_channel_settings():
    data = _read_channel_settings()
    return jsonify({"features": AUTOMATION_FEATURES, "settings": data})


@app.route("/api/channel-settings/<channel>", methods=["POST"])
def api_update_channel_settings(channel):
    if channel not in ("threads", "x"):
        return jsonify({"error": "Invalid channel"}), 400
    body = get_json_body()
    data = _read_channel_settings()
    valid_keys = {f["key"] for f in AUTOMATION_FEATURES}
    for k, v in body.items():
        if k in valid_keys and isinstance(v, bool):
            data[channel][k] = v
    write_json(CHANNEL_SETTINGS_PATH, data)
    logger.info("Channel settings updated: %s", channel)
    return jsonify({"ok": True, "settings": data[channel]})


# ── API: Cron Run History ──
@app.route("/api/cron-runs")
def api_cron_runs():
    cron_runs_dir = CONFIG_DIR / "cron" / "runs"
    if not cron_runs_dir.is_dir():
        return jsonify({"runs": []})
    # Build jobId → name map from jobs.json
    cron_data = read_json(CRON_JOBS_PATH) or {}
    id_to_name = {j["id"]: j["name"] for j in cron_data.get("jobs", []) if "id" in j}
    runs = []
    for f in sorted(cron_runs_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if not f.name.endswith(".jsonl"):
            continue
        try:
            with open(f, "r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    entry = json.loads(line)
                    if entry.get("action") == "finished":
                        job_id = entry.get("jobId", f.stem)
                        runs.append({
                            "jobId": job_id,
                            "jobName": id_to_name.get(job_id, job_id),
                            "status": entry.get("status", "unknown"),
                            "summary": (entry.get("summary") or "")[:200],
                            "durationMs": entry.get("durationMs", 0),
                            "finishedAt": entry.get("ts", 0),
                            "model": entry.get("model", ""),
                        })
        except Exception:
            continue
    runs.sort(key=lambda r: r.get("finishedAt", 0), reverse=True)
    return jsonify({"runs": runs[:30]})


if __name__ == "__main__":
    port = int(os.environ.get("DASHBOARD_PORT", "3000"))
    logger.info("Marketing Hub running on http://localhost:%d", port)
    app.run(host="0.0.0.0", port=port, debug=True)

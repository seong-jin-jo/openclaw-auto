#!/usr/bin/env python3
"""Threads 콘텐츠 대시보드 — Flask 백엔드
데이터: queue.json, growth.json, popular-posts.txt, style-data.json 직접 읽기/쓰기
"""
import fcntl
import json
import logging
import os
import re
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

DEFAULT_SETTINGS = {
    "viralThreshold": 500,
    "minLikes": 10,
    "searchDays": 7,
    "maxPopularPosts": 30,
    "insightsIntervalHours": 24,
    "insightsMaxCollections": 3,
    "publishIntervalHours": 2,
    "draftsPerBatch": 5,
}

# ── 인증 (선택) ──
AUTH_TOKEN = os.environ.get("DASHBOARD_AUTH_TOKEN", "")


def read_settings():
    saved = read_json(SETTINGS_PATH)
    if saved is None:
        saved = {}
    return {**DEFAULT_SETTINGS, **saved}


VIRAL_THRESHOLD = int(os.environ.get("VIRAL_THRESHOLD", "500"))


# ── CORS ──
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# ── 인증 미들웨어 ──
@app.before_request
def check_auth():
    if not AUTH_TOKEN:
        return  # 토큰 미설정 시 인증 비활성화
    if request.method == "OPTIONS":
        return  # CORS preflight 통과
    if request.path == "/" or request.path.startswith("/static"):
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
    approved = 0

    for i, post in enumerate(queue.get("posts", [])):
        if post["id"] in ids and post["status"] == "draft":
            post["status"] = "approved"
            post["approvedAt"] = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            scheduled = now
            post["scheduledAt"] = scheduled.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            approved += 1

    write_json(QUEUE_PATH, queue)
    logger.info("Bulk approved: %d posts", approved)
    return jsonify({"ok": True, "approved": approved})


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
@app.route("/api/analytics")
def api_analytics():
    queue = read_json(QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "queue.json not found"}), 404

    posts = queue.get("posts", [])
    published = [p for p in posts if p.get("status") == "published"]

    # 포스트별 engagement
    post_stats = []
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

    return jsonify({
        "statusCounts": status_counts,
        "followers": followers,
        "weekDelta": week_delta,
        "viralPosts": viral_posts,
        "popularPostsCount": len(popular),
        "popularSourceCounts": source_counts,
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
        "threads-collect-insights": "반응 수집",
        "threads-track-growth": "팔로워 추적",
        "threads-fetch-trending": "인기글 수집",
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


if __name__ == "__main__":
    port = int(os.environ.get("DASHBOARD_PORT", "3000"))
    logger.info("Threads Dashboard running on http://localhost:%d", port)
    app.run(host="0.0.0.0", port=port, debug=True)

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
BLOG_QUEUE_PATH = DATA_DIR / "blog-queue.json"
SETTINGS_PATH = DATA_DIR / "settings.json"
CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", Path(__file__).resolve().parent.parent / "config"))
CRON_JOBS_PATH = CONFIG_DIR / "cron" / "jobs.json"
CHANNEL_SETTINGS_PATH = Path(DATA_DIR) / "channel-settings.json"
SEO_SETTINGS_PATH = DATA_DIR / "seo-settings.json"

AUTOMATION_FEATURES = [
    {"key": "content_generation",    "label": "Content Generation",    "description": "prompt-guide 기반 글 배치 생성 → draft 저장", "detail": "6시간마다 prompt-guide.txt + style-data.json + popular-posts.txt를 참고하여 draftsPerBatch개(기본 5) 글을 자동 생성합니다. 대시보드에서 검수/승인 후 발행됩니다.", "default": True},
    {"key": "auto_publish",          "label": "Auto Publish",          "description": "승인된 글 자동 발행 (1개씩)", "detail": "2시간마다 승인(approved) 상태인 글 중 가장 이른 예약 글 1개를 Threads에 발행합니다. 이미지가 있으면 IMAGE 타입으로 발행합니다.", "default": True},
    {"key": "insights_collection",   "label": "Insights Collection",   "description": "발행 글 views/likes/replies 수집", "detail": "6시간마다 발행된 글의 engagement 지표를 Threads API로 수집합니다. viral 기준(viralThreshold) 초과 시 popular-posts.txt에 자동 등록됩니다.", "default": True},
    {"key": "auto_like_replies",     "label": "Auto Like Replies",     "description": "내 글에 달린 댓글에 좋아요", "detail": "insights 수집 시 함께 실행됩니다. 발행된 모든 글의 댓글에 자동으로 좋아요를 누릅니다.", "default": True},
    {"key": "auto_reply",            "label": "Auto Reply",            "description": "미답변 댓글에 AI 톤 자동 답글", "detail": "댓글 내용을 분석하여 질문/공감/감사 등에 맞는 자연스러운 답글을 작성합니다. 이미 답한 댓글은 건너뜁니다.", "default": False},
    {"key": "low_engagement_cleanup","label": "Low Engagement Cleanup","description": "24시간 후 반응 저조 글 자동 삭제", "detail": "발행 24시간 경과 후 views < 100 AND likes < 3인 글을 Threads에서 삭제합니다. 삭제된 글은 대시보드 Analytics에 archived로 기록됩니다.", "default": False},
    {"key": "trending_collection",   "label": "Trending Collection",   "description": "키워드 기반 외부 인기글 브라우저 수집", "detail": "6시간마다 search-keywords.txt 키워드로 Threads 검색 페이지를 스크래핑하여 외부 인기글(likes, username, URL)을 수집합니다. minLikes 이상만 저장합니다.", "default": True},
    {"key": "trending_rewrite",      "label": "Trending Rewrite",      "description": "수집된 인기글을 우리 톤으로 재가공", "detail": "주 1회 popular-posts.txt의 인기글을 분석하고, 우리 prompt-guide.txt 톤으로 리라이팅하여 draft로 저장합니다.", "default": False},
    {"key": "quote_trending",        "label": "Quote Trending",        "description": "외부 인기글 인용 게시 (우리 관점 추가)", "detail": "insights 수집 시 external 인기글 중 1개를 골라 우리 관점 코멘트와 함께 인용 게시(quote post)합니다.", "default": False},
    {"key": "series_followup",       "label": "Series Follow-up",      "description": "반응 좋은 토픽으로 시리즈 후속글", "detail": "글 생성 시 own-viral 중 반응이 가장 좋은 토픽을 골라 시리즈 후속글 1개를 추가 생성합니다.", "default": False},
    {"key": "casual_posts",          "label": "Casual Posts",          "description": "일상/감성 톤 글 (사람처럼 보이기)", "detail": "글 생성 시 casualPerBatch개(기본 1)를 일상 톤으로 생성합니다. 카페 코딩, 날씨 감상, 소소한 일상 등. 자동화 봇처럼 보이지 않게 합니다.", "default": False},
    {"key": "follower_tracking",     "label": "Follower Tracking",     "description": "팔로워 수/증감 매일 추적", "detail": "매일 Threads 팔로워 수를 기록하고 증감을 추적합니다. Growth 탭에서 확인할 수 있습니다.", "default": True},
    {"key": "image_generation",      "label": "Image Generation",      "description": "배치 중 일부에 AI 이미지 자동 생성", "detail": "글 생성 시 imagePerBatch개(기본 1)에 AI 일러스트를 생성하여 첨부합니다. 발행 시 자동으로 퍼블릭 URL로 업로드됩니다.", "default": False},
    {"key": "instagram_carousel",   "label": "Instagram Carousel",    "description": "카드뉴스 자동 생성 + Instagram 캐러셀 발행", "detail": "인기 토픽을 카드뉴스(텍스트 카드 3~5장)로 변환하여 Instagram 캐러셀로 발행합니다. 크레덴셜 설정 필요.", "default": False},
    {"key": "youtube_shorts",       "label": "YouTube Shorts",        "description": "카드뉴스 기반 짧은 영상 생성 + Shorts 발행", "detail": "카드뉴스 이미지 + TTS 음성을 합성하여 30~60초 Shorts 영상을 생성합니다. ffmpeg + TTS 모델 필요.", "default": False},
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
    if origin in ALLOWED_ORIGINS or origin.endswith(".cloudflare-tunnel.cloud") or origin.endswith(".trycloudflare.com"):
        response.headers["Access-Control-Allow-Origin"] = origin
    elif not origin:
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
        return
    # 정적 파일: 항상 허용
    if request.path == "/" or request.path.startswith("/images/") or (not request.path.startswith("/api/") and request.path.endswith((".js", ".css", ".ico", ".png", ".svg", ".html"))):
        return
    # API: 인증 필요
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


@app.route("/api/generate-card", methods=["POST"])
def api_generate_card():
    import subprocess
    data = get_json_body()
    title = data.get("title", "").strip()
    slides = data.get("slides", [])
    style = data.get("style", "dark")
    if not title or not slides:
        return jsonify({"error": "title and slides required"}), 400
    slides_json = json.dumps(slides, ensure_ascii=False)
    msg = f'card_generate tool 호출: action="generate", title="{title}", slides={slides_json}, style="{style}"'
    try:
        result = subprocess.run(
            ["docker", "exec", "marketing-ai-openclaw-gateway-1",
             "node", "dist/index.js", "agent", "--agent", "main",
             "--session-id", f"card-api-{os.getpid()}", "--message", msg],
            capture_output=True, text=True, timeout=60,
        )
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Card generation timed out"}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # Find generated card files
    os.makedirs(IMAGES_DIR, exist_ok=True)
    cards = sorted([f for f in os.listdir(IMAGES_DIR) if f.startswith("card-") and f.endswith(".png")],
                   key=lambda x: os.path.getmtime(os.path.join(IMAGES_DIR, x)), reverse=True)
    # Get latest batch (same prefix)
    if cards:
        batch_prefix = cards[0][:13]  # "card-XXXXXXXX"
        batch_files = [{"filename": f, "url": f"/images/{f}"} for f in sorted(cards) if f.startswith(batch_prefix)]
        return jsonify({"success": True, "cards": batch_files})
    return jsonify({"error": "Card generation failed"}), 500


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
# ── API: Blog Queue ──
@app.route("/api/blog-queue")
def api_blog_queue():
    queue = read_json(BLOG_QUEUE_PATH)
    if queue is None:
        return jsonify({"posts": [], "total": 0})
    status_filter = request.args.get("status")
    posts = queue.get("posts", [])
    if status_filter:
        posts = [p for p in posts if p.get("status") == status_filter]
    posts.sort(key=lambda p: p.get("generatedAt", ""), reverse=True)
    return jsonify({"posts": posts, "total": len(posts)})


@app.route("/api/blog-queue/<post_id>/approve", methods=["POST"])
def api_blog_approve(post_id):
    queue = read_json(BLOG_QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "blog-queue.json not found"}), 404
    for post in queue.get("posts", []):
        if post["id"] == post_id:
            post["status"] = "approved"
            now = datetime.now(timezone.utc)
            post["approvedAt"] = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            post["scheduledAt"] = now.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            write_json(BLOG_QUEUE_PATH, queue)
            logger.info("Blog post approved: %s", post_id)
            return jsonify({"ok": True, "post": post})
    return jsonify({"error": "post not found"}), 404


@app.route("/api/blog-queue/<post_id>/delete", methods=["POST"])
def api_blog_delete(post_id):
    queue = read_json(BLOG_QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "blog-queue.json not found"}), 404
    posts = queue.get("posts", [])
    queue["posts"] = [p for p in posts if p["id"] != post_id]
    if len(queue["posts"]) == len(posts):
        return jsonify({"error": "post not found"}), 404
    write_json(BLOG_QUEUE_PATH, queue)
    logger.info("Blog post deleted: %s", post_id)
    return jsonify({"ok": True})


@app.route("/api/blog-queue/<post_id>/update", methods=["POST"])
def api_blog_update(post_id):
    queue = read_json(BLOG_QUEUE_PATH)
    if queue is None:
        return jsonify({"error": "blog-queue.json not found"}), 404
    data = get_json_body()
    for post in queue.get("posts", []):
        if post["id"] == post_id:
            for key in ("title", "content", "seoKeyword", "category", "thumbnailUrl"):
                if key in data and isinstance(data[key], str):
                    post[key] = data[key]
            if "tags" in data and isinstance(data["tags"], list):
                post["tags"] = [str(t) for t in data["tags"]]
            write_json(BLOG_QUEUE_PATH, queue)
            logger.info("Blog post updated: %s", post_id)
            return jsonify({"ok": True, "post": post})
    return jsonify({"error": "post not found"}), 404


# ── API: Blog Stats (proxy to d-edu.site) ──
@app.route("/api/blog-stats")
def api_blog_stats():
    """Fetch article stats directly from d-edu.site API"""
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path) or {}
    blog_cfg = config.get("plugins", {}).get("entries", {}).get("dedu-blog", {}).get("config", {})
    api_base = blog_cfg.get("apiBaseUrl", "")
    email = blog_cfg.get("email", "")
    password = blog_cfg.get("password", "")
    if not api_base or not email:
        return jsonify({"error": "Blog not configured", "articles": [], "totalViews": 0, "totalArticles": 0})

    try:
        import urllib.request
        # Login
        login_data = json.dumps({"email": email, "password": password}).encode()
        login_req = urllib.request.Request(f"{api_base}/api/auth/login", login_data, {"Content-Type": "application/json"})
        login_resp = urllib.request.urlopen(login_req, timeout=10)
        cookie = login_resp.headers.get("Set-Cookie", "")
        import re as _re
        auth_match = _re.search(r"Authorization=([^;]+)", cookie)
        if not auth_match:
            return jsonify({"error": "Login failed", "articles": [], "totalViews": 0, "totalArticles": 0})
        auth_token = auth_match.group(1)

        # Fetch articles
        list_req = urllib.request.Request(
            f"{api_base}/api/admin/column-articles?status=APPROVED&page=0&size=100",
            headers={"Cookie": f"Authorization={auth_token}"}
        )
        list_resp = urllib.request.urlopen(list_req, timeout=10)
        data = json.loads(list_resp.read())
        content = data.get("data", {}).get("content", [])

        articles = []
        total_views = 0
        for a in content:
            views = a.get("viewCount", 0) or 0
            total_views += views
            articles.append({
                "id": a.get("id"),
                "title": a.get("title", ""),
                "viewCount": views,
                "tags": a.get("tags", []),
                "regDate": a.get("regDate", ""),
            })
        articles.sort(key=lambda x: x["viewCount"], reverse=True)
        avg_views = round(total_views / len(articles)) if articles else 0
        top = articles[0] if articles else None

        # Tag aggregation
        tag_stats = {}
        for a in articles:
            for tag in a.get("tags", []):
                if tag not in tag_stats:
                    tag_stats[tag] = {"count": 0, "totalViews": 0}
                tag_stats[tag]["count"] += 1
                tag_stats[tag]["totalViews"] += a["viewCount"]
        for t in tag_stats.values():
            t["avgViews"] = round(t["totalViews"] / t["count"]) if t["count"] else 0
        top_tags = sorted(tag_stats.items(), key=lambda x: x[1]["avgViews"], reverse=True)[:15]

        # Save daily snapshot
        history_path = DATA_DIR / "blog-analytics-history.json"
        history = read_json(history_path) or {"snapshots": []}
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        existing = [s for s in history["snapshots"] if s.get("date") == today]
        snapshot = {"date": today, "totalViews": total_views, "totalArticles": len(articles),
                    "articles": [{"id": a["id"], "viewCount": a["viewCount"]} for a in articles]}
        if existing:
            existing[0].update(snapshot)
        else:
            history["snapshots"].append(snapshot)
            history["snapshots"] = history["snapshots"][-90:]  # keep 90 days
        write_json(history_path, history)

        # Calculate daily delta
        yesterday = [(s) for s in history["snapshots"] if s["date"] < today]
        prev_views = yesterday[-1]["totalViews"] if yesterday else 0
        daily_delta = total_views - prev_views

        return jsonify({
            "totalArticles": len(articles),
            "totalViews": total_views,
            "avgViews": avg_views,
            "dailyDelta": daily_delta,
            "topArticle": top,
            "articles": articles,
            "topTags": [{"tag": t, **v} for t, v in top_tags],
            "history": [{"date": s["date"], "totalViews": s["totalViews"]} for s in history["snapshots"][-14:]],
        })
    except Exception as e:
        logger.error("Blog stats fetch failed: %s", e)
        return jsonify({"error": str(e), "articles": [], "totalViews": 0, "totalArticles": 0})


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


@app.route("/api/popular/add", methods=["POST"])
def api_popular_add():
    data = get_json_body()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "text required"}), 400
    url = data.get("url", "").strip()
    topic = data.get("topic", "general").strip()
    # Extract username from URL if provided
    username = ""
    if url and "threads.net/@" in url:
        try:
            username = url.split("threads.net/@")[1].split("/")[0]
        except Exception:
            pass
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    entry = f"\n---\ntopic: {topic}\nengagement: unknown\nlikes: 0\nsource: external\ncollected: {today}"
    if username:
        entry += f"\nusername: {username}"
    if url:
        entry += f"\nurl: {url}"
    entry += f"\ntext: {text.replace(chr(10), ' ')}\n"
    with open(POPULAR_PATH, "a", encoding="utf-8") as f:
        f.write(entry)
    logger.info("Popular post added: %s", text[:50])
    return jsonify({"ok": True})


@app.route("/api/popular/delete", methods=["POST"])
def api_popular_delete():
    data = get_json_body()
    index = data.get("index")
    if not isinstance(index, int) or index < 0:
        return jsonify({"error": "invalid index"}), 400
    posts = parse_popular_posts()
    if index >= len(posts):
        return jsonify({"error": "index out of range"}), 404
    posts.pop(index)
    # Rebuild file
    header = "# Threads 인기글 참고 목록\n# source: manual(수동), external(외부수집), own-viral(자체바이럴)\n# type: 꿀팁, 공감, 의견, 경험담, 밈\n"
    entries = ""
    for p in posts:
        entries += "\n---\n"
        for k, v in p.items():
            if k != "text":
                entries += f"{k}: {v}\n"
        entries += f"text: {p.get('text', '')}\n"
    with open(POPULAR_PATH, "w", encoding="utf-8") as f:
        f.write(header + entries)
    logger.info("Popular post deleted at index %d", index)
    return jsonify({"ok": True})


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
        # Update jobs.json directly (dashboard doesn't have OpenClaw CLI)
        cron_data = read_json(CRON_JOBS_PATH)
        if cron_data:
            for j in cron_data.get("jobs", []):
                if j["id"] == job["id"]:
                    j["schedule"]["everyMs"] = int(hours) * 3600 * 1000
                    break
            write_json(CRON_JOBS_PATH, cron_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    logger.info("Cron interval updated: %s → %dh", job_name, hours)
    return jsonify({"ok": True, "hours": hours})


@app.route("/api/cron/<job_name>/toggle", methods=["POST"])
def api_cron_toggle(job_name):
    cron_data = read_json(CRON_JOBS_PATH)
    if cron_data is None:
        return jsonify({"error": "cron jobs not found"}), 404
    job = next((j for j in cron_data.get("jobs", []) if j["name"] == job_name), None)
    if not job:
        return jsonify({"error": "job not found"}), 404
    data = get_json_body()
    enabled = data.get("enabled", not job.get("enabled", True))
    job["enabled"] = bool(enabled)
    write_json(CRON_JOBS_PATH, cron_data)
    logger.info("Cron toggled: %s → %s", job_name, "enabled" if enabled else "disabled")
    return jsonify({"ok": True, "enabled": enabled})


# ── API: Prompt Guide ──
GUIDE_PATH = DATA_DIR / "prompt-guide.txt"
BLOG_GUIDE_PATH = DATA_DIR / "blog-prompt-guide.txt"
BLOG_KEYWORDS_PATH = DATA_DIR / "blog-keywords.txt"


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


# ── API: Blog Guide & Keywords ──
@app.route("/api/blog-guide")
def api_blog_guide():
    try:
        with open(BLOG_GUIDE_PATH, "r", encoding="utf-8") as f:
            return jsonify({"guide": f.read()})
    except FileNotFoundError:
        return jsonify({"guide": ""})


@app.route("/api/blog-guide", methods=["POST"])
def api_blog_guide_update():
    data = get_json_body()
    guide = data.get("guide", "")
    if not isinstance(guide, str):
        return jsonify({"error": "guide must be a string"}), 400
    with open(BLOG_GUIDE_PATH, "w", encoding="utf-8") as f:
        f.write(guide)
    logger.info("Blog guide updated (%d chars)", len(guide))
    return jsonify({"ok": True})


@app.route("/api/blog-keywords")
def api_blog_keywords():
    try:
        with open(BLOG_KEYWORDS_PATH, "r", encoding="utf-8") as f:
            lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]
        return jsonify({"keywords": lines})
    except FileNotFoundError:
        return jsonify({"keywords": []})


@app.route("/api/blog-keywords", methods=["POST"])
def api_blog_keywords_update():
    data = get_json_body()
    keywords = data.get("keywords", [])
    if not isinstance(keywords, list):
        return jsonify({"error": "keywords must be an array"}), 400
    with open(BLOG_KEYWORDS_PATH, "w", encoding="utf-8") as f:
        f.write("# Blog SEO 키워드 — 학생/학부모 대상 (한 줄에 하나, #=주석)\n")
        for kw in keywords:
            f.write(f"{kw}\n")
    logger.info("Blog keywords updated: %d keywords", len(keywords))
    return jsonify({"ok": True, "count": len(keywords)})


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
# ── API: Weekly Summary ──
@app.route("/api/weekly-summary")
def api_weekly_summary():
    from datetime import timedelta
    queue = read_json(QUEUE_PATH) or {"posts": []}
    posts = queue.get("posts", [])
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # Posts published this week
    week_published = [p for p in posts if p.get("publishedAt") and datetime.fromisoformat(p["publishedAt"].replace("Z", "+00:00")) > week_ago]
    week_drafted = [p for p in posts if p.get("generatedAt") and datetime.fromisoformat(p["generatedAt"].replace("Z", "+00:00")) > week_ago and p.get("status") == "draft"]

    # Engagement this week
    total_views = sum((p.get("engagement") or {}).get("views", 0) for p in week_published)
    total_likes = sum((p.get("engagement") or {}).get("likes", 0) for p in week_published)
    total_replies = sum((p.get("engagement") or {}).get("replies", 0) for p in week_published)

    # Channel breakdown
    ch_breakdown = {"threads": 0, "x": 0}
    for p in week_published:
        ch = p.get("channels") or {}
        if ch.get("threads", {}).get("status") == "published":
            ch_breakdown["threads"] += 1
        if ch.get("x", {}).get("status") == "published":
            ch_breakdown["x"] += 1

    # Cron runs this week
    cron_data = read_json(CRON_JOBS_PATH) or {"jobs": []}
    cron_ok = sum(1 for j in cron_data.get("jobs", []) if j.get("state", {}).get("lastRunStatus") == "ok")
    cron_err = sum(1 for j in cron_data.get("jobs", []) if j.get("state", {}).get("lastRunStatus") == "error")

    return jsonify({
        "published": len(week_published),
        "drafted": len(week_drafted),
        "views": total_views,
        "likes": total_likes,
        "replies": total_replies,
        "engagementRate": round((total_likes + total_replies) / total_views * 100, 1) if total_views > 0 else 0,
        "channels": ch_breakdown,
        "cronOk": cron_ok,
        "cronErr": cron_err,
    })


# ── API: Token Status ──
@app.route("/api/token-status")
def api_token_status():
    import time as _time
    result = {"claude": None, "threads": None, "x": None}
    auth_path = CONFIG_DIR / "agents" / "main" / "agent" / "auth-profiles.json"
    auth = read_json(auth_path)
    if auth:
        for k, v in auth.get("profiles", {}).items():
            exp = v.get("expires", 0)
            remaining_h = (exp / 1000 - _time.time()) / 3600
            stats = auth.get("usageStats", {}).get(k, {})
            result["claude"] = {"profile": k, "type": v.get("type"), "expiresAt": exp, "remainingHours": round(remaining_h, 1), "healthy": remaining_h > 1, "errorCount": stats.get("errorCount", 0), "lastUsed": stats.get("lastUsed")}
    config = read_json(CONFIG_DIR / "openclaw.json") or {}
    plugins = config.get("plugins", {}).get("entries", {})
    tp = plugins.get("threads-publish", {})
    result["threads"] = {"connected": bool(tp.get("config", {}).get("accessToken", "")), "userId": tp.get("config", {}).get("userId", "")}
    xp = plugins.get("x-publish", {})
    result["x"] = {"connected": bool(xp.get("config", {}).get("apiKey", "")), "enabled": xp.get("enabled", False)}
    # LLM model info
    agents = config.get("agents", {}).get("defaults", {})
    model = agents.get("model", {})
    result["llm"] = {
        "primary": model.get("primary", "unknown"),
        "fallbacks": model.get("fallbacks", []),
        "auth": "Claude Code Max Plan (OAuth, auto-refresh)",
    }
    return jsonify(result)


# ── API: LLM Config ──
@app.route("/api/llm-config")
def api_llm_config():
    config = read_json(CONFIG_DIR / "openclaw.json") or {}
    agents = config.get("agents", {}).get("defaults", {})
    model = agents.get("model", {})

    # Per-job model overrides from cron jobs
    cron_data = read_json(CRON_JOBS_PATH) or {"jobs": []}
    job_models = {}
    for j in cron_data.get("jobs", []):
        job_models[j["name"]] = j.get("payload", {}).get("model") or model.get("primary", "")

    # Available models (hardcoded common ones, could be dynamic)
    available = [
        "anthropic/claude-opus-4-6", "anthropic/claude-opus-4-5",
        "anthropic/claude-sonnet-4-6", "anthropic/claude-sonnet-4-5",
        "anthropic/claude-haiku-4-5",
        "google/gemini-2.5-flash",
        "ollama/llama3.1:8b", "ollama/mistral:7b",
    ]

    return jsonify({
        "primary": model.get("primary", ""),
        "fallbacks": model.get("fallbacks", []),
        "jobModels": job_models,
        "available": available,
    })


@app.route("/api/llm-config", methods=["POST"])
def api_llm_config_update():
    data = get_json_body()
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path)
    if config is None:
        return jsonify({"error": "openclaw.json not found"}), 404

    agents = config.setdefault("agents", {}).setdefault("defaults", {})
    model = agents.setdefault("model", {})

    # Update primary model
    if "primary" in data and isinstance(data["primary"], str) and data["primary"].strip():
        model["primary"] = data["primary"].strip()

    # Update fallbacks
    if "fallbacks" in data and isinstance(data["fallbacks"], list):
        model["fallbacks"] = [f for f in data["fallbacks"] if isinstance(f, str) and f.strip()]

    # Update per-job model overrides
    if "jobModels" in data and isinstance(data["jobModels"], dict):
        cron_data = read_json(CRON_JOBS_PATH) or {"jobs": []}
        for j in cron_data.get("jobs", []):
            if j["name"] in data["jobModels"]:
                override = data["jobModels"][j["name"]]
                if override and override != model.get("primary", ""):
                    j.setdefault("payload", {})["model"] = override
                elif "model" in j.get("payload", {}):
                    del j["payload"]["model"]  # remove override = use default
        write_json(CRON_JOBS_PATH, cron_data)

    write_json(config_path, config)
    logger.info("LLM config updated: primary=%s", model.get("primary"))
    return jsonify({"ok": True, "primary": model.get("primary"), "fallbacks": model.get("fallbacks", [])})


@app.route("/api/channel-config")
def api_channel_config():
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path) or {}
    plugins = config.get("plugins", {}).get("entries", {})
    channels = {}
    # Threads
    tp = plugins.get("threads-publish", {})
    t_cfg = tp.get("config", {})
    t_token = t_cfg.get("accessToken", "")
    t_uid = t_cfg.get("userId", "")
    t_username = ""  # loaded lazily via /api/threads-username
    channels["threads"] = {"enabled": tp.get("enabled", False), "userId": t_uid, "username": t_username, "connected": bool(t_token), "keys": {"accessToken": t_token, "userId": t_uid}}
    # X
    xp = plugins.get("x-publish", {})
    x_cfg = xp.get("config", {})
    channels["x"] = {"enabled": xp.get("enabled", False), "connected": bool(x_cfg.get("apiKey", "")), "keys": {"apiKey": x_cfg.get("apiKey", ""), "apiKeySecret": x_cfg.get("apiKeySecret", ""), "accessToken": x_cfg.get("accessToken", ""), "accessTokenSecret": x_cfg.get("accessTokenSecret", "")}}

    # All other channels — check plugin config existence
    IMPLEMENTED_PLUGINS = {  # plugins that have extension code ready
        "facebook-publish", "bluesky-publish", "instagram-publish", "linkedin-publish",
        "pinterest-publish", "tumblr-publish", "tiktok-publish", "youtube-publish",
        "telegram-publish", "discord-publish", "line-publish", "naver-blog-publish",
    }
    other_channels = {
        "facebook": {"plugin": "facebook-publish", "key_field": "accessToken"},
        "bluesky": {"plugin": "bluesky-publish", "key_field": "handle"},
        "instagram": {"plugin": "instagram-publish", "key_field": "accessToken"},
        "linkedin": {"plugin": "linkedin-publish", "key_field": "accessToken"},
        "pinterest": {"plugin": "pinterest-publish", "key_field": "accessToken"},
        "tumblr": {"plugin": "tumblr-publish", "key_field": "consumerKey"},
        "tiktok": {"plugin": "tiktok-publish", "key_field": "accessToken"},
        "youtube": {"plugin": "youtube-publish", "key_field": "accessToken"},
        "telegram": {"plugin": "telegram-publish", "key_field": "botToken"},
        "discord": {"plugin": "discord-publish", "key_field": "webhookUrl"},
        "line": {"plugin": "line-publish", "key_field": "channelAccessToken"},
        "naver_blog": {"plugin": "naver-blog-publish", "key_field": "blogId"},
    }
    for ch_key, ch_info in other_channels.items():
        p = plugins.get(ch_info["plugin"], {})
        p_cfg = p.get("config", {})
        has_ext = ch_info["plugin"] in IMPLEMENTED_PLUGINS
        has_key = bool(p_cfg.get(ch_info["key_field"], ""))
        # Status: live (enabled+key), setup (key but not enabled), ready (ext exists, no key), soon (no ext)
        if has_key and p.get("enabled"):
            status = "live"
        elif has_key:
            status = "connected"
        elif has_ext:
            status = "available"
        else:
            status = "soon"
        channels[ch_key] = {"status": status, "enabled": p.get("enabled", False), "connected": has_key, "keys": {k: v for k, v in p_cfg.items() if isinstance(v, str)}}

    # Blog (dedu-blog)
    bp = plugins.get("dedu-blog", {})
    b_cfg = bp.get("config", {})
    b_email = b_cfg.get("email", "")
    channels["blog"] = {
        "enabled": bp.get("enabled", False),
        "connected": bool(b_email),
        "apiBaseUrl": b_cfg.get("apiBaseUrl", ""),
        "email": b_email,
        "password": b_cfg.get("password", ""),
        "keys": {k: v for k, v in b_cfg.items() if isinstance(v, str)},
    }

    return jsonify(channels)


@app.route("/api/threads-username")
def api_threads_username():
    config = read_json(CONFIG_DIR / "openclaw.json") or {}
    tp = config.get("plugins", {}).get("entries", {}).get("threads-publish", {}).get("config", {})
    t_token = tp.get("accessToken", "")
    if not t_token:
        return jsonify({"username": ""})
    try:
        import urllib.request
        url = f"https://graph.threads.net/v1.0/me?fields=username&access_token={t_token}"
        with urllib.request.urlopen(url, timeout=3) as resp:
            return jsonify({"username": json.loads(resp.read()).get("username", "")})
    except Exception:
        return jsonify({"username": ""})


# ── Channel Verification ──
def verify_channel(channel, cfg):
    """Verify credentials by making a real API call. Returns {verified, account, error}."""
    import urllib.request, urllib.error
    try:
        if channel == "threads":
            token = cfg.get("accessToken", "")
            if not token:
                return {"verified": False, "error": "Access Token is empty"}
            url = f"https://graph.threads.net/v1.0/me?fields=username&access_token={token}"
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read())
                return {"verified": True, "account": f"@{data.get('username', '')}"}

        elif channel == "bluesky":
            handle = cfg.get("handle", "")
            pw = cfg.get("appPassword", "")
            if not handle or not pw:
                return {"verified": False, "error": "Handle and App Password required"}
            req = urllib.request.Request("https://bsky.social/xrpc/com.atproto.server.createSession",
                data=json.dumps({"identifier": handle, "password": pw}).encode(),
                headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                return {"verified": True, "account": f"@{data.get('handle', '')}"}

        elif channel == "telegram":
            token = cfg.get("botToken", "")
            if not token:
                return {"verified": False, "error": "Bot Token is empty"}
            url = f"https://api.telegram.org/bot{token}/getMe"
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read())
                if data.get("ok"):
                    return {"verified": True, "account": f"@{data['result'].get('username', '')}"}
                return {"verified": False, "error": "Invalid bot token"}

        elif channel == "x":
            # X requires OAuth 1.0a signature — complex, skip for now
            # Just check if all 4 keys are present
            required = ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"]
            missing = [k for k in required if not cfg.get(k)]
            if missing:
                return {"verified": False, "error": f"Missing: {', '.join(missing)}"}
            return {"verified": True, "account": "(OAuth 1.0a keys saved)"}

        elif channel == "instagram":
            token = cfg.get("accessToken", "")
            user_id = cfg.get("userId", "")
            if not token:
                return {"verified": False, "error": "Access Token is empty"}
            if not user_id:
                return {"verified": False, "error": "User ID is empty"}
            url = f"https://graph.instagram.com/v21.0/{user_id}?fields=username&access_token={token}"
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read())
                return {"verified": True, "account": f"@{data.get('username', '')}"}

        elif channel == "facebook":
            token = cfg.get("accessToken", "")
            page_id = cfg.get("pageId", "")
            if not token or not page_id:
                return {"verified": False, "error": "Access Token and Page ID required"}
            url = f"https://graph.facebook.com/v21.0/{page_id}?fields=name&access_token={token}"
            with urllib.request.urlopen(url, timeout=5) as resp:
                data = json.loads(resp.read())
                return {"verified": True, "account": data.get("name", page_id)}

        elif channel == "discord":
            webhook_url = cfg.get("webhookUrl", "")
            if not webhook_url or not webhook_url.startswith("https://discord.com/api/webhooks/"):
                return {"verified": False, "error": "Invalid Discord Webhook URL"}
            return {"verified": True, "account": "(Webhook configured)"}

        else:
            # Generic: just check if any key has value
            has_any = any(v for v in cfg.values() if isinstance(v, str) and v.strip())
            return {"verified": has_any, "account": "" if not has_any else "(credentials saved)"}

    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:200]
        return {"verified": False, "error": f"API error ({e.code}): {body}"}
    except Exception as e:
        return {"verified": False, "error": str(e)[:200]}


@app.route("/api/channel-config/<channel>", methods=["POST"])
def api_channel_config_generic(channel):
    # Handle threads and x separately (they have custom logic)
    if channel == "threads":
        return api_channel_config_threads_impl()
    if channel == "x":
        return api_channel_config_x_impl()

    # Generic channel config save
    plugin_map = {
        "facebook": "facebook-publish", "bluesky": "bluesky-publish", "instagram": "instagram-publish",
        "linkedin": "linkedin-publish", "pinterest": "pinterest-publish", "tumblr": "tumblr-publish",
        "tiktok": "tiktok-publish", "youtube": "youtube-publish", "telegram": "telegram-publish",
        "discord": "discord-publish", "line": "line-publish", "naver_blog": "naver-blog-publish",
        "blog": "dedu-blog",
    }
    plugin_name = plugin_map.get(channel)
    if not plugin_name:
        return jsonify({"error": f"Unknown channel: {channel}"}), 400

    data = get_json_body()
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path)
    if config is None:
        return jsonify({"error": "openclaw.json not found"}), 404

    plugins = config.setdefault("plugins", {}).setdefault("entries", {})
    p = plugins.setdefault(plugin_name, {"enabled": False, "config": {}})
    if "config" not in p:
        p["config"] = {}
    updated = False
    for key, val in data.items():
        if isinstance(val, str) and val.strip():
            p["config"][key] = val.strip()
            updated = True
    # Verify credentials
    result = verify_channel(channel, p.get("config", {}))
    p["enabled"] = result.get("verified", False)
    write_json(config_path, config)
    logger.info("Channel %s config updated, verified=%s", channel, result.get("verified"))
    return jsonify({"ok": True, "enabled": p["enabled"], **result})


def api_channel_config_threads_impl():
    data = get_json_body()
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path)
    if config is None:
        return jsonify({"error": "openclaw.json not found"}), 404
    plugins = config.setdefault("plugins", {}).setdefault("entries", {})
    for pname in ["threads-publish", "threads-insights", "threads-search", "threads-growth"]:
        p = plugins.setdefault(pname, {"enabled": True, "config": {}})
        if "accessToken" in data and isinstance(data["accessToken"], str) and data["accessToken"].strip():
            p["config"]["accessToken"] = data["accessToken"].strip()
        if "userId" in data and isinstance(data["userId"], str) and data["userId"].strip():
            p["config"]["userId"] = data["userId"].strip()
    # Verify
    tp_cfg = plugins.get("threads-publish", {}).get("config", {})
    result = verify_channel("threads", tp_cfg)
    for pname in ["threads-publish", "threads-insights", "threads-search", "threads-growth"]:
        plugins.get(pname, {})["enabled"] = result.get("verified", False)
    write_json(config_path, config)
    logger.info("Threads config updated, verified=%s", result.get("verified"))
    return jsonify({"ok": True, **result})


def api_channel_config_x_impl():
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
    # Verify
    result = verify_channel("x", xp.get("config", {}))
    xp["enabled"] = result.get("verified", False)
    write_json(config_path, config)
    logger.info("X config updated, verified=%s", result.get("verified"))
    return jsonify({"ok": True, **result})


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


# ── API: SEO Settings ──
@app.route("/api/seo-settings")
def api_seo_settings():
    settings = read_json(SEO_SETTINGS_PATH)
    if settings is None:
        settings = {
            "googleSearchConsole": {"metaTag": "", "sitemapUrl": "", "registered": False},
            "naverSearchAdvisor": {"metaTag": "", "sitemapUrl": "", "registered": False},
        }
    return jsonify(settings)


@app.route("/api/seo-settings", methods=["POST"])
def api_seo_settings_update():
    data = get_json_body()
    write_json(SEO_SETTINGS_PATH, data)
    logger.info("SEO settings updated")
    return jsonify({"ok": True})


# ── API: GSC Service Account ──
GSC_KEY_PATH = DATA_DIR / "gsc-service-account.json"


@app.route("/api/gsc-config")
def api_gsc_config():
    key_data = read_json(GSC_KEY_PATH)
    if key_data is None:
        return jsonify({"configured": False, "email": ""})
    return jsonify({"configured": True, "email": key_data.get("client_email", "")})


@app.route("/api/gsc-config", methods=["POST"])
def api_gsc_config_update():
    data = get_json_body()
    key_json = data.get("keyJson", "")
    if not key_json:
        return jsonify({"error": "keyJson is required"}), 400
    try:
        parsed = json.loads(key_json) if isinstance(key_json, str) else key_json
        if "client_email" not in parsed or "private_key" not in parsed:
            return jsonify({"error": "Invalid service account JSON: missing client_email or private_key"}), 400
        write_json(GSC_KEY_PATH, parsed)
        logger.info("GSC service account configured: %s", parsed.get("client_email", ""))
        return jsonify({"ok": True, "email": parsed.get("client_email", "")})
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON format"}), 400


def _gsc_get_access_token(key_data, scope):
    """Get Google OAuth2 access token from service account key"""
    import urllib.request
    import time
    import base64
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import padding as asym_padding

    now = int(time.time())
    header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode()).rstrip(b"=")
    claim = base64.urlsafe_b64encode(json.dumps({
        "iss": key_data["client_email"],
        "scope": scope,
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now, "exp": now + 3600,
    }).encode()).rstrip(b"=")
    signing_input = header + b"." + claim
    pk = serialization.load_pem_private_key(key_data["private_key"].encode(), password=None)
    sig = pk.sign(signing_input, asym_padding.PKCS1v15(), hashes.SHA256())
    jwt_token = signing_input + b"." + base64.urlsafe_b64encode(sig).rstrip(b"=")

    token_req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=f"grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion={jwt_token.decode()}".encode(),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token_resp = urllib.request.urlopen(token_req, timeout=10)
    return json.loads(token_resp.read()).get("access_token")


@app.route("/api/gsc-index", methods=["POST"])
def api_gsc_index_request():
    key_data = read_json(GSC_KEY_PATH)
    if key_data is None:
        return jsonify({"error": "GSC service account not configured"}), 400
    data = get_json_body()
    url = data.get("url", "")
    if not url:
        return jsonify({"error": "url is required"}), 400
    try:
        import urllib.request
        access_token = _gsc_get_access_token(key_data, "https://www.googleapis.com/auth/indexing")
        index_req = urllib.request.Request(
            "https://indexing.googleapis.com/v3/urlNotifications:publish",
            data=json.dumps({"url": url, "type": "URL_UPDATED"}).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {access_token}"},
        )
        result = json.loads(urllib.request.urlopen(index_req, timeout=10).read())
        logger.info("GSC index requested: %s", url)
        return jsonify({"ok": True, "url": url, "result": result})
    except Exception as e:
        logger.error("GSC index request failed: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/gsc-analytics")
def api_gsc_analytics():
    """Fetch search analytics from Google Search Console"""
    key_data = read_json(GSC_KEY_PATH)
    if key_data is None:
        return jsonify({"error": "GSC service account not configured", "rows": []})
    site_url = request.args.get("site", "sc-domain:d-edu.site")
    days = int(request.args.get("days", "28"))
    dimension = request.args.get("dimension", "query")  # query or page

    try:
        import urllib.request
        access_token = _gsc_get_access_token(key_data, "https://www.googleapis.com/auth/webmasters.readonly")

        end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

        body = json.dumps({
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": [dimension],
            "rowLimit": 50,
        }).encode()
        api_url = f"https://www.googleapis.com/webmasters/v3/sites/{urllib.parse.quote(site_url, safe='')}/searchAnalytics/query"
        req = urllib.request.Request(api_url, data=body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        })
        resp = urllib.request.urlopen(req, timeout=15)
        result = json.loads(resp.read())

        rows = []
        total_clicks = 0
        total_impressions = 0
        for r in result.get("rows", []):
            clicks = r.get("clicks", 0)
            impressions = r.get("impressions", 0)
            total_clicks += clicks
            total_impressions += impressions
            rows.append({
                "key": r["keys"][0] if r.get("keys") else "",
                "clicks": clicks,
                "impressions": impressions,
                "ctr": round(r.get("ctr", 0) * 100, 1),
                "position": round(r.get("position", 0), 1),
            })

        avg_ctr = round((total_clicks / total_impressions * 100) if total_impressions > 0 else 0, 1)
        avg_position = round(sum(r["position"] for r in rows) / len(rows), 1) if rows else 0

        # Cache to file
        cache = {"fetchedAt": datetime.now(timezone.utc).isoformat(), "days": days, "dimension": dimension,
                 "totalClicks": total_clicks, "totalImpressions": total_impressions, "avgCtr": avg_ctr, "avgPosition": avg_position, "rows": rows}
        cache_path = DATA_DIR / "gsc-analytics.json"
        write_json(cache_path, cache)

        return jsonify(cache)
    except Exception as e:
        logger.error("GSC analytics failed: %s", e)
        # Return cached data if available
        cache_path = DATA_DIR / "gsc-analytics.json"
        cached = read_json(cache_path)
        if cached:
            cached["cached"] = True
            return jsonify(cached)
        return jsonify({"error": str(e), "rows": []})


# ── API: Naver Search Advisor (manual data) ──
NSA_DATA_PATH = DATA_DIR / "nsa-data.json"


@app.route("/api/nsa-data")
def api_nsa_data():
    data = read_json(NSA_DATA_PATH)
    if data is None:
        return jsonify({"clicks": 0, "impressions": 0, "ctr": 0, "position": 0, "keywords": [], "savedAt": None})
    return jsonify(data)


@app.route("/api/nsa-data", methods=["POST"])
def api_nsa_data_update():
    data = get_json_body()
    data["savedAt"] = datetime.now(timezone.utc).isoformat()
    write_json(NSA_DATA_PATH, data)
    logger.info("NSA data saved")
    return jsonify({"ok": True})


# ── API: Keyword Research Config ──
@app.route("/api/kw-planner-config")
def api_kw_planner_config():
    config = read_json(CONFIG_DIR / "openclaw.json") or {}
    seo_cfg = config.get("plugins", {}).get("entries", {}).get("seo-keywords", {}).get("config", {})
    has_id = bool(seo_cfg.get("naverClientId", "") or os.environ.get("NAVER_SEARCHAD_CLIENT_ID", ""))
    return jsonify({"configured": has_id})


@app.route("/api/kw-planner-config", methods=["POST"])
def api_kw_planner_config_update():
    data = get_json_body()
    client_id = data.get("clientId", "")
    client_secret = data.get("clientSecret", "")
    customer_id = data.get("customerId", "")
    if not client_id or not client_secret or not customer_id:
        return jsonify({"error": "All 3 fields required"}), 400
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path) or {}
    plugins = config.setdefault("plugins", {}).setdefault("entries", {})
    p = plugins.setdefault("seo-keywords", {"enabled": True, "config": {}})
    p["config"]["naverClientId"] = client_id
    p["config"]["naverClientSecret"] = client_secret
    p["config"]["naverCustomerId"] = customer_id
    p["enabled"] = True
    write_json(config_path, config)
    logger.info("Keyword Planner config saved")
    return jsonify({"ok": True})


@app.route("/api/naver-datalab-config")
def api_naver_datalab_config():
    has_id = bool(os.environ.get("NAVER_CLIENT_ID", ""))
    return jsonify({"configured": has_id})


@app.route("/api/naver-datalab-config", methods=["POST"])
def api_naver_datalab_config_update():
    data = get_json_body()
    client_id = data.get("clientId", "")
    client_secret = data.get("clientSecret", "")
    if not client_id or not client_secret:
        return jsonify({"error": "Client ID and Secret required"}), 400
    # Save to .env file
    env_path = Path(__file__).resolve().parent.parent / ".env"
    try:
        lines = []
        if env_path.exists():
            with open(env_path, "r") as f:
                lines = f.readlines()
        # Remove existing entries
        lines = [l for l in lines if not l.startswith("NAVER_CLIENT_ID=") and not l.startswith("NAVER_CLIENT_SECRET=")]
        lines.append(f"NAVER_CLIENT_ID={client_id}\n")
        lines.append(f"NAVER_CLIENT_SECRET={client_secret}\n")
        with open(env_path, "w") as f:
            f.writelines(lines)
        # Also set in current process
        os.environ["NAVER_CLIENT_ID"] = client_id
        os.environ["NAVER_CLIENT_SECRET"] = client_secret
        logger.info("Naver Datalab config saved")
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── API: Naver Keyword Research ──
@app.route("/api/keyword-research", methods=["POST"])
def api_keyword_research():
    """Analyze keywords via Naver Search Ad API"""
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path) or {}
    seo_cfg = config.get("plugins", {}).get("entries", {}).get("seo-keywords", {}).get("config", {})
    client_id = seo_cfg.get("naverClientId", "") or os.environ.get("NAVER_SEARCHAD_CLIENT_ID", "")
    client_secret = seo_cfg.get("naverClientSecret", "") or os.environ.get("NAVER_SEARCHAD_CLIENT_SECRET", "")
    customer_id = seo_cfg.get("naverCustomerId", "") or os.environ.get("NAVER_SEARCHAD_CUSTOMER_ID", "")

    if not client_id or not client_secret or not customer_id:
        return jsonify({"error": "네이버 검색광고 API 키가 설정되지 않았습니다. Settings에서 설정하거나 .env에 NAVER_SEARCHAD_* 환경변수를 추가하세요.", "results": []})

    data = get_json_body()
    keywords = data.get("keywords", [])
    if not keywords:
        return jsonify({"error": "keywords required", "results": []})

    try:
        import urllib.request
        import hmac
        import hashlib
        import base64
        import time

        timestamp = str(int(time.time() * 1000))
        method = "GET"
        uri = "/keywordstool"
        message = f"{timestamp}.{method}.{uri}"
        signature = base64.b64encode(hmac.new(client_secret.encode(), message.encode(), hashlib.sha256).digest()).decode()

        params = urllib.parse.urlencode({"hintKeywords": ",".join(keywords[:5]), "showDetail": "1"})
        req = urllib.request.Request(
            f"https://api.searchad.naver.com{uri}?{params}",
            headers={
                "X-Timestamp": timestamp,
                "X-API-KEY": client_id,
                "X-Customer": customer_id,
                "X-Signature": signature,
            }
        )
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())

        results = []
        for kw in result.get("keywordList", []):
            pc = int(kw.get("monthlyPcQcCnt", 0)) if isinstance(kw.get("monthlyPcQcCnt"), (int, float)) else 0
            mobile = int(kw.get("monthlyMobileQcCnt", 0)) if isinstance(kw.get("monthlyMobileQcCnt"), (int, float)) else 0
            results.append({
                "keyword": kw.get("relKeyword", ""),
                "pcSearches": pc,
                "mobileSearches": mobile,
                "totalSearches": pc + mobile,
                "competition": kw.get("compIdx", ""),
            })
        results.sort(key=lambda x: x["totalSearches"], reverse=True)
        logger.info("Keyword research: %d results for %s", len(results), keywords)
        return jsonify({"results": results, "total": len(results)})
    except Exception as e:
        logger.error("Keyword research failed: %s", e)
        return jsonify({"error": str(e), "results": []})


# ── API: Naver Datalab Trend ──
@app.route("/api/naver-trend", methods=["POST"])
def api_naver_trend():
    """Fetch search trend from Naver Datalab API"""
    client_id = os.environ.get("NAVER_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        return jsonify({"error": "네이버 개발자센터 API 키 필요: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (.env에 추가)", "results": []})

    data = get_json_body()
    keywords = data.get("keywords", [])
    if not keywords:
        return jsonify({"error": "keywords required", "results": []})

    try:
        import urllib.request
        end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        start_date = (datetime.now(timezone.utc) - timedelta(days=90)).strftime("%Y-%m-%d")

        body = json.dumps({
            "startDate": start_date,
            "endDate": end_date,
            "timeUnit": "week",
            "keywordGroups": [{"groupName": kw, "keywords": [kw]} for kw in keywords[:5]],
        }).encode()

        req = urllib.request.Request(
            "https://openapi.naver.com/v1/datalab/search",
            data=body,
            headers={
                "Content-Type": "application/json",
                "X-Naver-Client-Id": client_id,
                "X-Naver-Client-Secret": client_secret,
            }
        )
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())

        results = []
        for group in result.get("results", []):
            results.append({
                "title": group.get("title", ""),
                "data": [{"period": d.get("period", ""), "ratio": d.get("ratio", 0)} for d in group.get("data", [])],
            })
        return jsonify({"results": results})
    except Exception as e:
        logger.error("Naver trend failed: %s", e)
        return jsonify({"error": str(e), "results": []})


# ── API: Google Trends ──
@app.route("/api/google-trend", methods=["POST"])
def api_google_trend():
    """Fetch search trend — currently redirects to Google Trends web (no API key configured)"""
    # Google Trends API (Alpha) requires special access
    # For now, suggest using the web interface
    return jsonify({
        "error": "Google Trends API는 Alpha 단계입니다. trends.google.com/trends/explore?geo=KR 에서 직접 확인하세요.",
        "results": [],
        "webUrl": "https://trends.google.com/trends/explore?geo=KR&cat=958",
    })


# ── API: Google Analytics ──
GA_CONFIG_PATH = DATA_DIR / "ga-config.json"


@app.route("/api/ga-config")
def api_ga_config():
    cfg = read_json(GA_CONFIG_PATH)
    if cfg is None:
        return jsonify({"configured": False, "propertyId": ""})
    return jsonify({"configured": bool(cfg.get("propertyId")), "propertyId": cfg.get("propertyId", "")})


@app.route("/api/ga-config", methods=["POST"])
def api_ga_config_update():
    data = get_json_body()
    pid = data.get("propertyId", "")
    if not pid:
        return jsonify({"error": "propertyId required"}), 400
    write_json(GA_CONFIG_PATH, {"propertyId": pid})
    logger.info("GA config saved: %s", pid)
    return jsonify({"ok": True})


@app.route("/api/ga-analytics")
def api_ga_analytics():
    key_data = read_json(GSC_KEY_PATH)
    ga_cfg = read_json(GA_CONFIG_PATH)
    if key_data is None:
        return jsonify({"error": "Service account not configured"})
    if ga_cfg is None or not ga_cfg.get("propertyId"):
        return jsonify({"error": "GA4 Property ID not configured"})

    property_id = ga_cfg["propertyId"]
    days = int(request.args.get("days", "28"))

    try:
        import urllib.request
        access_token = _gsc_get_access_token(key_data, "https://www.googleapis.com/auth/analytics.readonly")

        end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

        # GA4 Data API - runReport
        body = json.dumps({
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "metrics": [
                {"name": "sessions"},
                {"name": "screenPageViews"},
                {"name": "averageSessionDuration"},
                {"name": "bounceRate"},
            ],
            "dimensions": [{"name": "sessionDefaultChannelGroup"}],
            "limit": 20,
        }).encode()

        api_url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"
        req = urllib.request.Request(api_url, data=body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        })
        resp = urllib.request.urlopen(req, timeout=15)
        result = json.loads(resp.read())

        total_sessions = 0
        total_pageviews = 0
        sources = []
        for row in result.get("rows", []):
            source = row["dimensionValues"][0]["value"]
            sessions = int(row["metricValues"][0]["value"])
            pageviews = int(row["metricValues"][1]["value"])
            total_sessions += sessions
            total_pageviews += pageviews
            sources.append({"source": source, "sessions": sessions, "pageviews": pageviews})
        sources.sort(key=lambda x: x["sessions"], reverse=True)

        # Get totals from first row metadata or sum
        totals = result.get("totals", [{}])
        avg_duration = "0"
        bounce_rate = "0"
        if totals and totals[0].get("metricValues"):
            avg_duration = str(round(float(totals[0]["metricValues"][2]["value"]), 1))
            bounce_rate = str(round(float(totals[0]["metricValues"][3]["value"]) * 100, 1))

        # Page-level report
        page_body = json.dumps({
            "dateRanges": [{"startDate": start_date, "endDate": end_date}],
            "metrics": [{"name": "screenPageViews"}, {"name": "averageSessionDuration"}],
            "dimensions": [{"name": "pagePath"}],
            "dimensionFilter": {"filter": {"fieldName": "pagePath", "stringFilter": {"matchType": "CONTAINS", "value": "/community/column"}}},
            "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
            "limit": 20,
        }).encode()
        page_req = urllib.request.Request(api_url, data=page_body, headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}",
        })
        page_resp = urllib.request.urlopen(page_req, timeout=15)
        page_result = json.loads(page_resp.read())

        pages = []
        for row in page_result.get("rows", []):
            pages.append({
                "path": row["dimensionValues"][0]["value"],
                "views": int(row["metricValues"][0]["value"]),
                "avgDuration": round(float(row["metricValues"][1]["value"]), 1),
            })

        return jsonify({
            "totalSessions": total_sessions,
            "totalPageviews": total_pageviews,
            "avgDuration": avg_duration,
            "bounceRate": bounce_rate,
            "sources": sources,
            "pages": pages,
            "days": days,
        })
    except Exception as e:
        logger.error("GA analytics failed: %s", e)
        return jsonify({"error": str(e)})


# ── API: Blog Image Upload (proxy to d-edu presigned URL) ──
@app.route("/api/blog-upload-image", methods=["POST"])
def api_blog_upload_image():
    """Upload image URL to d-edu via presigned URL, return mediaId"""
    config_path = CONFIG_DIR / "openclaw.json"
    config = read_json(config_path) or {}
    blog_cfg = config.get("plugins", {}).get("entries", {}).get("dedu-blog", {}).get("config", {})
    api_base = blog_cfg.get("apiBaseUrl", "")
    email = blog_cfg.get("email", "")
    password = blog_cfg.get("password", "")
    if not api_base or not email:
        return jsonify({"error": "Blog not configured"}), 400

    data = get_json_body()
    image_url = data.get("imageUrl", "")
    if not image_url:
        return jsonify({"error": "imageUrl is required"}), 400

    try:
        import urllib.request

        # Login to d-edu
        login_data = json.dumps({"email": email, "password": password}).encode()
        login_req = urllib.request.Request(f"{api_base}/api/auth/login", login_data, {"Content-Type": "application/json"})
        login_resp = urllib.request.urlopen(login_req, timeout=10)
        cookie = login_resp.headers.get("Set-Cookie", "")
        import re as _re
        auth_match = _re.search(r"Authorization=([^;]+)", cookie)
        if not auth_match:
            return jsonify({"error": "d-edu login failed"}), 500
        auth_token = auth_match.group(1)
        auth_headers = {"Cookie": f"Authorization={auth_token}", "Content-Type": "application/json"}

        # Download image (follow redirects)
        img_req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
        img_resp = urllib.request.urlopen(img_req, timeout=30)
        img_data = img_resp.read()
        content_type = img_resp.headers.get("Content-Type", "image/png").split(";")[0].strip()
        if content_type not in ("image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"):
            content_type = "image/png"
        from pathlib import PurePosixPath
        fname = PurePosixPath(urllib.parse.urlparse(image_url).path).name or f"image-{int(__import__('time').time())}.png"
        if not fname.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg")):
            ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}.get(content_type, ".png")
            fname = f"image-{int(__import__('time').time())}{ext}"
        logger.info("Blog image download: %s (%d bytes, %s)", fname, len(img_data), content_type)

        # Presign
        presign_body = json.dumps({"mediaAssetList": [{"fileName": fname, "contentType": content_type, "sizeBytes": len(img_data)}]}).encode()
        presign_req = urllib.request.Request(f"{api_base}/api/common/media/presign-batch", presign_body, auth_headers)
        presign_resp = urllib.request.urlopen(presign_req, timeout=10)
        presign_result = json.loads(presign_resp.read())
        asset = presign_result["data"]["mediaAssetList"][0]
        media_id = asset["mediaId"]
        logger.info("Blog image presign OK: %s", media_id)

        # Upload to S3
        upload_req = urllib.request.Request(asset["uploadUrl"], img_data, method="PUT")
        upload_req.add_header("Content-Type", content_type)
        for k, v in asset.get("headers", {}).items():
            upload_req.add_header(k, v)
        urllib.request.urlopen(upload_req, timeout=30)

        logger.info("Blog image uploaded: %s → %s", fname, media_id)
        return jsonify({"ok": True, "mediaId": media_id, "fileName": fname})
    except Exception as e:
        logger.error("Blog image upload failed: %s", e)
        return jsonify({"error": str(e)}), 500


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

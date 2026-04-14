"use client";

import type { SetupGuide } from "@/types/channel";

export const setupGuides: Record<string, SetupGuide> = {
  threads: {
    fields: ["accessToken", "userId"],
    labels: ["Access Token", "User ID"],
    quick: [
      "developers.facebook.com > Threads API 앱 생성",
      "Long-lived Access Token 발급",
      "User ID 확인",
      "위 폼에 입력 후 Connect",
    ],
    detail:
      "Access Token으로 Threads에 글을 발행합니다. Long-lived Token은 60일 유효이며 갱신이 필요합니다. User ID는 Threads 사용자 고유 번호입니다.",
  },
  x: {
    fields: ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"],
    labels: ["소비자 키 (API Key)", "소비자 시크릿 (API Key Secret)", "액세스 토큰 (Access Token)", "액세스 토큰 시크릿 (Access Token Secret)"],
    quick: [
      '<a href="https://developer.x.com" target="_blank" class="text-blue-400 hover:underline">developer.x.com</a> &gt; Dashboard &gt; Create App',
      'App Settings &gt; <strong class="text-gray-300">User authentication settings</strong> &gt; Edit<div class="ml-4 mt-0.5 text-gray-500">- App permissions: <strong class="text-gray-300">Read and write</strong><br>- Type of App: Web App<br>- Website URL: https://example.com<br>- Callback URL: https://example.com/callback</div>',
      'Keys and tokens &gt; <strong class="text-gray-300">소비자 키</strong> &gt; 재생성 &gt; Key + Secret 복사',
      'Keys and tokens &gt; <strong class="text-gray-300">액세스 토큰</strong> &gt; 생성 (Read+Write) &gt; Token + Secret 복사',
      "왼쪽 폼에 4개 키 입력 &gt; Connect",
    ],
    detail: "* 권한 변경 후 반드시 액세스 토큰을 재생성해야 합니다",
  },
  facebook: {
    fields: ["accessToken", "pageId"],
    labels: ["Page Access Token", "Page ID"],
    quick: [
      "developers.facebook.com 접속 > 앱 만들기",
      "Use cases > Facebook Login 추가",
      "Settings > Page Access Token 발급",
      "Page ID 확인 (페이지 정보에서)",
      "위 폼에 입력 후 Connect",
    ],
    detail:
      "Access Token으로 Facebook Page에 글을 발행합니다. Page Access Token은 페이지 관리자 권한이 필요하며, 60일 유효 (long-lived). Page ID는 페이지 고유 번호입니다.",
  },
  bluesky: {
    fields: ["handle", "appPassword"],
    labels: ["Handle (예: user.bsky.social)", "App Password"],
    quick: [
      "bsky.app 로그인",
      "Settings > App Passwords",
      "새 비밀번호 생성 > 이름 입력 > 생성",
      "Handle과 생성된 비밀번호를 위 폼에 입력",
    ],
    detail:
      "Bluesky는 AT Protocol 기반 오픈 소셜 네트워크입니다. App Password는 계정 비밀번호 대신 사용하는 앱 전용 비밀번호로, 언제든 폐기 가능합니다. API 사용은 무료이며 승인 불필요.",
  },
  instagram: {
    fields: ["accessToken", "userId"],
    labels: ["Graph API Access Token", "Instagram Business User ID"],
    quick: [
      "Instagram을 Business 또는 Creator 계정으로 전환 (프로필 > 설정 > 프로페셔널 계정)",
      "Facebook Page 생성 후 Instagram 계정과 연결",
      "developers.facebook.com > 앱 만들기 (비즈니스 유형)",
      "Instagram Graph API + Instagram Content Publishing 제품 추가",
      "테스터 등록: 앱 역할 > Instagram Testers에 자기 계정 추가 → Instagram 앱에서 수락",
      "Graph API Explorer에서 instagram_basic + instagram_content_publish 권한으로 토큰 생성",
      "⚠️ User ID 찾기: Graph API Explorer에서 GET /me/accounts → 페이지 ID 확인 → GET /{페이지ID}?fields=instagram_business_account → 그 안의 id가 User ID (앱 ID와 다름!)",
    ],
    detail:
      "⚠️ 주의: 앱 ID ≠ User ID. 앱 ID(숫자)를 넣으면 에러 납니다. 반드시 instagram_business_account.id를 넣으세요.\n\n앱 시크릿(App Secret)은 대시보드에 입력 불필요 — 장기 토큰 교환 시에만 사용.\n\nAccess Token만 입력하면 됩니다. 테스터 모드에서는 App Review 없이 자기 계정에 발행 가능.\n\n토큰 유효기간: 단기 1시간, 장기 60일.\n\n지원: 단일 이미지, 캐러셀(카드뉴스 2~10장), 릴스(영상 URL).",
  },
  linkedin: {
    fields: ["accessToken", "personUrn"],
    labels: ["OAuth 2.0 Access Token", "Person URN (urn:li:person:xxx)"],
    quick: [
      "LinkedIn Partner Program 신청 (learn.microsoft.com/linkedin)",
      "승인 후 앱 생성 > OAuth 2.0 설정",
      "Access Token 발급",
      "Person URN 확인 (API /v2/me 호출)",
    ],
    detail:
      "LinkedIn은 Partner Program 승인이 필요합니다. 자가 신청 후 승인 기간이 불확실합니다. Person URN은 urn:li:person:xxxx 형태의 사용자 고유 식별자.",
  },
  pinterest: {
    fields: ["accessToken", "boardId"],
    labels: ["OAuth 2.0 Access Token", "Board ID"],
    quick: [
      "developers.pinterest.com > 앱 생성",
      "OAuth 2.0 토큰 발급",
      "대상 Board의 ID 확인",
      "위 폼에 입력",
    ],
    detail:
      "Pinterest Content API v5는 오픈 액세스 (승인 불필요). Pin 생성 시 이미지가 필수입니다. Board ID는 핀을 저장할 보드의 고유 번호.",
  },
  tumblr: {
    fields: ["consumerKey", "consumerSecret", "accessToken", "accessTokenSecret", "blogName"],
    labels: ["Consumer Key", "Consumer Secret", "Access Token", "Access Token Secret", "Blog Name"],
    quick: [
      "tumblr.com/oauth/apps > 앱 등록",
      "OAuth Consumer Key/Secret 발급",
      "Access Token 발급 (OAuth 1.0a)",
      "Blog Name 입력 (예: myblog.tumblr.com)",
    ],
    detail:
      "Tumblr는 X(Twitter)와 같은 OAuth 1.0a 방식입니다. Consumer Key는 앱 식별, Consumer Secret은 요청 서명, Access Token/Secret은 사용자 인증에 사용됩니다.",
  },
  tiktok: {
    fields: ["accessToken"],
    labels: ["OAuth Access Token"],
    quick: [
      "developers.tiktok.com > 앱 생성",
      "Content Posting API 권한 신청",
      "앱 심사 제출 (심사 전 비공개 포스트만 가능)",
      "심사 통과 후 Access Token 발급",
    ],
    detail:
      "TikTok은 앱 심사가 필수입니다. 심사 전에는 모든 포스트가 비공개로만 생성됩니다. 영상/사진 콘텐츠 위주이며, 15건/일 제한.",
  },
  youtube: {
    fields: ["accessToken"],
    labels: ["Google OAuth 2.0 Access Token"],
    quick: [
      "console.cloud.google.com > YouTube Data API v3 활성화",
      "OAuth 2.0 클라이언트 생성 > Access Token 발급",
      "영상 업로드만 가능 (커뮤니티 글 API 미지원)",
    ],
    detail:
      "YouTube Data API는 영상 업로드에 사용됩니다. 커뮤니티 글 작성 API는 공식적으로 존재하지 않습니다. 일일 10,000 quota units 제한.",
  },
  telegram: {
    fields: ["botToken", "chatId"],
    labels: ["Bot Token (@BotFather에서 발급)", "Chat ID (선택 — 알림 발송용)"],
    quick: [
      "Telegram에서 @BotFather 검색 > /newbot 명령",
      "봇 이름 + username 설정 > Bot Token 복사",
      "양방향 대화만 할 경우: Bot Token만 입력하면 완료",
      "알림도 받으려면: Chat ID 입력 (아래 '더 알아보기' 참고)",
    ],
    detail:
      "Bot Token\n@BotFather에게 /newbot 하면 발급되는 봇 전용 비밀번호입니다. 무료.\n\nChat ID란?\n봇이 '알림'을 보낼 장소입니다.\n- 없으면: 내가 봇에게 먼저 말해야 대화 가능\n- 있으면: 봇이 먼저 알림을 보낼 수 있음 (바이럴 감지, 주간 리포트 등)\n\nChat ID 확인하는 법\n1. 봇에게 아무 메시지를 보냅니다\n2. 브라우저에서 아래 주소 접속:\n   https://api.telegram.org/bot여기에토큰/getUpdates\n3. 결과에서 \"chat\":{\"id\": 숫자} ← 이 숫자가 Chat ID\n\n또는 Telegram에서 @RawDataBot 에게 메시지 보내면 바로 Chat ID를 알려줍니다.\n\n양방향 대화\nSettings > Interactive Chat에서 Bot Token을 설정하면, 봇에게 '이번 주 성과 보여줘' 같은 명령을 보낼 수 있습니다.",
  },
  discord: {
    fields: ["webhookUrl"],
    labels: ["Webhook URL"],
    quick: [
      "Discord 서버 > 채널 설정 > 연동",
      "웹후크 > 새 웹후크 만들기",
      "이름 설정 > URL 복사",
      "위 폼에 URL 붙여넣기",
    ],
    detail:
      "Discord Webhook은 가장 간단한 연동 방식입니다. URL 하나만으로 메시지를 보낼 수 있으며, 별도 인증이 필요 없습니다. 보내기만 가능 (읽기 불가).",
  },
  slack: {
    fields: ["webhookUrl"],
    labels: ["Incoming Webhook URL"],
    quick: [
      "api.slack.com/apps 접속 (docs.slack.dev로 리디렉션 시 api.slack.com/apps 직접 입력)",
      "Create New App > From scratch > 이름 + Workspace 선택",
      "왼쪽 메뉴 Incoming Webhooks > 활성화 (ON)",
      "Add New Webhook to Workspace > 메시지 받을 채널 선택 > Allow",
      "생성된 Webhook URL 복사 (https://hooks.slack.com/...) > 위 폼에 붙여넣기",
    ],
    detail:
      "Slack '앱'은 Workspace에 기능을 추가하는 단위입니다. 봇, Webhook, 슬래시 명령어 등을 묶어서 관리합니다. 여기서는 Incoming Webhook만 사용합니다 — 앱을 만들면 Webhook URL이 생성되고, 이 URL로 POST 요청을 보내면 지정 채널에 메시지가 표시됩니다. Slack mrkdwn 포맷 지원. 양방향 대화가 필요하면 Bot Token + App Token이 추가로 필요합니다 (Settings > Interactive Chat 참고).",
  },
  line: {
    fields: ["channelAccessToken"],
    labels: ["Channel Access Token (long-lived)"],
    quick: [
      "developers.line.biz > LINE Official Account 생성",
      "Messaging API 활성화",
      "Channel Access Token (long-lived) 발급",
      "위 폼에 입력",
    ],
    detail:
      "LINE Messaging API는 브로드캐스트(전체 발송) 방식입니다. 무료 500건/월, 이후 건당 과금. Channel Access Token은 장기 유효 토큰.",
  },
  naver_blog: {
    fields: ["blogId", "username", "apiKey"],
    labels: ["Blog ID", "네이버 Username", "API Key (XML-RPC)"],
    quick: [
      "네이버 블로그 관리 > 글쓰기 API 설정",
      "Blog ID, Username 확인",
      "XML-RPC API Key 발급",
      "위 폼에 입력",
    ],
    detail:
      "네이버 블로그는 공식 REST API가 없습니다. 레거시 XML-RPC 방식으로 발행하며, 안정성이 보장되지 않습니다. 비공식 방식.",
  },
  kakao: {
    fields: ["restApiKey", "channelId"],
    labels: ["REST API Key", "Channel ID"],
    quick: ["Setup guide가 아직 준비되지 않았습니다."],
    detail: "",
  },
  whatsapp: {
    fields: ["accessToken", "phoneNumberId"],
    labels: ["Access Token", "Phone Number ID"],
    quick: ["Setup guide가 아직 준비되지 않았습니다."],
    detail: "",
  },
  midjourney: {
    fields: ["discordToken", "channelId", "serverId"],
    labels: ["Discord Token (유저 토큰)", "Channel ID (미드저니 봇 채널)", "Server ID (Discord 서버)"],
    quick: [
      '<a href=\'https://midjourney.com/app\' target=\'_blank\' class=\'text-blue-400\'>midjourney.com/app</a>에서 구독 확인 (Basic 이상)',
      'Discord 설정 > 고급 > <strong>개발자 모드</strong> ON',
      '미드저니 봇이 있는 서버 이름 우클릭 > <strong>서버 ID 복사</strong>',
      '미드저니 봇이 있는 채널 우클릭 > <strong>채널 ID 복사</strong>',
      'Discord Token 발급: <a href=\'https://discord.com/app\' target=\'_blank\' class=\'text-blue-400\'>discord.com/app</a> 접속 (브라우저) > F12 > Console 탭 > 아래 코드 붙여넣기 후 Enter:<br><code class=\'bg-gray-800 px-1 rounded text-[9px] break-all\'>(function(){const o=XMLHttpRequest.prototype.setRequestHeader;XMLHttpRequest.prototype.setRequestHeader=function(n,v){if(n.toLowerCase()===\'authorization\')console.log(\'[Token]\',v);return o.apply(this,arguments)}})()</code><br>실행 후 Discord에서 아무 채널 클릭 → Console에 <code class=\'bg-gray-800 px-1 rounded\'>[Token] MTxx...</code> 출력됨',
      "위 폼에 3개 값 입력 후 Connect",
    ],
    detail:
      "Midjourney Discord 연동으로 /imagine 명령을 자동 전송하고 생성된 이미지를 수집합니다.\n\n⚠️ Discord 유저 토큰 사용 — Discord TOS 위반 리스크가 있습니다. 자동화 속도를 제한하여 사용하세요.\n\nDiscord Token이란?\n봇 토큰이 아닌 '유저 토큰'입니다. 브라우저에서 Discord에 로그인한 상태에서 개발자 콘솔로 추출합니다.\n\n다른 방법으로 Token 찾기:\n1. discord.com/app > F12 > Network 탭 > Fetch/XHR 필터 > 아무 요청 클릭 > Headers > Authorization 값\n2. F12 > Application > Local Storage > discord.com > 'token' 검색\n\nChannel ID / Server ID:\n개발자 모드를 ON하면 우클릭 메뉴에 'ID 복사' 항목이 생깁니다.\n\n이미지 생성 시간: 30~90초. 자동 업스케일 지원.\nMidjourney 구독 필요 (Basic $10/월, Standard $30/월).",
  },
};

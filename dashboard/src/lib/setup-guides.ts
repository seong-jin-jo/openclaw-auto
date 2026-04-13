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
      "Instagram을 Business 또는 Creator 계정으로 전환",
      "Facebook Page 생성 후 Instagram 계정과 연결",
      "developers.facebook.com > 앱 만들기 (비즈니스 유형)",
      "Instagram Graph API + Instagram Content Publishing 제품 추가",
      "테스터 등록: 앱 역할 > Instagram Testers에 자기 계정 추가",
      "Graph API Explorer에서 토큰 생성",
      "User ID 찾기: GET /{페이지ID}?fields=instagram_business_account",
    ],
    detail:
      "주의: 앱 ID와 User ID는 다릅니다. 반드시 instagram_business_account.id를 넣으세요.\n\n앱 시크릿(App Secret)은 대시보드에 입력 불필요 — 장기 토큰 교환 시에만 사용.\n\n토큰 유효기간: 단기 1시간, 장기 60일.\n\n지원: 단일 이미지, 캐러셀(카드뉴스 2~10장), 릴스(영상 URL).",
  },
  linkedin: {
    fields: ["accessToken", "personUrn"],
    labels: ["OAuth 2.0 Access Token", "Person URN (urn:li:person:xxx)"],
    quick: [
      "LinkedIn Partner Program 신청",
      "승인 후 앱 생성 > OAuth 2.0 설정",
      "Access Token 발급",
      "Person URN 확인 (API /v2/me 호출)",
    ],
    detail:
      "LinkedIn은 Partner Program 승인이 필요합니다. Person URN은 urn:li:person:xxxx 형태의 사용자 고유 식별자.",
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
      "Telegram 앱에서 @BotFather 검색 > 대화 시작",
      "/newbot 입력 > 봇 이름/username 입력",
      "Bot Token (긴 문자열) 복사 > 위 폼에 붙여넣기",
      "알림도 받고 싶으면: Chat ID도 입력 (더 알아보기 참고)",
    ],
    detail:
      "Bot Token\nTelegram에서 @BotFather에게 /newbot 명령을 보내면 봇이 만들어지고 Token이 발급됩니다.\nToken은 봇의 비밀번호 같은 것입니다. 무료.\n\n내 봇 찾는 법\n@BotFather와 대화한 곳에 봇 username이 나와있습니다 (예: @my_marketing_bot).\nTelegram 검색창에서 그 이름을 검색하면 봇이 나옵니다.\n\nChat ID란?\n봇이 알림을 보낼 대상(나 또는 그룹)의 고유 번호입니다.\n- Bot Token만 있으면: 내가 봇에게 먼저 말해야 대화 가능\n- Chat ID도 있으면: 봇이 먼저 알림을 보낼 수 있음 (바이럴, 에러, 주간 리포트)\n\nChat ID 확인하는 법 (가장 쉬운 방법)\n1. Telegram 검색창에서 @RawDataBot 검색\n2. 대화 시작 > 아무 메시지 보내기\n3. 봇이 응답한 메시지에서 'Chat id' 숫자를 복사\n4. 위 폼 Chat ID에 붙여넣기\n\n단체방에서 사용\n봇을 그룹에 초대하면 그룹 멤버 누구나 봇에게 명령할 수 있습니다.\n그룹의 Chat ID는 보통 -100으로 시작하는 숫자입니다.\n\n양방향 대화 (Interactive Chat)\nSettings > Interactive Chat에서 Bot Token을 설정하면\n봇에게 '이번 주 성과 보여줘' 같은 자연어 명령을 보낼 수 있습니다.\nAgent가 Tool을 호출하고 결과를 Telegram으로 응답합니다.\n대시보드 없이 모바일에서 마케팅 관리 가능.",
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
      "api.slack.com/apps 접속",
      "Create New App > From scratch > 이름 + Workspace 선택",
      "왼쪽 메뉴 Incoming Webhooks > 활성화 (ON)",
      "Add New Webhook to Workspace > 채널 선택 > Allow",
      "생성된 Webhook URL 복사 > 위 폼에 붙여넣기",
    ],
    detail:
      "Slack '앱'은 Workspace에 기능을 추가하는 단위입니다. 여기서는 Incoming Webhook만 사용합니다 — 앱을 만들면 Webhook URL이 생성되고, 이 URL로 POST 요청을 보내면 지정 채널에 메시지가 표시됩니다. 양방향 대화가 필요하면 Bot Token + App Token이 추가로 필요합니다 (Settings > Interactive Chat 참고).",
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
};

import { redirect } from 'next/navigation';

export default function SignupRedirect() {
  // Google OAuth 단일 인증 — 가입/로그인 모두 동일 화면(/login)의 "Google로 계속" 버튼 하나로 처리.
  redirect('/login');
}

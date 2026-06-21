import { redirect } from 'next/navigation';

export default function SignupRedirect() {
  // /signup 진입 시 /login?mode=signup 으로 보내서 동일 폼에서 가입 모드 사용
  redirect('/login?mode=signup');
}

import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "개인정보처리방침 | OSMU 마케팅 자동화" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="개인정보처리방침"
      summary="정성컴퍼니(이하 ‘회사’)는 OSMU 마케팅 자동화 서비스를 제공하면서 이용자의 개인정보를 필요한 범위에서만 처리합니다."
    >
      <LegalSection title="1. 수집하는 정보">
        <ul className="list-disc space-y-micro pl-stack-section">
          <li>Google 로그인 정보: 이메일 주소, 표시 이름, 프로필 이미지, 인증 서비스 사용자 식별자</li>
          <li>연결한 소셜 계정 정보: 플랫폼 계정 식별자, 사용자명, 표시 이름, 승인 범위, 액세스·갱신 토큰</li>
          <li>Meta 플랫폼 데이터: 연결한 계정의 프로필과 본인 게시물, Threads 답글과 Instagram 댓글, 게시물·계정 성과 지표, OSMU를 통해 발행한 콘텐츠와 발행 결과</li>
          <li>서비스 이용 정보: 작성한 초안, 예약·발행 기록, 업로드한 이미지·영상, 오류 및 보안 로그</li>
          <li>분석 정보: 이용자가 분석 쿠키에 동의한 경우 방문 경로와 기능 이용 이벤트</li>
        </ul>
        <p className="mt-stack-tight">회사는 소셜 플랫폼 비밀번호를 수집하거나 저장하지 않습니다. 로그인과 동의는 각 플랫폼의 공식 화면에서 처리됩니다.</p>
      </LegalSection>
      <LegalSection title="2. 이용 목적">
        <p>회원 인증과 작업 공간 생성, 소셜 계정 연결, 콘텐츠 생성·예약·발행, 성과 확인, 고객 지원, 보안 사고 및 오류 대응을 위해 정보를 이용합니다.</p>
        <div className="mt-stack-tight overflow-x-auto">
          <table className="w-full min-w-xl text-left text-caption">
            <thead><tr className="border-b border-border"><th className="py-stack-tight pr-stack">처리 목적별 Meta 권한</th><th className="py-stack-tight">서비스에서 하는 일</th></tr></thead>
            <tbody>
              <tr className="border-b border-border"><td className="py-stack-tight pr-stack">기본 계정·콘텐츠 읽기</td><td className="py-stack-tight">연결 계정을 식별하고 본인 게시물을 표시합니다.</td></tr>
              <tr className="border-b border-border"><td className="py-stack-tight pr-stack">콘텐츠 발행</td><td className="py-stack-tight">이용자가 승인한 콘텐츠를 연결한 Threads 또는 Instagram 계정에 게시합니다.</td></tr>
              <tr className="border-b border-border"><td className="py-stack-tight pr-stack">성과 지표</td><td className="py-stack-tight">본인 게시물과 계정의 성과를 대시보드에 표시합니다.</td></tr>
              <tr><td className="py-stack-tight pr-stack">답글·댓글 관리</td><td className="py-stack-tight">본인 게시물의 답글과 댓글을 표시하고, 이용자가 지시한 답글 작성·숨김 등 지원 동작을 수행합니다.</td></tr>
            </tbody>
          </table>
        </div>
      </LegalSection>
      <LegalSection title="3. 보유 기간과 삭제">
        <ul className="list-disc space-y-micro pl-stack-section">
          <li>소셜 액세스·갱신 토큰과 계정 연결 정보: 연결 해제 또는 삭제 요청 시까지</li>
          <li>초안, 예약·발행 기록, 업로드 파일, 성과·답글·댓글 데이터: 이용자가 삭제하거나 회원 탈퇴·삭제를 요청할 때까지</li>
          <li>오류·보안 로그: 보안 사고 대응과 서비스 안정성 확인에 필요한 기간 동안</li>
        </ul>
        <p className="mt-stack-tight">소셜 연결을 해제하면 해당 연결 토큰과 계정 연결 정보를 삭제합니다. 법령상 보존 의무가 있는 기록은 정해진 기간 동안 분리 보관한 뒤 삭제하며, 백업 사본은 정기 보존 주기에 따라 만료됩니다.</p>
      </LegalSection>
      <LegalSection title="4. 처리 위탁 및 외부 서비스">
        <p>서비스 제공을 위해 Supabase(인증·데이터베이스), 호스팅·모니터링 사업자, AI 생성 서비스, 이용자가 직접 연결한 Meta·Google·X·TikTok 등 소셜 플랫폼을 사용할 수 있습니다. 각 플랫폼 전송은 이용자가 선택한 기능과 승인 범위 안에서만 이루어집니다. 회사는 Meta 플랫폼 데이터를 판매하지 않습니다. 법령상 의무가 있거나 이용자가 요청한 기능을 수행하는 경우를 제외하고 제3자에게 제공하지 않습니다.</p>
      </LegalSection>
      <LegalSection title="5. 보호 조치와 작업 공간 격리">
        <p>토큰은 암호화해 저장하고, 인증 정보에서 작업 공간을 결정하며, 다른 작업 공간의 계정·콘텐츠를 조회하거나 발행에 사용할 수 없도록 접근을 분리합니다. 전송 구간에는 HTTPS를 사용합니다.</p>
      </LegalSection>
      <LegalSection title="6. 이용자의 권리">
        <p>이용자는 자신의 정보 조회·정정·삭제, 소셜 연결 해제, 분석 동의 철회를 요청할 수 있습니다. 대시보드에서 연결을 해제하거나 <a className="text-accent underline" href="/data-deletion">데이터 삭제 안내</a>에 따라 <a className="text-accent underline" href="mailto:code0to1@gmail.com">code0to1@gmail.com</a>으로 요청해 주세요.</p>
      </LegalSection>
      <LegalSection title="7. 문의">
        <p>개인정보 관련 문의와 삭제 요청: 정성컴퍼니, <a className="text-accent underline" href="mailto:code0to1@gmail.com">code0to1@gmail.com</a></p>
      </LegalSection>
    </LegalPage>
  );
}

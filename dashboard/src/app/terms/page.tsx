import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "이용약관 | OSMU 마케팅 자동화" };

export default function TermsPage() {
  return (
    <LegalPage title="이용약관" summary="본 약관은 정성컴퍼니가 제공하는 OSMU 마케팅 자동화 서비스의 이용 조건을 정합니다.">
      <LegalSection title="1. 서비스 내용">
        <p>회사는 Google 로그인, 브랜드 콘텐츠 생성·관리, 소셜 계정 OAuth 연결, 예약·자동 발행, 성과 확인 기능을 제공합니다. 베타 기능과 지원 플랫폼은 운영 상황에 따라 변경될 수 있습니다.</p>
      </LegalSection>
      <LegalSection title="2. 계정과 권한">
        <p>이용자는 본인이 관리 권한을 가진 Google 계정과 소셜 계정만 연결해야 합니다. 이용자는 연결 시 표시되는 권한 범위를 확인하고 동의하며, 언제든 서비스 또는 소셜 플랫폼에서 연결을 해제할 수 있습니다.</p>
      </LegalSection>
      <LegalSection title="3. 이용자의 책임">
        <p>이용자는 게시 전 콘텐츠와 대상 계정을 확인해야 하며, 타인의 권리 침해, 허위·불법 콘텐츠, 스팸, 플랫폼 정책을 위반하는 자동화를 해서는 안 됩니다. 계정 보안과 게시 결과에 대한 최종 책임은 이용자에게 있습니다.</p>
      </LegalSection>
      <LegalSection title="4. 서비스 제한">
        <p>보안 위협, 정책 위반, 과도한 호출, 플랫폼 API 장애·심사·한도, 정기 점검이 발생하면 일부 기능을 제한하거나 중단할 수 있습니다. 회사는 가능한 경우 상태와 복구 방법을 안내합니다.</p>
      </LegalSection>
      <LegalSection title="5. 지식재산권">
        <p>이용자가 입력하거나 업로드한 자료와 생성 결과에 대한 권리는 관련 법령과 사용한 AI·소셜 플랫폼의 약관을 따릅니다. 이용자는 서비스 제공에 필요한 범위에서만 회사에 처리 권한을 부여합니다.</p>
      </LegalSection>
      <LegalSection title="6. 책임의 범위">
        <p>회사는 고의 또는 중대한 과실이 없는 한 외부 플랫폼 장애, 계정 제재, API 변경, 이용자가 승인한 게시 내용으로 발생한 간접 손해를 책임지지 않습니다. 관련 법령이 우선 적용되는 경우에는 해당 법령을 따릅니다.</p>
      </LegalSection>
      <LegalSection title="7. 문의 및 약관 변경">
        <p>문의는 <a className="text-accent underline" href="mailto:code0to1@gmail.com">code0to1@gmail.com</a>으로 접수합니다. 중요한 변경은 시행 전에 서비스 화면을 통해 알립니다.</p>
      </LegalSection>
    </LegalPage>
  );
}

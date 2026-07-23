import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "데이터 삭제 안내 | OSMU 마케팅 자동화" };

export default function DataDeletionPage() {
  return (
    <LegalPage title="데이터 삭제 안내" summary="OSMU에 저장된 계정 연결과 서비스 데이터를 삭제하는 방법입니다.">
      <LegalSection title="소셜 계정 연결만 삭제">
        <ol className="list-decimal space-y-1 pl-5">
          <li>OSMU에 로그인합니다.</li>
          <li>해당 채널의 Settings에서 연결된 계정을 확인합니다.</li>
          <li>삭제 버튼을 눌러 연결 토큰과 계정 연결 정보를 제거합니다.</li>
          <li>필요하면 해당 소셜 플랫폼의 앱·웹사이트 설정에서도 OSMU 접근 권한을 제거합니다.</li>
        </ol>
      </LegalSection>
      <LegalSection title="전체 계정과 데이터 삭제 요청">
        <p><a className="text-accent underline" href="mailto:code0to1@gmail.com?subject=OSMU%20데이터%20삭제%20요청">code0to1@gmail.com</a>으로 가입한 Google 이메일 주소와 “OSMU 데이터 삭제 요청”을 보내 주세요. 본인 확인 후 tenant, 소셜 연결 토큰, 초안, 예약·발행 기록, 업로드 파일을 삭제합니다.</p>
      </LegalSection>
      <LegalSection title="처리 기간">
        <p>요청 접수 후 30일 이내에 처리 결과를 회신합니다. 법령상 보존 의무가 있는 자료는 분리 보관 후 보존 기간이 끝나면 삭제합니다. 백업 사본은 정기 보존 주기에 따라 안전하게 만료됩니다.</p>
      </LegalSection>
      <LegalSection title="Meta 앱 데이터 삭제">
        <p>Facebook 또는 Instagram 설정의 앱 및 웹사이트에서 OSMU 접근 권한을 제거한 뒤 위 이메일로 삭제를 요청할 수 있습니다. 연결 해제 시 OSMU에 저장된 해당 Meta 액세스 토큰과 연결 정보가 제거됩니다.</p>
      </LegalSection>
    </LegalPage>
  );
}

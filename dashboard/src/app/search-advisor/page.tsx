import { BackButton } from "@/components/shared/BackButton";

export default function SearchAdvisorPage() {
  return (
    <div className="px-region py-stack-section">
      <BackButton />
      <div className="mb-stack-section">
        <h2 className="text-subheading font-bold text-text">Search Advisor</h2>
        <p className="text-caption text-subtle mt-micro">네이버 서치어드바이저 검색 성과 데이터</p>
      </div>
      <div className="card p-region text-center">
        <p className="text-body-sm font-medium text-muted">고객별 Search Advisor 저장소 준비 중</p>
        <p className="text-caption text-subtle mt-stack-tight">
          전역 파일을 고객 간 공유하지 않도록 tenant 저장소가 준비될 때까지 조회·입력을 비활성화했습니다.
        </p>
      </div>
    </div>
  );
}

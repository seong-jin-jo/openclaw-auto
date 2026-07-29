import { BackButton } from "@/components/shared/BackButton";

export default function NaverTrendsPage() {
  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <BackButton />
        <h2 className="text-xl font-bold text-text">Naver Trends</h2>
        <p className="text-xs text-subtle mt-1">네이버 데이터랩 검색어 트렌드 (최근 90일)</p>
      </div>

      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-muted">고객별 Naver DataLab 연결 준비 중</p>
        <p className="text-xs text-subtle mt-2">
          전역 API 키를 고객 요청에 사용하지 않도록 tenant credential 연결 전까지 조회를 비활성화했습니다.
        </p>
      </div>
    </div>
  );
}

import { BackButton } from "@/components/shared/BackButton";

export default function GoogleAnalyticsPage() {
  return (
    <div className="px-8 py-6">
      <BackButton />
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text">Google Analytics</h2>
        <p className="text-xs text-subtle mt-1">GA4 사이트 트래픽 분석</p>
      </div>
      <div className="card p-8 text-center">
        <p className="text-sm font-medium text-muted">고객별 GA4 연결 준비 중</p>
        <p className="text-xs text-subtle mt-2">
          현재 GA4 서비스 계정은 전역 운영 자격증명이므로 고객 화면에서 조회하지 않습니다.
        </p>
      </div>
    </div>
  );
}

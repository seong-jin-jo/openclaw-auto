"use client";

export default function GoogleTrendsPage() {
  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Google Trends</h2>
        <p className="text-xs text-gray-500 mt-1">Google Trends 데이터 확인</p>
      </div>

      <div className="card p-6 text-center">
        <p className="text-sm text-gray-400 mb-3">
          Google Trends API는 현재 Alpha 단계로 직접 연동이 불가합니다.
        </p>
        <p className="text-xs text-gray-500 mb-4">
          아래 링크에서 트렌드를 확인하세요. 교육 카테고리가 기본 설정되어 있습니다.
        </p>
        <a
          href="https://trends.google.com/trends/explore?geo=KR&cat=958"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Google Trends 열기
        </a>
      </div>

      <div className="card p-4 mt-6">
        <h3 className="text-sm font-medium text-gray-300 mb-3">활용 가이드</h3>
        <ul className="text-xs text-gray-500 space-y-2">
          <li>• 타겟 키워드의 검색량 추이를 확인하여 시즌별 콘텐츠 전략 수립</li>
          <li>• "관련 검색어"에서 떠오르는 키워드를 Keyword Bank에 추가</li>
          <li>• 지역별 관심도를 확인하여 타겟 지역 콘텐츠 제작</li>
          <li>• Naver Trends와 비교하여 플랫폼별 검색 패턴 차이 분석</li>
        </ul>
      </div>
    </div>
  );
}

// src/pages/landing/LandingPage.jsx

// 랜딩 전용 컴포넌트들
import NoticeStrip          from './components/NoticeStrip';
import HeroSearchBand       from './components/HeroSearchBand';
import VisualSlider         from './components/VisualSlider';
import PopularAuctionSidebar from './components/PopularAuctionSidebar';
import CategoryStrip        from './components/CategoryStrip';
import AuctionCardRail      from './components/AuctionCardRail';
import QuickActions         from './components/QuickActions';

// ──────────────────────────────────────────
// 더미 데이터 (실제 API 연동 시 교체)
// ──────────────────────────────────────────
const LATEST_AUCTIONS = [
  { id: 1, title: '아이폰 14 Pro 256GB',      price: '612,000원', bidCount: 38, badge: '방금 등록', badgeClass: 'badge-success' },
  { id: 2, title: '맥북 에어 M2',              price: '810,000원', bidCount: 31, badge: '신규',      badgeClass: 'badge-success' },
  { id: 3, title: '소니 미러리스 바디',        price: '430,000원', bidCount: 29, badge: '신규',      badgeClass: 'badge-success' },
  { id: 4, title: '원목 식탁 의자 4개 세트',  price: '45,000원',  bidCount:  2, badge: '신규',      badgeClass: 'badge-success' },
  { id: 5, title: '미니 보온 텀블러 세트',    price: '28,000원',  bidCount:  6, badge: '신규',      badgeClass: 'badge-success' },
];

const DEADLINE_AUCTIONS = [
  { id: 6,  title: '아이패드 프로 12.9',   price: '612,000원', bidCount: 38, badge: '종료 임박', badgeClass: 'badge-danger' },
  { id: 7,  title: '패브릭 2인 소파',      price: '145,000원', bidCount: 31, badge: '종료 임박', badgeClass: 'badge-danger' },
  { id: 8,  title: '아우디 Q6 e-tron',     price: '810,000원', bidCount: 42, badge: '종료 임박', badgeClass: 'badge-danger' },
  { id: 9,  title: '스마트워치 브라운 밴드', price: '201,000원', bidCount: 18, badge: '종료 임박', badgeClass: 'badge-danger' },
];

const SERVICE_REQUESTS = [
  { id: 1, category: '청소',     title: '입주 전 투룸 전체 청소 요청',   location: '서울 마포구',   date: '6월 28일 오전 희망', maxPrice: '160,000원', quoteCount: 0, deadline: 'D-5', badge: '방금 등록' },
  { id: 2, category: '이사·운반', title: '원룸 소형 이사 운반 도움 요청', location: '서울 성동구 → 마포구', date: '엘리베이터 있음', maxPrice: '180,000원', quoteCount: 1, deadline: 'D-4', badge: '신규' },
  { id: 3, category: '수리·설치', title: '벽걸이 선반 설치 가능하신 분',  location: '경기 성남시',   date: '타공 4곳, 선반 2개',  maxPrice: '70,000원',  quoteCount: 2, deadline: 'D-3', badge: '신규' },
  { id: 4, category: '레슨·상담', title: '초등 수학 주 2회 방문 레슨',   location: '서울 송파구',   date: '평일 저녁 가능',      maxPrice: '240,000원', quoteCount: 3, deadline: 'D-6', badge: '신규' },
  { id: 5, category: '기타',     title: '행사 전단지 배포 도움 요청',   location: '서울 강남구',   date: '2시간 단기 작업',     maxPrice: '60,000원',  quoteCount: 1, deadline: 'D-2', badge: '신규' },
];

// ──────────────────────────────────────────
// LandingPage
// ──────────────────────────────────────────
const LandingPage = () => {
  return (
    <>
      {/* 1. 상단 공지 띠 */}
      <NoticeStrip
        badge="중요"
        text="서비스 점검 안내 · 6월 22일 02:00~04:00 포인트 충전 및 환전 메뉴 점검"
        link="/customersupport/notice"
      />

      {/* 2. 메인 검색창 */}
      <HeroSearchBand />

      {/* 3. 히어로 그리드 (비주얼 슬라이드 + 인기 경매 사이드바) */}
      <section className="container" style={{ marginTop: '28px' }}>
        <div className="home-hero-grid">
          <VisualSlider />
          <PopularAuctionSidebar />
        </div>

        {/* 4. 카테고리 스트립 */}
        <CategoryStrip />
      </section>

      {/* 5. 카드 레일 섹션들 */}
      <section
        className="container"
        style={{ marginTop: '36px', marginBottom: '56px' }}
      >
        {/* 최신 등록 경매 */}
        <AuctionCardRail
          railId="latestRail"
          title="최신 등록 경매"
          moreHref="/auction"
          items={LATEST_AUCTIONS}
        />

        {/* 마감임박 경매 */}
        <AuctionCardRail
          railId="deadlineRail"
          title="마감임박 경매"
          subtitle="곧 종료되는 경매를 놓치지 마세요."
          moreHref="/auction"
          items={DEADLINE_AUCTIONS}
        />

        {/* 최신 서비스 요청 */}
        <AuctionCardRail
          railId="serviceRequestRail"
          title="최신 등록 서비스 요청"
          moreHref="/services"
          items={SERVICE_REQUESTS}
          isRequest
        />
      </section>

      {/* 6. 플로팅 퀵 액션 */}
      <QuickActions />
    </>
  );
};

export default LandingPage;

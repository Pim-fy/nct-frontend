// src/pages/service/serviceRequestWizardSteps.js
// 서비스 요청서 카테고리별 단계별 선택 데이터 (F-SVC-002)
// 데이터 출처: 20260713 카테고리 세부 설정.xlsx — 시트8 오른쪽 확정 시트 4개(이사,청소 / 레슨 정리 /
// 설치_수리_정리 / 인테리어_정리)를 직접 열어 셀 값을 대조해 작성함 (260727).
// 종남6 목업(팀전달_목업_서비스신청_카테고리선택_260727.html)은 설계 참고용으로만 썼고, 목업이
// 확정 시트와 다른 부분(청소 "이사청소"·"특수" 분류, 인테리어 4분기 구조 등)은 시트 기준으로 바로잡음.
// 엔진이 단일 next만 지원해(뒤 단계가 앞선 선택 하나에만 갈리는 구조), 실제로는 여러 단계 뒤에서
// 갈리는 필드도 최대한 앞으로 당겨와 분기시켰다 — 필드 구성 자체는 시트 그대로.

// DB CATEGORY.CAT_NM(이사/청소/설치·수리/인테리어/레슨) → 이어지는 첫 단계 id
export const CATEGORY_NEXT_STEP = {
  '이사': 'mv_building',
  '청소': 'cl_class',
  '설치·수리': 'ir_class',
  '인테리어': 'it_class',
  '레슨': 'ls_class',
};

// 카테고리 선택 카드에 쓰는 부제·색상 (목업 category 단계 옵션의 sub 그대로,
// color는 마이페이지 대시보드 통계카드(MyPageDashboard StatCard)와 같은 팔레트로 맞춤)
export const CATEGORY_META = {
  '이사': { sub: '포장 · 반포장 · 일반 · 보관', color: '#0064ff' },
  '청소': { sub: '가정 · 사업장 (입주/정기/부분)', color: '#0d9488' },
  '설치·수리': { sub: '가전 · 가구 · 수도/보일러/전기', color: '#d97706' },
  '인테리어': { sub: '종합 · 부분 시공', color: '#776bf8' },
  '레슨': { sub: '취미 · 자기계발 · 과외', color: '#e63946' },
};

// step.next가 이 값이면 요약(제출) 단계로 진행
export const WIZARD_END = null;

export const WIZARD_STEPS = {
  /* ── 이사 (정리본 '이사,청소' 시트) ── */
  mv_building: {
    title: '건물 유형', desc: '현재 살고 계신(짐이 있는) 건물 유형을 선택해 주세요.',
    type: 'single', next: 'mv_type',
    options: [
      { label: '원룸' }, { label: '빌라·연립' }, { label: '주택' },
      { label: '아파트' }, { label: '오피스텔' }, { label: '상가' },
    ],
  },
  mv_type: {
    title: '이사 방식', type: 'single', next: 'mv_size',
    options: [
      { label: '포장이사', sub: '고수가 전부 포장·정리' },
      { label: '반포장이사', sub: '작은 짐은 직접, 큰 짐은 고수가' },
      { label: '일반이사', sub: '포장은 직접, 고수는 운반만' },
      { label: '보관이사', sub: '보관 후 입주일에 맞춰 운반', next: 'mv_storage' },
    ],
  },
  mv_storage: {
    title: '보관 희망 기간', type: 'single', next: 'mv_size',
    options: [
      { label: '1주 이내' }, { label: '2주 이내' }, { label: '1개월 이내' }, { label: '1개월 이상' },
    ],
  },
  mv_size: {
    title: '평수·거주 인원',
    type: 'form', next: 'mv_appliance',
    layout: 'row',
    fields: [
      { key: '평수', type: 'text', placeholder: '예: 8평', required: true, requireDigit: true, tooltip: '평수를 모를땐 예상평수로 기입해주세요.' },
      { key: '거주 인원', type: 'text', placeholder: '예: 1명', required: true, requireDigit: true },
    ],
  },
  mv_appliance: {
    title: '옮길 가전 (복수 선택)', desc: '대형 가전 선택 시 사다리차 견적을 위해 사진 첨부를 요청할 수 있어요.',
    type: 'multi', next: 'mv_furniture',
    options: [
      { label: '없음' }, { label: '냉장고' }, { label: '김치냉장고' }, { label: '에어컨' },
      { label: '세탁기' }, { label: 'TV' }, { label: '컴퓨터' }, { label: '전자레인지' },
      { label: '정수기' }, { label: '스타일러' }, { label: '기타' },
    ],
  },
  mv_furniture: {
    title: '옮길 가구 (복수 선택)',
    type: 'multi', next: 'mv_route',
    options: [
      { label: '없음' }, { label: '침대' }, { label: '소파' }, { label: '옷장' },
      { label: '책상' }, { label: '수납장' }, { label: '책장' }, { label: '화장대' },
      { label: '피아노' }, { label: '기타' },
    ],
  },
  mv_route: {
    title: '출발지·도착지',
    type: 'form', next: 'mv_date',
    fields: [
      { key: '출발지 주소', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'origin_addr' },
      { key: '출발지 상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'origin_addr', wide: true, required: true },
      { key: '출발지 층수', type: 'text', placeholder: '예: 3층', row: 'origin_floor', required: true },
      { key: '출발지 엘리베이터', type: 'choice', options: ['있음', '없음'], row: 'origin_floor', required: true },
      { key: '도착지 주소', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'dest_addr' },
      { key: '도착지 상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'dest_addr', wide: true, required: true },
      { key: '도착지 층수', type: 'text', placeholder: '예: 5층', row: 'dest_floor', required: true },
      { key: '도착지 엘리베이터', type: 'choice', options: ['있음', '없음'], row: 'dest_floor', required: true },
    ],
  },
  mv_date: {
    title: '이사 희망일',
    type: 'form', next: 'mv_extra',
    fields: [
      { key: '희망일', type: 'calendar', embed: ['날짜 협의', '시간대'], required: true },
      { key: '날짜 협의', type: 'choice', options: ['협의 가능', '협의 불가'], required: true },
      { key: '시간대', type: 'choice', options: ['오전', '오후', '저녁', '협의 가능'], required: true },
    ],
  },
  mv_extra: {
    title: '추가 옵션 (복수 선택)',
    type: 'multi', next: 'budget',
    options: [
      { label: '없음' }, { label: '폐가전·폐가구 처리' }, { label: '청소 서비스 연계' },
      { label: '포장재 회수' }, { label: '에어컨 이전 설치' },
    ],
  },

  /* ── 청소 (확정 시트 '이사,청소' 1-1 가정 / 1-2 사업장 재검증 반영, 260727)
     시트상 가정·사업장 모두 유형은 입주/정기/부분청소 3종뿐 — "이사청소"·"특수"(준공/화재/곰팡이)는
     시트 근거 없음(목업에만 있던 항목이라 제거). 정기청소만 "공간 항목" 대신 "청소 구역 항목"을 받음.
     엔진이 단일 next만 지원해 뒤에서 갈리는 부분을 앞으로 당겨왔다(순서만 조정, 필드는 시트 그대로). ── */
  cl_class: {
    title: '청소 분류', type: 'single',
    options: [
      { label: '가정', sub: '입주 · 정기 · 부분청소', next: 'cl_home_type' },
      { label: '사업장', sub: '입주 · 정기 · 부분청소', next: 'cl_biz_type' },
    ],
  },
  cl_home_type: {
    title: '청소 유형', type: 'single',
    options: [
      { label: '입주청소', sub: '입주 전 전체 청소', next: 'cl_home_space' },
      { label: '정기청소', sub: '주기적 방문 청소', next: 'cl_home_zone' },
      { label: '부분청소', sub: '특정 공간만 청소', next: 'cl_home_space' },
    ],
  },
  cl_home_space: {
    title: '공간 항목 (복수 선택)', type: 'multi', next: 'cl_home_building',
    options: [
      { label: '해당없음' }, { label: '베란다 확장' }, { label: '복층형 구조' },
      { label: '야외 테라스' }, { label: '기타' },
    ],
  },
  cl_home_zone: {
    title: '청소 구역 (복수 선택)', type: 'multi', next: 'cl_home_building',
    options: [
      { label: '욕실' }, { label: '주방' }, { label: '거실' },
      { label: '방' }, { label: '드레스룸' }, { label: '기타' },
    ],
  },
  cl_home_building: {
    title: '건물 유형', type: 'single', next: 'cl_home_region',
    options: [
      { label: '원룸' }, { label: '빌라·연립' }, { label: '주택' },
      { label: '아파트' }, { label: '오피스텔' },
    ],
  },
  cl_home_region: {
    title: '지역',
    type: 'form', next: 'cl_home_size',
    fields: [
      { key: '지역', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'cl_home_addr' },
      { key: '지역 상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'cl_home_addr', wide: true, required: true },
      { key: '층수', type: 'text', placeholder: '예: 3층', row: 'cl_home_addr', required: true, compact: true },
    ],
  },
  cl_home_size: {
    title: '공간 정보', type: 'form', next: 'cl_home_furniture',
    fields: [
      { key: '평수', type: 'text', placeholder: '예: 24평', required: true, requireDigit: true, row: 'size_line1', wide: true },
      { key: '방 개수', type: 'text', placeholder: '예: 3개', required: true, requireDigit: true, row: 'size_line1', wide: true },
      { key: '화장실 개수', type: 'text', placeholder: '예: 2개', required: true, requireDigit: true, row: 'size_line2', wide: true },
      { key: '베란다 개수', type: 'text', placeholder: '예: 1개', required: true, requireDigit: true, row: 'size_line2', wide: true },
    ],
  },
  cl_home_furniture: {
    title: '가구 항목 (복수 선택)', type: 'multi', next: 'cl_home_extra',
    options: [
      { label: '없음' }, { label: '의자' }, { label: '소파' }, { label: '책상' },
      { label: '매트리스' }, { label: '붙박이장' }, { label: '기타' },
    ],
  },
  cl_home_extra: {
    title: '추가 서비스 (복수 선택)', type: 'multi', next: 'cl_home_date',
    options: [
      { label: '없음' }, { label: '곰팡이 제거' }, { label: '외부 유리창 청소' },
      { label: '새집증후군 제거' }, { label: '스티커·시트지 제거' }, { label: '기타' },
    ],
  },
  cl_home_date: {
    title: '희망일', type: 'form', next: 'budget',
    fields: [
      { key: '희망일', type: 'calendar', embed: ['날짜 협의', '시간 협의'], required: true },
      { key: '날짜 협의', type: 'choice', options: ['협의 가능', '협의 불가'], required: true },
      { key: '시간 협의', type: 'choice', options: ['오전', '오후', '저녁', '협의 가능'], required: true },
    ],
  },

  cl_biz_type: {
    title: '청소 유형', type: 'single',
    options: [
      { label: '입주청소', sub: '입주 전 전체 청소', next: 'cl_biz_space' },
      { label: '정기청소', sub: '주기적 방문 청소', next: 'cl_biz_zone' },
      { label: '부분청소', sub: '특정 공간만 청소', next: 'cl_biz_space' },
    ],
  },
  cl_biz_space: {
    title: '공간 항목 (복수 선택)', type: 'multi', next: 'cl_biz_building',
    options: [
      { label: '해당없음' }, { label: '복층형 구조' }, { label: '야외 테라스' }, { label: '기타' },
    ],
  },
  cl_biz_zone: {
    title: '청소 구역 (복수 선택)', type: 'multi', next: 'cl_biz_building',
    options: [
      { label: '주방' }, { label: '방' }, { label: '화장실' }, { label: '기타' },
    ],
  },
  cl_biz_building: {
    title: '건물 유형', type: 'single', next: 'cl_biz_region',
    options: [
      { label: '사무실' }, { label: '상가' }, { label: '오피스텔' },
      { label: '숙박시설(호텔·모텔·펜션)' },
    ],
  },
  cl_biz_region: {
    title: '지역',
    type: 'form', next: 'cl_biz_size',
    fields: [
      { key: '지역', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'cl_biz_addr' },
      { key: '지역 상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'cl_biz_addr', wide: true, required: true },
      { key: '층수', type: 'text', placeholder: '예: 3층', row: 'cl_biz_addr', required: true, compact: true },
    ],
  },
  cl_biz_size: {
    title: '공간 정보', type: 'form', next: 'cl_biz_furniture',
    fields: [
      { key: '평수', type: 'text', placeholder: '예: 40평', required: true, requireDigit: true, row: 'size_line1', wide: true },
      { key: '방 개수', type: 'text', placeholder: '예: 3개', required: true, requireDigit: true, row: 'size_line1', wide: true },
      { key: '화장실 개수', type: 'text', placeholder: '예: 2개', required: true, requireDigit: true, row: 'size_line2', wide: true },
    ],
  },
  cl_biz_furniture: {
    title: '가구 항목 (복수 선택)', type: 'multi', next: 'cl_biz_extra',
    options: [
      { label: '없음' }, { label: '의자' }, { label: '소파' }, { label: '쿠션' }, { label: '책상' }, { label: '기타' },
    ],
  },
  cl_biz_extra: {
    title: '추가 서비스 (복수 선택)', type: 'multi', next: 'cl_biz_date',
    options: [
      { label: '없음' }, { label: '곰팡이 제거' }, { label: '외부 유리창 청소' },
      { label: '새집증후군 제거' }, { label: '스티커·시트지 제거' }, { label: '기타' },
    ],
  },
  cl_biz_date: {
    title: '희망일', type: 'form', next: 'budget',
    fields: [
      { key: '희망일', type: 'calendar', embed: ['날짜 협의', '시간 협의'], required: true },
      { key: '날짜 협의', type: 'choice', options: ['협의 가능', '협의 불가'], required: true },
      { key: '시간 협의', type: 'choice', options: ['오전', '오후', '저녁', '협의 가능'], required: true },
    ],
  },

  /* ── 설치·수리 (확정 시트 '설치_수리_정리' 재검증 반영, 260727)
     품목별로 "종류"·"브랜드/추가서비스/용량" 선택지가 다 달라 시트 그대로 품목별 하위 단계를 분리했다.
     (엔진이 단일 next만 지원해 품목 분기를 먼저 태우고 공통 단계로 다시 모이게 구성) ── */
  ir_class: {
    title: '어떤 작업이 필요하세요?', type: 'single',
    options: [
      { label: '가전제품', sub: '설치 · 수리 · 이전설치 · 철거', next: 'ir_ap_product' },
      { label: '가구', sub: '조립 · 이동 · 수리/리폼', next: 'ir_fn_service' },
      { label: '수도/보일러/전기', sub: '설치 · 교체 · 수리', next: 'ir_pb_kind' },
    ],
  },
  ir_ap_product: {
    title: '제품 선택', type: 'single',
    options: [
      { label: '냉장고', next: 'ir_ap_kind_fridge' },
      { label: '벽걸이 TV', next: 'ir_ap_kind_tv' },
      { label: '에어컨', next: 'ir_ap_kind_ac' },
      { label: '세탁기', next: 'ir_ap_kind_washer' },
    ],
  },
  ir_ap_kind_fridge: {
    title: '종류', type: 'single', next: 'ir_ap_brand_fridge',
    options: [{ label: '양문형' }, { label: '일반형' }, { label: '김치냉장고' }, { label: '쇼케이스' }],
  },
  ir_ap_brand_fridge: {
    title: '브랜드', type: 'single', next: 'ir_ap_service',
    options: [{ label: '삼성' }, { label: 'LG' }, { label: '캐리어' }, { label: '위니아' }],
  },
  ir_ap_kind_tv: {
    title: '종류', type: 'single', next: 'ir_ap_extra_tv',
    options: [
      { label: '브라켓 보유' }, { label: '고정형' }, { label: '상하좌우이동형' }, { label: '상하이동형' },
    ],
  },
  ir_ap_extra_tv: {
    title: '추가 서비스', type: 'single', next: 'ir_ap_service',
    options: [
      { label: '셋톱박스·공유기 숨김' }, { label: '랜선·전선 매립' },
      { label: 'LED 벽시계 설치' }, { label: '인공지능 셋톱박스 설치' },
    ],
  },
  ir_ap_kind_ac: {
    title: '종류', type: 'single', next: 'ir_ap_brand_ac',
    options: [
      { label: '2in1' }, { label: '벽걸이형' }, { label: '스탠드형' }, { label: '천장형(시스템에어컨)' },
    ],
  },
  ir_ap_brand_ac: {
    title: '브랜드', type: 'single', next: 'ir_ap_service',
    options: [{ label: '삼성' }, { label: 'LG' }, { label: '캐리어' }, { label: '위니아' }],
  },
  ir_ap_kind_washer: {
    title: '종류', type: 'single', next: 'ir_ap_capacity_washer',
    options: [
      { label: '일반세탁기(통돌이)' }, { label: '드럼세탁기' },
      { label: '트윈워시·플렉스워시' }, { label: '미니·아기용 세탁기' },
    ],
  },
  ir_ap_capacity_washer: {
    title: '용량', type: 'single', next: 'ir_ap_service',
    options: [{ label: '5kg 이하' }, { label: '6~9kg' }, { label: '10~14kg' }, { label: '기타' }],
  },
  ir_ap_service: {
    title: '원하는 서비스', type: 'single', next: 'ir_ap_space',
    options: [
      { label: '설치' }, { label: '수리' }, { label: '이전 설치' }, { label: '해체·철거' },
    ],
  },
  ir_ap_space: {
    title: '사용 공간', type: 'single', next: 'ir_extra',
    options: [
      { label: '가정집' }, { label: '사무공간' }, { label: '상업공간' },
    ],
  },

  ir_fn_service: {
    title: '원하는 서비스', type: 'single',
    options: [
      { label: '가구 조립·설치', next: 'ir_fn_kind_assemble' },
      { label: '가구 이동·재배치', next: 'ir_fn_move' },
      { label: '가구 수리·리폼', next: 'ir_fn_kind_repair' },
    ],
  },
  ir_fn_kind_assemble: {
    title: '가구 종류 (복수 선택)', type: 'multi', next: 'ir_fn_qty_price',
    options: [
      { label: '침대' }, { label: '옷장' }, { label: '선반' }, { label: '시스템장' },
      { label: '책상' }, { label: '서랍장' }, { label: '소파' }, { label: '기타' },
    ],
  },
  ir_fn_qty_price: {
    title: '수량·금액대', type: 'form', next: 'ir_extra',
    fields: [
      { key: '가구 수량', type: 'text', placeholder: '예: 2개', required: true },
      { key: '가구 금액대', type: 'choice', options: ['25만원 미만', '50만원 미만', '75만원 미만', '100만원 미만'] },
    ],
  },
  ir_fn_move: {
    title: '이동 방식', type: 'form', next: 'ir_extra',
    fields: [
      { key: '이동 유형', type: 'choice', options: ['방 → 방', '층 → 층'], required: true },
      { key: '분해 후 설치', type: 'choice', options: ['필요', '불필요'], required: true },
    ],
  },
  ir_fn_kind_repair: {
    title: '가구 종류 (복수 선택)', type: 'multi', next: 'ir_fn_material',
    options: [
      { label: '침대' }, { label: '옷장' }, { label: '선반' }, { label: '시스템장' },
      { label: '책상' }, { label: '서랍장' }, { label: '소파' }, { label: '싱크대' }, { label: '싱크대 상·하부장' }, { label: '기타' },
    ],
  },
  ir_fn_material: {
    title: '재질·리폼 종류', type: 'form', next: 'ir_extra',
    fields: [
      { key: '가구 재질', type: 'choice', options: ['원목', '합판·MDF', '가죽', '금속', '천'], required: true },
      { key: '원하는 리폼', type: 'choice', options: ['천갈이', '시트지 부착', '페인팅', '가구 축소', '가구 확장'], required: true },
      { key: '증상 상세', type: 'textarea', placeholder: '증상을 상세히 적어 주세요.' },
    ],
  },

  ir_pb_kind: {
    title: '작업 분야', type: 'single',
    options: [
      { label: '수도', sub: '수전 · 배관 · 하수구', next: 'ir_pb_svc_water' },
      { label: '보일러', sub: '가스 · 기름 · 전기 보일러', next: 'ir_pb_svc_boiler' },
      { label: '전기', sub: '콘센트 · 조명 · 배선', next: 'ir_pb_svc_electric' },
    ],
  },
  ir_pb_svc_water: {
    title: '원하는 서비스', type: 'single', next: 'ir_pb_space_water',
    options: [{ label: '설치' }, { label: '교체' }, { label: '수리' }, { label: '언 수도 녹임' }],
  },
  ir_pb_space_water: {
    title: '작업이 필요한 공간', type: 'single', next: 'ir_pb_detail_water',
    options: [
      { label: '화장실·욕실' }, { label: '주방' }, { label: '세탁실' },
      { label: '베란다' }, { label: '야외' }, { label: '건물 전체' },
    ],
  },
  ir_pb_detail_water: {
    title: '세부 부분', type: 'form', next: 'ir_extra',
    fields: [
      { key: '세부 부분', type: 'choice', options: ['수도꼭지·수전', '배관', '하수구', '세면대', '변기'], required: true },
      { key: '제품 보유 여부', type: 'choice', options: ['네', '아니요(구매 필요)', '기타'], required: true },
    ],
  },
  ir_pb_svc_boiler: {
    title: '원하는 서비스', type: 'single', next: 'ir_pb_type_boiler',
    options: [{ label: '설치' }, { label: '교체' }, { label: '수리' }],
  },
  ir_pb_type_boiler: {
    title: '보일러 종류', type: 'single', next: 'ir_pb_area_boiler',
    options: [{ label: '가스 보일러' }, { label: '기름 보일러' }, { label: '전기 보일러' }, { label: '잘 모르겠음' }],
  },
  ir_pb_area_boiler: {
    title: '난방 면적', type: 'single', next: 'ir_extra',
    options: [
      { label: '10평 미만' }, { label: '10평대' }, { label: '20평대' },
      { label: '30평대' }, { label: '40평대' }, { label: '50평대' },
    ],
  },
  ir_pb_svc_electric: {
    title: '원하는 서비스', type: 'single', next: 'ir_pb_part_electric',
    options: [
      { label: '설치' }, { label: '교체' }, { label: '점검·수리' },
      { label: '증설·증압' }, { label: '소방공사' },
    ],
  },
  ir_pb_part_electric: {
    title: '작업 부분', type: 'single', next: 'ir_extra',
    options: [
      { label: '콘센트' }, { label: 'LED·조명' }, { label: '스위치' },
      { label: '배선' }, { label: '증설·승압' }, { label: '소방공사(차단기·감지기 등)' },
    ],
  },

  ir_extra: {
    title: '추가 서비스 (복수 선택)', type: 'multi', next: 'svc_date',
    options: [
      { label: '해당없음' }, { label: '해체·철거' }, { label: '이전 설치' },
    ],
  },
  svc_date: {
    title: '희망일', type: 'form', next: 'ir_location',
    fields: [
      { key: '희망일', type: 'calendar', embed: ['날짜 협의', '시간 협의'], required: true },
      { key: '날짜 협의', type: 'choice', options: ['협의 가능', '협의 불가'], required: true },
      { key: '시간 협의', type: 'choice', options: ['오전', '오후', '저녁', '협의 가능'], required: true },
    ],
  },
  ir_location: {
    title: '지역 및 요청사항', type: 'form', next: 'budget',
    fields: [
      { key: '희망 지역', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'ir_addr' },
      { key: '희망 지역 상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'ir_addr', wide: true, required: true },
      { key: '층수', type: 'text', placeholder: '예: 3층', row: 'ir_addr', required: true, compact: true },
      { key: '폐기물 처리', type: 'choice', options: ['필요', '불필요'] },
    ],
  },

  /* ── 인테리어 (확정 시트 '인테리어_정리' 재검증 반영, 260727)
     집/상업공간/리모델링/도배장판 4분기가 시트에서 서로 완전히 다른 구조라 분기별로 새로 짰다.
     예산 단위가 대분류마다 달라(집=7구간 "~만원대", 상업공간=5구간 "~만원 이하") 공용 budget
     단계 대신 카테고리 전용 예산 단계를 쓰고, 답변은 일반 항목처럼 SVC_REQ_ITEM에 저장한다
     (범위값이라 svcReqBdgtAmt 숫자 컬럼엔 안 맞음). 리모델링·도배장판은 시트에 예산 항목이 아예
     없어 예산 단계 없이 바로 마무리로 넘어간다. ── */
  it_class: {
    title: '공간 유형', type: 'single',
    options: [
      { label: '집(주거 공간)', next: 'it_home_building' },
      { label: '상업공간', next: 'it_biz_building' },
      { label: '리모델링', next: 'it_reno_building' },
      { label: '도배·장판', next: 'it_wall_building' },
    ],
  },

  it_home_building: {
    title: '건물 유형', type: 'single', next: 'it_home_work',
    options: [
      { label: '아파트' }, { label: '빌라·연립주택' }, { label: '단독주택' }, { label: '오피스텔' },
    ],
  },
  it_home_work: {
    title: '시공이 필요한 부분 (복수 선택)', desc: '항목별 세부 시공 방식(전체교체/부분교체 등)은 다음 단계에서 확정 목업 반영 예정',
    type: 'multi', next: 'it_home_budget',
    options: [
      { label: '도배' }, { label: '바닥(장판·마루)' }, { label: '몰딩' },
      { label: '주방' }, { label: '욕실' }, { label: '샷시' },
      { label: '베란다' }, { label: '방문 보수·교체' }, { label: '현관문' }, { label: '조명' },
    ],
  },
  it_home_budget: {
    title: '희망 예산', type: 'form', next: 'it_home_final',
    fields: [
      { key: '예상 금액대', type: 'choice', options: ['500만 원 미만', '1,000만 원 미만', '1,000만 원대', '2,000만 원대', '3,000만 원대', '4,000만 원대', '5,000만 원대'], required: true, toggleable: true },
      { key: '예산', type: 'amount-toggle', placeholder: '예: 30,000,000원', disabledWhenFilled: '예상 금액대' },
    ],
  },
  it_home_final: {
    title: '요청사항', type: 'form', next: 'memo',
    fields: [
      { key: '희망일', type: 'calendar', embed: ['날짜 협의', '시간 협의'], required: true },
      { key: '날짜 협의', type: 'choice', options: ['협의 가능', '협의 불가'], required: true },
      { key: '시간 협의', type: 'choice', options: ['오전', '오후', '저녁', '협의 가능'], required: true },
      { key: '주소', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'it_home_addr' },
      { key: '상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'it_home_addr', wide: true, required: true },
      { key: '층수', type: 'text', placeholder: '예: 3층', row: 'it_home_addr', required: true, compact: true },
      { key: '복층 유무', type: 'choice', options: ['있음', '없음'], row: 'it_home_status' },
      { key: '공실 확인', type: 'choice', options: ['공실', '거주 중'], row: 'it_home_status' },
    ],
  },

  it_biz_building: {
    title: '건물 유형', type: 'single', next: 'it_biz_type',
    options: [
      { label: '단독주택' }, { label: '연립주택' }, { label: '빌라' },
      { label: '아파트' }, { label: '상업시설(예: 음식점)' }, { label: '상가건물' },
    ],
  },
  it_biz_type: {
    title: '업종', type: 'single', next: 'it_biz_budget',
    options: [
      { label: '외식' }, { label: '매장·상업' }, { label: '오피스' }, { label: '교육' },
      { label: '운동' }, { label: '의료' }, { label: '숙박' }, { label: '애견' },
    ],
  },
  it_biz_budget: {
    title: '희망 예산', type: 'form', next: 'it_biz_final',
    fields: [
      { key: '예상 금액대', type: 'choice', options: ['1,000만 원 이하', '2,000만 원 이하', '3,000만 원 이하', '4,000만 원 이하', '5,000만 원 이하'], required: true, toggleable: true },
      { key: '예산', type: 'amount-toggle', placeholder: '예: 30,000,000원', disabledWhenFilled: '예상 금액대' },
    ],
  },
  it_biz_final: {
    title: '요청사항', type: 'form', next: 'memo',
    fields: [
      { key: '희망일', type: 'calendar', embed: ['날짜 협의', '시간 협의'], required: true },
      { key: '날짜 협의', type: 'choice', options: ['협의 가능', '협의 불가'], required: true },
      { key: '시간 협의', type: 'choice', options: ['오전', '오후', '저녁', '협의 가능'], required: true },
      { key: '주소', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'it_biz_addr' },
      { key: '상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'it_biz_addr', wide: true, required: true },
      { key: '층수', type: 'text', placeholder: '예: 3층', row: 'it_biz_addr', required: true, compact: true },
    ],
  },

  it_reno_building: {
    title: '건물 유형', type: 'single', next: 'it_reno_scope',
    options: [{ label: '단독주택' }, { label: '다가구주택' }, { label: '상가주택' }],
  },
  it_reno_scope: {
    title: '리모델링 범위', type: 'single', next: 'it_reno_space',
    options: [
      { label: '내부 전체' }, { label: '내부 부분' }, { label: '외관 전체' }, { label: '외관 부분' },
    ],
  },
  it_reno_space: {
    title: '리모델링이 필요한 내부공간 (복수 선택)', type: 'multi', next: 'it_reno_status',
    options: [
      { label: '방' }, { label: '거실' }, { label: '베란다' },
      { label: '다용도실' }, { label: '욕실' }, { label: '화장실' },
    ],
  },
  it_reno_status: {
    title: '현재 공간 상태', type: 'single', next: 'it_reno_final',
    options: [
      { label: '현재 거주 중' }, { label: '계약 완료 · 공실' }, { label: '가계약 완료 · 계약 예정' },
    ],
  },
  it_reno_final: {
    title: '요청사항', type: 'form', next: 'memo',
    fields: [
      { key: '희망 지역', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'it_reno_addr' },
      { key: '희망 지역 상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'it_reno_addr', wide: true, required: true },
      { key: '희망일', type: 'calendar', required: true },
    ],
  },

  it_wall_building: {
    title: '건물 유형', type: 'single', next: 'it_wall_scope',
    options: [
      { label: '단독주택' }, { label: '연립주택' }, { label: '빌라' },
      { label: '아파트' }, { label: '상업시설(예: 음식점)' }, { label: '상가건물' },
    ],
  },
  it_wall_scope: {
    title: '시공 여부', type: 'single', next: 'it_wall_area',
    options: [
      { label: '필요 없음' }, { label: '상담 후 결정' }, { label: '전체 교체(철거 후 시공)' },
      { label: '부분 교체(철거 후 시공)' }, { label: '덧방 시공(기존 바닥재 위 시공)' }, { label: '신규 시공' },
    ],
  },
  it_wall_area: {
    title: '시공 범위', type: 'single', next: 'it_wall_type',
    options: [{ label: '집 전체' }, { label: '거실' }, { label: '주방' }, { label: '방' }, { label: '천장' }],
  },
  it_wall_type: {
    title: '도배 종류', type: 'single', next: 'it_wall_extra',
    options: [
      { label: '필요 없음' }, { label: '상담 후 결정' }, { label: '전체 실크' },
      { label: '전체 합지' }, { label: '실크+합지' }, { label: '도배지 보유' },
    ],
  },
  it_wall_extra: {
    title: '추가 조건 (복수 선택)', type: 'multi', next: 'it_wall_final',
    options: [
      { label: '해당없음' }, { label: '베란다 확장' }, { label: '복층형 구조' },
      { label: '우물형 천장' }, { label: '곰팡이 있음' },
    ],
  },
  it_wall_final: {
    title: '요청사항', type: 'form', next: 'memo',
    fields: [
      { key: '희망 지역', type: 'address', placeholder: '주소 검색을 눌러주세요.', required: true, row: 'it_wall_addr' },
      { key: '희망 지역 상세주소', type: 'text', placeholder: '예: 101동 1502호', row: 'it_wall_addr', wide: true, required: true },
      { key: '희망일', type: 'calendar', required: true },
    ],
  },

  /* ── 레슨 (확정 시트 '레슨 정리' 재검증 반영, 260727)
     과외에 "국내 입시" 외 "유학"(ACT/AP/EJU/GED/IB, GMAT/GRE/LSAT) 분기가 시트에 있는데 목업에
     빠져 있어 추가. 음악·미술·운동 세부분야별 "기타(준비물)" 필드, 요청사항의 "성별" 필드도
     시트엔 있는데 목업에 없어 추가. ── */
  ls_class: {
    title: '레슨 분류', type: 'single',
    options: [
      { label: '자기계발', sub: '음악 · 미술 · 운동 · 어학', next: 'ls_field' },
      { label: '과외', sub: '국내 입시 · 유학', next: 'ls_target_class' },
    ],
  },
  ls_field: {
    title: '분야 선택', type: 'single',
    options: [
      { label: '음악', next: 'ls_music' },
      { label: '미술', next: 'ls_art' },
      { label: '운동', next: 'ls_fit' },
      { label: '어학', next: 'ls_lang' },
    ],
  },
  ls_music: {
    title: '세부 분야', type: 'single',
    options: [
      { label: '악기', sub: '드럼 · 기타 · 피아노 · 바이올린 등', next: 'ls_prep_instrument' },
      { label: '보컬', sub: '보컬 · 성악 · 랩 · 성우', next: 'ls_form' },
      { label: '음악이론', sub: '작곡 · 편곡 · 작사 · 화성학', next: 'ls_prep_theory' },
    ],
  },
  ls_prep_instrument: {
    title: '기타(준비물)', type: 'form', next: 'ls_form',
    fields: [
      { key: '악보를 읽을 줄 아는가', type: 'choice', options: ['네', '아니요'], row: 'prep_line', required: true },
      { key: '악기 유무', type: 'choice', options: ['보유', '미보유'], row: 'prep_line', required: true },
    ],
  },
  ls_prep_theory: {
    title: '기타(준비물)', type: 'form', next: 'ls_form',
    fields: [{ key: '악보를 읽을 줄 아는가', type: 'choice', options: ['네', '아니요'], required: true }],
  },
  ls_art: {
    title: '세부 분야', type: 'single',
    options: [
      { label: '디지털 드로잉', sub: '기초 · 사물 · 인물 · 굿즈', next: 'ls_prep_tablet' },
      { label: '미술·회화', sub: '드로잉 · 유화 · 수채화', next: 'ls_form' },
      { label: '만화·웹툰', sub: '4컷만화 · 콘티 · 배경', next: 'ls_form' },
    ],
  },
  ls_prep_tablet: {
    title: '기타(준비물)', type: 'form', next: 'ls_form',
    fields: [{ key: '태블릿 유무', type: 'choice', options: ['보유', '미보유'], required: true }],
  },
  ls_fit: {
    title: '세부 분야', type: 'single',
    options: [
      { label: '피트니스', sub: 'PT · 필라테스 · 요가 · 크로스핏', next: 'ls_form' },
      { label: '스포츠', sub: '구기 · 격투 · 계절 · 일상', next: 'ls_prep_equipment' },
    ],
  },
  ls_prep_equipment: {
    title: '기타(준비물)', type: 'form', next: 'ls_form',
    fields: [{ key: '장비 유무', type: 'choice', options: ['보유', '미보유'], required: true }],
  },
  ls_lang: {
    title: '세부 분야', type: 'single', next: 'ls_form',
    options: [
      { label: '영어', sub: 'TOEIC · TEPS · TOEFL 등' },
      { label: '제2외국어', sub: 'JLPT · HSK · DELF 등' },
    ],
  },

  ls_target_class: {
    title: '과외 분류', type: 'single',
    options: [
      { label: '국내 입시', next: 'ls_subject' },
      { label: '유학', next: 'ls_abroad_kind' },
    ],
  },
  ls_subject: {
    title: '과목 (복수 선택)', type: 'multi', next: 'ls_form',
    options: [
      { label: '국어' }, { label: '수학' }, { label: '영어' }, { label: '사회' }, { label: '과학' },
    ],
  },
  ls_abroad_kind: {
    title: '세부 카테고리', type: 'single', next: 'ls_form',
    options: [
      { label: 'ACT' }, { label: 'AP' }, { label: 'EJU' }, { label: 'GED' }, { label: 'IB' },
      { label: 'GMAT' }, { label: 'GRE' }, { label: 'LSAT' },
    ],
  },

  ls_form: {
    title: '레슨 형태', type: 'single',
    options: [
      { label: '개인 레슨', next: 'ls_visit' },
      { label: '그룹 레슨', next: 'ls_info' },
      { label: '학원', next: 'ls_info' },
    ],
  },
  ls_visit: {
    title: '방문 방식', type: 'single', next: 'ls_info',
    options: [
      { label: '레슨생 방문' }, { label: '강사 방문' }, { label: '온라인·화상' }, { label: '협의 가능' },
    ],
  },
  ls_info: {
    title: '레슨생 정보', type: 'form', next: 'budget',
    fields: [
      { key: '레슨생 성별', type: 'choice', options: ['남', '여'], row: 'info_line1', narrow: true, required: true },
      { key: '레슨생 연령대', type: 'select', options: ['10대', '20대', '30대', '40대', '50대', '60대 이상'], row: 'info_line1', required: true },
      { key: '희망 요일', type: 'select', options: ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '협의 가능'], row: 'info_line1', required: true },
      { key: '희망 시간대', type: 'select', options: ['오전', '오후', '협의 가능'], row: 'info_line1', required: true },
      { key: '희망 지역', type: 'region', placeholder: '지역을 선택해 주세요', required: true, row: 'ls_region', maxSelections: 3, desc: '최대 3개까지 선택할 수 있어요.', hideWhen: { step: 'ls_visit', equals: '온라인·화상' } },
      { key: '희망 지역 상세주소', type: 'text', placeholder: '예: OO동, OO아파트 인근 등', row: 'ls_region', wide: true, required: true, hideWhen: { step: 'ls_visit', equals: '온라인·화상' } },
    ],
  },

  /* ── 공통 마지막 단계: 예산 → 메모 ── */
  budget: {
    title: '희망 예산', type: 'form', next: 'memo',
    fields: [
      { key: '예산', type: 'amount-toggle', placeholder: '예: 300,000원', required: true },
    ],
  },
  memo: {
    title: '특이사항 메모 (선택)', type: 'form', next: WIZARD_END,
    fields: [
      { key: '메모', type: 'textarea', placeholder: '고수님이 미리 알아야 할 내용을 자유롭게 적어 주세요.' },
    ],
  },
};

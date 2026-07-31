import { FilePenLine, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';

// 담당자 7 · F-AUC-001/F-SVC-001
// 퀵메뉴 제거 후 목록·상세 화면에서 기존 등록 화면으로 진입할 수 있도록
// 공통 헤더가 사용하는 액션의 문구, 아이콘, 목적지를 한곳에서 관리한다.
const HEADER_CREATE_ACTIONS = {
  auction: {
    label: '경매 등록',
    to: '/product/register',
    Icon: Gavel,
  },
  service: {
    label: '견적 요청',
    to: '/service-requests/new',
    Icon: FilePenLine,
  },
};

const HeaderCreateAction = ({ type }) => {
  const action = HEADER_CREATE_ACTIONS[type];
  if (!action) return null;

  const { Icon, label, to } = action;

  return (
    <Link
      aria-label={label}
      className="inline-flex size-[36px] shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-0 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#0048bf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 sm:h-[40px] sm:w-auto sm:px-4"
      title={label}
      to={to}
    >
      <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={2.2} />
      <span className="hidden whitespace-nowrap sm:inline">{label}</span>
    </Link>
  );
};

export default HeaderCreateAction;

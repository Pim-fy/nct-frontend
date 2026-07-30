export default function MyPageListError({ message, onRetry, retryIcon }) {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center gap-[9px] rounded-lg border border-[#e9edf4] bg-white px-6 py-10 text-center"
      role="alert"
    >
      <strong className="text-[#344054]">{message}</strong>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#155eef] bg-white px-[13px] text-[13px] font-extrabold text-[#155eef] hover:bg-[#eef4ff]"
        >
          {retryIcon}
          다시 시도
        </button>
      )}
    </div>
  );
}

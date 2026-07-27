import React from "react";

export default function ArrowIcon({ direction = "left", className = "", imgSrc = null, onClick, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={direction === "left" ? "이전" : "다음"}
      onClick={onClick}
      disabled={disabled}
      className={`absolute flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          className={`object-contain ${direction === "left" ? "rotate-180" : ""}`}
        />
      )}
    </button>
  );
}

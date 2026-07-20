const AuctionImageGallery = ({
  auction,
  imageItems,
  activeImageIndex,
  mainImageUrl,
  isMainImageVisible,
  onMoveImage,
  onImageError,
}) => (
  <div className="photo-panel">
    {mainImageUrl ? (
      <>
        {imageItems.length > 1 && (
          <button className="photo-nav prev" type="button" aria-label="이전 이미지 보기" onClick={() => onMoveImage(-1)}>
            <span aria-hidden="true" />
          </button>
        )}
        {isMainImageVisible ? (
          <img
            id="mainImage"
            src={mainImageUrl}
            alt={`${auction.title} 대표 이미지`}
            data-active-index={activeImageIndex}
            onError={() => onImageError(mainImageUrl)}
          />
        ) : (
          <span>{auction.categoryName || '상품 이미지'}</span>
        )}
        {imageItems.length > 1 && (
          <button className="photo-nav next" type="button" aria-label="다음 이미지 보기" onClick={() => onMoveImage(1)}>
            <span aria-hidden="true" />
          </button>
        )}
      </>
    ) : (
      <span>{auction.categoryName || '상품 이미지'}</span>
    )}
  </div>
);

export const AuctionPreviewRail = ({ imageItems, activeImageIndex, onPreviewClick }) => (
  <section className="preview-rail" aria-label="상품 이미지 미리보기">
    <div className="preview-track">
      {imageItems.map((item, index) => (
        <button
          className={`preview-thumb ${activeImageIndex === index ? 'active' : ''}`}
          type="button"
          key={item.id}
          data-photo={item.url || ''}
          onClick={() => onPreviewClick(index)}
        >
          <img src={item.url} alt={item.alt} />
        </button>
      ))}
    </div>
  </section>
);

export default AuctionImageGallery;

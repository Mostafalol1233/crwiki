import { useEffect, useState } from "react";
import type { ImgHTMLAttributes, SyntheticEvent } from "react";

export const CONTENT_IMAGE_FALLBACK = "/portal/modes.webp";

interface ContentImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export default function ContentImage({ fallbackSrc = CONTENT_IMAGE_FALLBACK, src, alt = "", onError, loading = "lazy", decoding = "async", ...props }: ContentImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = (event: SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    }
    onError?.(event);
  };

  return <img {...props} src={currentSrc} alt={alt} loading={loading} decoding={decoding} onError={handleError} />;
}

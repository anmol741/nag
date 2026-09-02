import Image from "next/image";

export type ImageFit = "cover" | "contain";

interface SmartImageProps {
  src: string;
  alt: string;
  fit: ImageFit;
  /** Natural pixel width/height of the source file. Required for fit="contain" to render at its true aspect ratio without a forced box. */
  width?: number;
  height?: number;
  /** CSS object-position value, used only for fit="cover". */
  position?: string;
  /** Extra zoom on top of a `cover` crop, anchored at `position`. Ignored for fit="contain". */
  zoom?: number;
  /** Classes on the outer wrapper: rounding, border, shadow, padding, max-width, etc. */
  containerClassName?: string;
  /** Background shown as matting around a "contain" image, or (for the fill fallback) behind letterboxed gaps. */
  bgClassName?: string;
  sizes?: string;
  preload?: boolean;
  className?: string;
}

/**
 * fit="contain" with known width/height renders the image at its real,
 * undistorted aspect ratio (next/image intrinsic sizing + `h-auto`) — no
 * cropping, no forced aspect box. Use this for course posters and any
 * graphic containing text, faces, or logos that must stay fully visible.
 *
 * fit="cover" keeps the old fill+object-position(+zoom) crop behavior, and
 * should only be used for ordinary photographs where cropping is fine.
 */
export default function SmartImage({
  src,
  alt,
  fit,
  width,
  height,
  position = "center",
  zoom = 1,
  containerClassName = "",
  bgClassName = "bg-cream",
  sizes = "100vw",
  preload = false,
  className = "",
}: SmartImageProps) {
  if (fit === "contain" && width && height) {
    return (
      <div className={`flex items-center justify-center overflow-hidden ${bgClassName} ${containerClassName}`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          preload={preload}
          className={`h-auto w-full object-contain ${className}`}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${fit === "contain" ? bgClassName : ""} ${containerClassName}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={`${fit === "contain" ? "object-contain p-4" : "object-cover"} ${className}`}
        style={{
          objectPosition: position,
          ...(fit === "cover" && zoom !== 1
            ? { transform: `scale(${zoom})`, transformOrigin: position }
            : {}),
        }}
      />
    </div>
  );
}

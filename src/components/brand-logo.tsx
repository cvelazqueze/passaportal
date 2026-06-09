import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
  showLink?: boolean;
}

export function BrandLogo({
  href = "/",
  className,
  imageClassName,
  showLink = true,
}: BrandLogoProps) {
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/passaportal-logo.png"
      alt="PassaPortal"
      width={160}
      height={48}
      className={cn("h-9 w-auto object-contain", imageClassName)}
    />
  );

  if (!showLink) {
    return <div className={cn("inline-flex items-center", className)}>{image}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-md transition-opacity hover:opacity-85",
        className
      )}
      aria-label="PassaPortal"
    >
      {image}
    </Link>
  );
}

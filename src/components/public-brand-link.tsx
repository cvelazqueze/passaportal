import { BrandLogo } from "@/components/brand-logo";

interface PublicBrandLinkProps {
  size?: "sm" | "md";
}

export function PublicBrandLink({ size = "md" }: PublicBrandLinkProps) {
  return (
    <BrandLogo imageClassName={size === "sm" ? "h-10" : "h-9"} />
  );
}

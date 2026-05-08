import Image from "next/image";

export function ShieldMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/shield-logo.webp"
      alt="Justice Shield logo"
      width={28}
      height={28}
      className={className}
      draggable={false}
    />
  );
}

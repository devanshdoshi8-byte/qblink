import logo from "@/assets/qblink-logo.png";

interface QBlinkWordmarkProps {
  className?: string;
  textClassName?: string;
  iconClassName?: string;
}

/**
 * Consistent QBlink brand wordmark used across navigation and authentication surfaces.
 */
export const QBlinkWordmark = ({
  className = "",
  textClassName = "text-xl text-foreground",
  iconClassName = "w-8 h-8",
}: QBlinkWordmarkProps) => (
  <span className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
    <img src={logo} alt="" className={`${iconClassName} rounded-lg object-contain`} draggable={false} />
    <span className={`font-serif font-semibold tracking-tight ${textClassName}`}>
      QBlink
    </span>
  </span>
);

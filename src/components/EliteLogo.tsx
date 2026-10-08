import React from "react";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark" | "color" | "splash";
  showText?: boolean;
  titleText?: string;
  subtitleText?: string;
}

export const EliteLogo: React.FC<Props> = ({
  className = "",
  size = "md",
  variant = "color",
  showText = true,
  titleText = "Elyano Connect",
  subtitleText = "ELITE HOSPITAL",
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-3xl sm:text-4xl",
  };

  const subTextSizes = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-[11px]",
    xl: "text-xs",
  };

  const textColor =
    variant === "splash" || variant === "light"
      ? "text-black font-black"
      : variant === "dark"
      ? "text-white"
      : "text-slate-900 dark:text-white";

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Hospital Logo Symbol SVG */}
      <div className={`${iconSizes[size]} relative flex items-center justify-center drop-shadow-md shrink-0`}>
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="eliteLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00c4b4" />
              <stop offset="50%" stopColor="#009688" />
              <stop offset="100%" stopColor="#00796b" />
            </linearGradient>
          </defs>

          {/* Curved Wing Body */}
          <path
            d="M 68,124 C 42,95 48,50 92,44 C 98,43 72,78 82,108 C 92,128 112,102 152,36 C 128,66 106,98 90,118 C 76,138 68,132 68,124 Z"
            fill="url(#eliteLogoGradient)"
          />

          {/* Wing Feathers */}
          <path
            d="M 94,70 L 148,38 C 150,36 151,41 144,46 L 90,78 C 88,79 89,72 94,70 Z"
            fill="url(#eliteLogoGradient)"
          />
          <path
            d="M 90,86 L 145,55 C 147,53 148,58 140,63 L 85,94 C 83,95 85,88 90,86 Z"
            fill="url(#eliteLogoGradient)"
          />
          <path
            d="M 85,102 L 142,71 C 144,69 145,74 136,79 L 80,110 C 78,111 80,104 85,102 Z"
            fill="url(#eliteLogoGradient)"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col items-center mt-0.5 text-center leading-tight">
          <span className={`font-black tracking-tight ${textSizes[size]} ${textColor}`}>
            {titleText}
          </span>
          <span className={`font-bold tracking-[0.2em] uppercase opacity-90 ${subTextSizes[size]} ${textColor}`}>
            {subtitleText}
          </span>
        </div>
      )}
    </div>
  );
};

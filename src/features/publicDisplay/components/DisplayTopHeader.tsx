import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import { DisplayConnectionStatus, DisplayTheme } from "../types";

interface DisplayTopHeaderProps {
  businessName: string;
  queueName: string;
  connectionStatus: DisplayConnectionStatus;
  theme: DisplayTheme;
  audioEnabled: boolean;
  isFullscreen: boolean;
  onToggleTheme: () => void;
  onToggleAudio: () => void;
  onToggleFullscreen: () => void;
}

export const DisplayTopHeader: React.FC<DisplayTopHeaderProps> = ({
  businessName,
  queueName,
  connectionStatus,
  theme,
  audioEnabled,
  isFullscreen,
  onToggleTheme,
  onToggleAudio,
  onToggleFullscreen,
}) => {
  const isLive = connectionStatus === "live";

  return (
    <header className="w-full flex flex-wrap items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-border/80">
      {/* Brand & Location */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 min-h-[40px] text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-xl border border-border bg-card transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to QBlink</span>
        </Link>
        <img
          src={logo}
          alt="QBlink"
          className="w-9 h-9 sm:w-12 sm:h-12 rounded-2xl object-contain shadow-md shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-lg md:text-xl font-black text-foreground tracking-tight truncate max-w-[160px] sm:max-w-md">
              {queueName}
            </h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              {businessName}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? "bg-success" : "bg-warning"
              }`}
            />
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {isLive ? "Live Sync Active" : "Reconnecting..."}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls (Audio, Theme, Fullscreen) */}
      <div className="flex items-center gap-2">
        {/* Audio Speech Toggle */}
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? "Disable voice announcements" : "Enable voice announcements"}
          aria-label={audioEnabled ? "Disable voice announcements" : "Enable voice announcements"}
          className={`p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
            audioEnabled
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-card text-muted-foreground hover:text-foreground border-border"
          }`}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden md:inline">{audioEnabled ? "Voice On" : "Voice Off"}</span>
        </button>

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Display`}
          aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Display`}
          className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Fullscreen Trigger */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen TV Mode"}
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen TV Mode"}
          className="p-2.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="text-xs font-bold hidden lg:inline">
            {isFullscreen ? "Exit TV Mode" : "TV Mode"}
          </span>
        </button>
      </div>
    </header>
  );
};

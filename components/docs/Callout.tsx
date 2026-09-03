"use client";

import React from "react";
import { Info, AlertTriangle, Lightbulb, AlertCircle } from "lucide-react";

type CalloutType = "note" | "warning" | "tip" | "important";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const calloutConfig = {
  note: {
    icon: Info,
    bg: "bg-info/5",
    border: "border-info/30",
    iconColor: "text-info",
    titleDefault: "Note",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/5",
    border: "border-warning/30",
    iconColor: "text-warning",
    titleDefault: "Warning",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-success/5",
    border: "border-success/30",
    iconColor: "text-success",
    titleDefault: "Tip",
  },
  important: {
    icon: AlertCircle,
    bg: "bg-error/5",
    border: "border-error/30",
    iconColor: "text-error",
    titleDefault: "Important",
  },
};

export function Callout({
  type = "note",
  title,
  children,
}: CalloutProps) {
  const config = calloutConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`rounded-xl border p-4 ${config.bg} ${config.border}`}
      role="note"
    >
      <div className="flex items-start gap-3">
        <Icon
          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${config.iconColor}`}
        />
        <div className="space-y-1 text-xs leading-relaxed">
          <p className="font-bold text-sm text-base-content">
            {title || config.titleDefault}
          </p>
          <div className="text-base-content/80">{children}</div>
        </div>
      </div>
    </div>
  );
}

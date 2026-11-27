import React from "react";
import { motion } from "framer-motion";
import { Laptop, Activity, Users, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { IndustryMorphConfig } from "../types";

interface MorphBusinessCardProps {
  industry: IndustryMorphConfig;
}

export const MorphBusinessCard: React.FC<MorphBusinessCardProps> = ({ industry }) => {
  const { business } = industry;

  return (
    <div className="p-6 rounded-3xl bg-card border border-border shadow-xl flex flex-col justify-between relative overflow-hidden h-full">
      {/* Decorative Accent Glow */}


      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-info-soft text-info flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">Business Console</h4>
              <span className="text-[11px] text-muted-foreground">{business.operatorRole} Terminal</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-info-soft text-info border border-info/25">
            {business.counterName}
          </span>
        </div>

        {/* Counter Metrics */}
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Now Serving
              </span>
              <span className="font-mono text-2xl font-black text-info mt-0.5 block">
                #{business.nowServingToken}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Active Line
              </span>
              <span className="font-mono text-2xl font-black text-foreground mt-0.5 block">
                {business.waitingCountText.split(" ")[0]}
              </span>
            </div>
          </div>

          {/* Service Velocity Metric */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-success" />
              <span>Throughput Velocity:</span>
            </span>
            <span className="font-mono font-bold text-foreground">{business.velocityMetric}</span>
          </div>

          {/* Sample Line Manifest */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Live Arrival Stream
            </span>
            <div className="space-y-1">
              {business.manifestSample.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-background border border-border/60"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">#{item.token}</span>
                    <span className="font-medium text-foreground">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-mono">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Impact Note */}
      <div className="mt-6 pt-4 border-t border-border/60">
        <div className="p-3 rounded-xl bg-info-soft border border-info/25 text-xs text-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider block text-info">
            Business Operating Result:
          </span>
          <p className="mt-0.5 leading-relaxed font-medium">
            "{business.operationalImpactNote}"
          </p>
        </div>
      </div>
    </div>
  );
};

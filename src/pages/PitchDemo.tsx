import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Laptop,
  Monitor,
  Phone,
  Smartphone,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Users,
  Zap,
  UserCheck,
  CheckCircle2,
  Hourglass,
  Clock,
  ShieldCheck,
  Wifi,
  Battery,
  Sparkles,
  Bell,
  Check,
} from "lucide-react";
import logo from "@/assets/qblink-logo.png";
import { staffAudio } from "@/lib/staffAudio";
import { announceToken } from "@/lib/audioAnnouncer";
import SEO from "@/components/SEO";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

const createJsx = (isJsxs: boolean) => {
  const fn = isJsxs ? _jsxs : _jsx;
  return (type: any, props: any, key?: any) => {
    if (props && "key" in props) {
      const explicitKey = key !== undefined ? key : props.key;
      const { key: _, ...restProps } = props;
      return fn(type, restProps, explicitKey);
    }
    if (key !== undefined) {
      return fn(type, props, key);
    }
    return fn(type, props);
  };
};

// Alias bindings matching compiled JSX
const e = {
  jsx: createJsx(false),
  jsxs: createJsx(true),
};
const G = Play;
const K = Pause;
const E = Phone;
const c = motion;
const O = Users;
const k = Zap;
const Z = UserCheck;
const Q = CheckCircle2;
const F = Plus;
const L = Hourglass;
const h = React;
const _ = Wifi;
const H = AnimatePresence;
const X = Bell;
const M = Sparkles;
const ee = Clock;
const z = ShieldCheck;
const se = Link;
const te = ArrowLeft;
const ae = logo;
const re = Volume2;
const ne = VolumeX;
const ie = RotateCcw;
const C = Smartphone;
const T = Monitor;
const $ = staffAudio;
const le = announceToken;
const R = Laptop;
const oe = Battery;

const P = {
    clinic: {
      id: "clinic",
      label: "🏥 Healthcare Clinic",
      businessName: "Apex Multi-Speciality Clinic",
      queueName: "Dr. Mehta • General OPD",
      counterName: "Consultation Room 3",
      userToken: "A-104",
      defaultVelocity: 3,
    },
    cafe: {
      id: "cafe",
      label: "☕ Dining & Cafe",
      businessName: "Blue Harbor Artisan Roastery",
      queueName: "Table Seating • Main Dining",
      counterName: "Host Stand",
      userToken: "T-24",
      defaultVelocity: 4,
    },
    salon: {
      id: "salon",
      label: "💇 Salon & Spa",
      businessName: "Luxe Studio & Spa",
      queueName: "Senior Stylist • Hair & Spa",
      counterName: "Styling Station 2",
      userToken: "S-18",
      defaultVelocity: 5,
    },
    counter: {
      id: "counter",
      label: "🏛️ Citizen Counter",
      businessName: "City Civil Administration",
      queueName: "Document Verification & Permits",
      counterName: "Counter 4",
      userToken: "C-82",
      defaultVelocity: 2,
    },
  };
function W(s = "clinic") {
  const i = P[s],
    t =
      s === "clinic" ? "A-" : s === "cafe" ? "T-" : s === "salon" ? "S-" : "C-",
    a = s === "clinic" ? 100 : s === "cafe" ? 20 : s === "salon" ? 14 : 78,
    r = {
      id: "sim-0",
      token: `${t}${a}`,
      name: "Kavita Rao",
      status: "called",
      isUser: !1,
    },
    l = [
      {
        id: "sim-1",
        token: `${t}${a + 1}`,
        name: "Aarav Sharma",
        status: "waiting",
        isUser: !1,
      },
      {
        id: "sim-2",
        token: `${t}${a + 2}`,
        name: "Priya Patel",
        status: "waiting",
        isUser: !1,
      },
      {
        id: "sim-3",
        token: `${t}${a + 3}`,
        name: "Vikram Malhotra",
        status: "waiting",
        isUser: !1,
      },
      {
        id: "sim-4",
        token: `${t}${a + 4}`,
        name: "You (Judge Demo)",
        status: "waiting",
        isUser: !0,
      },
      {
        id: "sim-5",
        token: `${t}${a + 5}`,
        name: "Rohan Verma",
        status: "waiting",
        isUser: !1,
      },
    ];
  return {
    industry: s,
    businessName: i.businessName,
    queueName: i.queueName,
    counterName: i.counterName,
    isPaused: !1,
    nowServing: r,
    waitingList: l,
    servedList: [],
    velocityMinutes: i.defaultVelocity,
    recentActivity: [
      {
        id: "act-1",
        text: `Token ${r.token} called to ${i.counterName}`,
        time: "Just now",
      },
      { id: "act-0", text: "Queue opened for today's session", time: "2m ago" },
    ],
    userToken: `${t}${a + 4}`,
    userGraceExpiresAt: null,
    stepCount: 0,
  };
}
function de(s) {
  if (s.waitingList.length === 0) return s;
  const [i, ...t] = s.waitingList,
    a = s.nowServing
      ? [{ ...s.nowServing, status: "served" }, ...s.servedList]
      : s.servedList,
    r = { ...i, status: "called" },
    l = [
      {
        id: `act-${Date.now()}-${Math.random()}`,
        text: `Token ${r.token} (${r.name}) called to ${s.counterName}`,
        time: "Just now",
      },
      ...s.recentActivity.slice(0, 5),
    ];
  return {
    ...s,
    nowServing: r,
    waitingList: t,
    servedList: a,
    recentActivity: l,
    stepCount: s.stepCount + 1,
  };
}
function ce(s) {
  if (!s.nowServing) return s;
  const i = { ...s.nowServing, status: "served" };
  return {
    ...s,
    nowServing: null,
    servedList: [i, ...s.servedList],
    recentActivity: [
      {
        id: `act-${Date.now()}`,
        text: `Token ${i.token} marked as served`,
        time: "Just now",
      },
      ...s.recentActivity.slice(0, 5),
    ],
    stepCount: s.stepCount + 1,
  };
}
function xe(s) {
  const i = s.waitingList[s.waitingList.length - 1],
    t = i ? i.token : s.nowServing ? s.nowServing.token : "A-100",
    a = t.split("-")[0] + "-",
    r = parseInt(t.split("-")[1] || "100", 10),
    l = [
      "Ananya Desai",
      "Kabir Sen",
      "Meera Joshi",
      "Aditya Nair",
      "Sneha Rao",
    ],
    d = [
      {
        id: `sim-new-${Date.now()}-1`,
        token: `${a}${r + 1}`,
        name: l[Math.floor(Math.random() * l.length)],
        status: "waiting",
        isUser: !1,
      },
      {
        id: `sim-new-${Date.now()}-2`,
        token: `${a}${r + 2}`,
        name: l[Math.floor(Math.random() * l.length)],
        status: "waiting",
        isUser: !1,
      },
      {
        id: `sim-new-${Date.now()}-3`,
        token: `${a}${r + 3}`,
        name: l[Math.floor(Math.random() * l.length)],
        status: "waiting",
        isUser: !1,
      },
    ];
  return {
    ...s,
    waitingList: [...s.waitingList, ...d],
    recentActivity: [
      {
        id: `act-${Date.now()}`,
        text: `3 new walk-ins joined (${d[0].token} - ${d[2].token})`,
        time: "Just now",
      },
      ...s.recentActivity.slice(0, 5),
    ],
  };
}
function me(s) {
  const i = Date.now() + 12e4,
    t = s.waitingList.map((r) =>
      r.isUser ? { ...r, status: "grace", graceExpiresAt: i } : r,
    ),
    a =
      s.nowServing && s.nowServing.isUser
        ? { ...s.nowServing, status: "grace", graceExpiresAt: i }
        : s.nowServing;
  return {
    ...s,
    waitingList: t,
    nowServing: a,
    userGraceExpiresAt: i,
    recentActivity: [
      {
        id: `act-${Date.now()}`,
        text: `⏳ Arrival grace requested by ${s.userToken} (2 min hold)`,
        time: "Just now",
      },
      ...s.recentActivity.slice(0, 5),
    ],
  };
}
function ue(s) {
  var m, f, u;
  const i = s.waitingList.findIndex((w) => w.isUser);
  if (((m = s.nowServing) == null ? void 0 : m.isUser) || !1)
    return {
      status:
        ((f = s.nowServing) == null ? void 0 : f.status) === "grace"
          ? "grace"
          : "called",
      aheadCount: 0,
      estimatedWaitMinutes: 0,
      headline: "It's your turn!",
      subtext: `Please proceed to ${s.counterName}`,
      progressPercentage: 100,
    };
  if (i === -1)
    return s.servedList.some((g) => g.isUser)
      ? {
          status: "served",
          aheadCount: 0,
          estimatedWaitMinutes: 0,
          headline: "Visit Complete",
          subtext: "Thank you for visiting. Your session is finished.",
          progressPercentage: 100,
        }
      : {
          status: "not_in_queue",
          aheadCount: 0,
          estimatedWaitMinutes: 0,
          headline: "Not in Queue",
          subtext: "Please join the queue to take a ticket.",
          progressPercentage: 0,
        };
  const a = i,
    r = (a + 1) * s.velocityMinutes,
    l = ((u = s.waitingList[i]) == null ? void 0 : u.status) === "grace";
  let d = `In Line • ${a} ahead`,
    o = `Estimated wait: ~${r} minutes`;
  (a === 0 &&
    ((d = "You're Next in Line"),
    (o = "Please get ready to approach the counter")),
    l &&
      ((d = "⏳ Arrival Grace Active"),
      (o = "Staff has been notified. 2-minute hold in progress.")));
  const x = 5,
    b = Math.min(90, Math.max(15, Math.round(((x - a) / x) * 85)));
  return {
    status: l ? "grace" : a === 0 ? "next" : "waiting",
    aheadCount: a,
    estimatedWaitMinutes: r,
    headline: d,
    subtext: o,
    progressPercentage: b,
  };
}
const U = ({
    state: s,
    onCallNext: i,
    onServeCurrent: t,
    onSimulateTraffic: a,
    onTogglePause: r,
  }) => {
    var l, d, o;
    return e.jsxs("div", {
      className:
        "flex flex-col h-full rounded-3xl border border-border/80 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden",
      children: [
        e.jsxs("div", {
          className:
            "px-5 py-3.5 border-b border-border/60 bg-muted/40 flex items-center justify-between select-none",
          children: [
            e.jsxs("div", {
              className: "flex items-center gap-2",
              children: [
                e.jsxs("div", {
                  className: "flex items-center gap-1.5",
                  children: [
                    e.jsx("span", {
                      className:
                        "w-3 h-3 rounded-full bg-rose-500/80 inline-block",
                    }),
                    e.jsx("span", {
                      className:
                        "w-3 h-3 rounded-full bg-amber-500/80 inline-block",
                    }),
                    e.jsx("span", {
                      className:
                        "w-3 h-3 rounded-full bg-emerald-500/80 inline-block",
                    }),
                  ],
                }),
                e.jsxs("span", {
                  className:
                    "ml-3 text-xs font-bold font-mono tracking-tight text-foreground/80",
                  children: ["Qblink Counter Terminal • ", s.counterName],
                }),
              ],
            }),
            e.jsx("div", {
              className: "flex items-center gap-2",
              children: e.jsxs("span", {
                className:
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold",
                children: [
                  e.jsx("span", {
                    className:
                      "w-2 h-2 rounded-full bg-emerald-500 animate-pulse",
                  }),
                  "Live Sync Active",
                ],
              }),
            }),
          ],
        }),
        e.jsxs("div", {
          className:
            "p-5 sm:p-6 flex-1 flex flex-col justify-between gap-6 overflow-y-auto",
          children: [
            e.jsxs("div", {
              className: "flex items-start justify-between flex-wrap gap-2",
              children: [
                e.jsxs("div", {
                  children: [
                    e.jsx("h2", {
                      className:
                        "text-xl font-extrabold text-foreground tracking-tight",
                      children: s.businessName,
                    }),
                    e.jsx("p", {
                      className:
                        "text-xs text-muted-foreground font-medium mt-0.5",
                      children: s.queueName,
                    }),
                  ],
                }),
                e.jsxs("button", {
                  onClick: r,
                  className: `px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${s.isPaused ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"}`,
                  children: [
                    s.isPaused
                      ? e.jsx(G, { className: "w-3.5 h-3.5" })
                      : e.jsx(K, { className: "w-3.5 h-3.5" }),
                    e.jsx("span", {
                      children: s.isPaused ? "Resume Queue" : "Pause Queue",
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs("div", {
              className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
              children: [
                e.jsxs("div", {
                  className:
                    "p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-between",
                  children: [
                    e.jsxs("span", {
                      className:
                        "text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1",
                      children: [
                        e.jsx(E, { className: "w-3 h-3" }),
                        " Now Serving",
                      ],
                    }),
                    e.jsx(
                      c.p,
                      {
                        initial: { scale: 0.9, opacity: 0 },
                        animate: { scale: 1, opacity: 1 },
                        className:
                          "text-2xl font-black font-mono text-foreground mt-1",
                        children: s.nowServing ? s.nowServing.token : "—",
                      },
                      ((l = s.nowServing) == null ? void 0 : l.token) || "none",
                    ),
                    e.jsx("span", {
                      className: "text-[11px] text-muted-foreground truncate",
                      children: s.nowServing ? s.nowServing.name : (s.industry === "clinic" ? "Doctor ready" : "Queue idle"),
                    }),
                  ],
                }),
                e.jsxs("div", {
                  className:
                    "p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex flex-col justify-between",
                  children: [
                    e.jsxs("span", {
                      className:
                        "text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1",
                      children: [
                        e.jsx(O, { className: "w-3 h-3" }),
                        " In Line",
                      ],
                    }),
                    e.jsx("p", {
                      className: "text-2xl font-black text-foreground mt-1",
                      children: s.waitingList.length,
                    }),
                    e.jsx("span", {
                      className: "text-[11px] text-muted-foreground",
                      children: s.industry === "clinic" ? "Waiting patients" : "Waiting guests",
                    }),
                  ],
                }),
                e.jsxs("div", {
                  className:
                    "p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex flex-col justify-between",
                  children: [
                    e.jsxs("span", {
                      className:
                        "text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1",
                      children: [
                        e.jsx(k, { className: "w-3 h-3 text-amber-500" }),
                        " Velocity",
                      ],
                    }),
                    e.jsxs("p", {
                      className: "text-2xl font-black text-foreground mt-1",
                      children: [s.velocityMinutes, "m"],
                    }),
                    e.jsx("span", {
                      className: "text-[11px] text-muted-foreground",
                      children: "Per turn pace",
                    }),
                  ],
                }),
                e.jsxs("div", {
                  className:
                    "p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex flex-col justify-between",
                  children: [
                    e.jsxs("span", {
                      className:
                        "text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1",
                      children: [
                        e.jsx(Z, { className: "w-3 h-3 text-emerald-500" }),
                        s.industry === "clinic" ? " Consulted" : " Served",
                      ],
                    }),
                    e.jsx("p", {
                      className: "text-2xl font-black text-foreground mt-1",
                      children: s.servedList.length,
                    }),
                    e.jsx("span", {
                      className: "text-[11px] text-muted-foreground",
                      children: s.industry === "clinic" ? "Patients today" : "Completed today",
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs("div", {
              className: "flex flex-wrap items-center gap-3",
              children: [
                (() => {
                  const isClinic = s.industry === "clinic";
                  const isLastPatient = isClinic && s.waitingList.length === 0 && Boolean(s.nowServing);
                  const isQueueEmpty = s.waitingList.length === 0 && !s.nowServing;

                  const buttonLabel = isClinic
                    ? isLastPatient
                      ? "Complete Consultation"
                      : isQueueEmpty
                        ? "No Patients Waiting"
                        : "Call Next Patient"
                    : "Call Next Guest";

                  const buttonDisabled = s.isPaused || (isClinic ? isQueueEmpty : s.waitingList.length === 0);
                  const buttonAction = isLastPatient ? t : i;
                  const buttonIcon = isLastPatient ? Q : E;

                  return e.jsxs(c.button, {
                    whileHover: { scale: 1.02 },
                    whileTap: { scale: 0.98 },
                    onClick: buttonAction,
                    disabled: buttonDisabled,
                    title: buttonLabel,
                    "aria-label": buttonLabel,
                    className:
                      "flex-1 min-w-[160px] py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-lg shadow-primary/25 hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 transition-all",
                    children: [
                      e.jsx(buttonIcon, { className: "w-4 h-4" }),
                      e.jsx("span", { children: buttonLabel }),
                      e.jsx("span", {
                        className:
                          "text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono hidden sm:inline-block",
                        children: "[Space]",
                      }),
                    ],
                  });
                })(),
                s.industry === "clinic"
                  ? (s.nowServing && s.waitingList.length > 0 &&
                      e.jsxs("span", {
                        className:
                          "text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm select-none",
                        children: [
                          e.jsx("span", {
                            className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse",
                          }),
                          e.jsx("span", {
                            children: "Auto-completes on Next Patient",
                          }),
                        ],
                      }))
                  : (s.nowServing &&
                      e.jsxs(c.button, {
                        whileHover: { scale: 1.02 },
                        whileTap: { scale: 0.98 },
                        onClick: t,
                        title: "Mark Served",
                        "aria-label": "Mark Served",
                        className:
                          "py-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 flex items-center gap-1.5",
                        children: [
                          e.jsx(Q, { className: "w-4 h-4" }),
                          e.jsx("span", { children: "Mark Served" }),
                        ],
                      })),
                e.jsxs(c.button, {
                  whileHover: { scale: 1.02 },
                  whileTap: { scale: 0.98 },
                  onClick: a,
                  className:
                    "py-3.5 px-4 rounded-2xl bg-muted/60 border border-border text-foreground font-bold text-xs hover:bg-muted flex items-center gap-1.5",
                  children: [
                    e.jsx(F, { className: "w-4 h-4 text-primary" }),
                    e.jsx("span", { children: "+3 Walk-ins" }),
                  ],
                }),
              ],
            }),
            e.jsxs("div", {
              className:
                "flex-1 border border-slate-700/60 rounded-2xl overflow-hidden bg-slate-900/95 flex flex-col",
              children: [
                e.jsxs("div", {
                  className:
                    "px-4 py-2.5 bg-slate-800/90 border-b border-slate-700/60 text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between",
                  children: [
                    e.jsxs("span", {
                      children: [
                        "Live Queue Manifest (",
                        s.waitingList.length,
                        " waiting)",
                      ],
                    }),
                    e.jsx("span", {
                      className: "text-[10px] text-slate-400",
                      children: "Order of Arrival",
                    }),
                  ],
                }),
                e.jsx("div", {
                  className:
                    "divide-y divide-slate-800/80 overflow-y-auto max-h-[220px]",
                  children:
                    s.waitingList.length === 0
                      ? e.jsx("div", {
                          className:
                            "py-8 text-center text-xs text-slate-400",
                          children:
                            'Queue is empty. Click "+3 Walk-ins" to simulate arrivals.',
                        })
                      : s.waitingList.map((x, b) => {
                          const m = x.isUser,
                            f = x.status === "grace";
                          return e.jsxs(
                            c.div,
                            {
                              key: x.id,
                              layout: !0,
                              initial: { opacity: 0, x: -10 },
                              animate: { opacity: 1, x: 0 },
                              className: `px-4 py-2.5 flex items-center justify-between text-xs transition-colors ${m ? "bg-teal-500/15 border-l-4 border-l-teal-400 font-semibold" : "hover:bg-slate-800/50"}`,
                              children: [
                                e.jsxs("div", {
                                  className: "flex items-center gap-3",
                                  children: [
                                    e.jsxs("span", {
                                      className:
                                        "w-5 text-slate-400 font-mono text-[11px]",
                                      children: ["#", b + 1],
                                    }),
                                    e.jsx("span", {
                                      className:
                                        "font-mono font-bold text-teal-300 text-sm",
                                      children: x.token,
                                    }),
                                    e.jsx("span", {
                                      className:
                                        "text-slate-100 font-medium",
                                      children: x.name,
                                    }),
                                    m &&
                                      e.jsx("span", {
                                        className:
                                          "px-2 py-0.5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wide",
                                        children: "Judge Phone",
                                      }),
                                  ],
                                }),
                                e.jsx("div", {
                                  className: "flex items-center gap-2",
                                  children: f
                                    ? e.jsxs("span", {
                                        className:
                                          "px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center gap-1",
                                        children: [
                                          e.jsx(L, {
                                            className: "w-3 h-3 animate-spin",
                                          }),
                                          " Grace Hold (2m)",
                                        ],
                                      })
                                    : e.jsxs("span", {
                                        className:
                                          "text-slate-300 text-[11px] font-mono",
                                        children: [
                                          "~",
                                          (b + 1) * s.velocityMinutes,
                                          "m wait",
                                        ],
                                      }),
                                }),
                              ],
                            },
                            x.id,
                          );
                        }),
                }),
              ],
            }),
            e.jsxs("div", {
              className:
                "pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between",
              children: [
                e.jsxs("div", {
                  className: "flex items-center gap-2 truncate",
                  children: [
                    e.jsx("span", {
                      className:
                        "w-1.5 h-1.5 rounded-full bg-primary animate-ping",
                    }),
                    e.jsx("span", {
                      className: "truncate",
                      children:
                        ((d = s.recentActivity[0]) == null ? void 0 : d.text) ||
                        "Queue initialized",
                    }),
                  ],
                }),
                e.jsx("span", {
                  className:
                    "font-mono text-[10px] shrink-0 text-muted-foreground/70",
                  children:
                    ((o = s.recentActivity[0]) == null ? void 0 : o.time) ||
                    "Live",
                }),
              ],
            }),
          ],
        }),
      ],
    });
  },
  A = ({ state: s, onRequestGrace: i }) => {
    const t = ue(s),
      [a, r] = h.useState<string | null>(null);
    h.useEffect(() => {
      t.status === "called"
        ? r(`🎉 It's your turn! Proceed to ${s.counterName}`)
        : t.status === "next"
          ? r("⚡ You're next in line! (0 people ahead)")
          : t.status === "grace"
            ? r("⏳ Arrival grace active (2 min hold)")
            : t.aheadCount <= 2 &&
              t.aheadCount > 0 &&
              r(`Ticket ${s.userToken}: ${t.aheadCount} people ahead`);
      const l = setTimeout(() => r(null), 4500);
      return () => clearTimeout(l);
    }, [t.status, t.aheadCount, s.counterName, s.userToken]);
    return e.jsxs("div", {
        className:
          "relative mx-auto w-full max-w-[340px] sm:max-w-[360px] aspect-[9/18.5] rounded-[48px] p-3.5 bg-slate-900 border-[7px] border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden select-none",
        children: [
          e.jsxs("div", {
            className:
              "relative z-30 pt-2 pb-1 px-4 flex items-center justify-between text-[11px] font-semibold text-slate-300",
            children: [
              e.jsx("span", { className: "font-mono", children: "9:41" }),
              e.jsxs("div", {
                className:
                  "w-24 h-5 rounded-full bg-black flex items-center justify-center gap-2 px-2 shadow-inner",
                children: [
                  e.jsx("span", {
                    className:
                      "w-2 h-2 rounded-full bg-emerald-500 animate-pulse",
                  }),
                  e.jsx("span", {
                    className:
                      "text-[9px] font-mono text-emerald-400 font-bold",
                    children: "Qblink",
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "flex items-center gap-1.5",
                children: [
                  e.jsx(_, { className: "w-3 h-3" }),
                  e.jsx(oe, { className: "w-3.5 h-3.5" }),
                ],
              }),
            ],
          }),
          e.jsx(H, {
            children:
              a &&
              e.jsxs(c.div, {
                initial: { opacity: 0, y: -20, scale: 0.95 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: { opacity: 0, y: -20, scale: 0.95 },
                className:
                  "absolute top-11 inset-x-4 z-40 p-3 rounded-2xl bg-slate-900/95 border border-primary/40 text-slate-100 shadow-2xl backdrop-blur-xl flex items-center gap-2.5",
                children: [
                  e.jsx("div", {
                    className:
                      "w-7 h-7 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0",
                    children: e.jsx(X, { className: "w-3.5 h-3.5" }),
                  }),
                  e.jsxs("div", {
                    className: "min-w-0 flex-1",
                    children: [
                      e.jsx("p", {
                        className:
                          "text-[10px] font-bold text-primary uppercase tracking-wide",
                        children: "Qblink Alert",
                      }),
                      e.jsx("p", {
                        className: "text-xs font-semibold truncate",
                        children: a,
                      }),
                    ],
                  }),
                ],
              }),
          }),
          e.jsxs("div", {
            className:
              "relative z-10 flex-1 rounded-[36px] bg-background border border-border/50 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto text-foreground",
            children: [
              e.jsxs("div", {
                children: [
                  e.jsxs("div", {
                    className:
                      "flex items-center justify-between pb-3 border-b border-border/60",
                    children: [
                      e.jsxs("div", {
                        children: [
                          e.jsx("p", {
                            className:
                              "text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
                            children: "Digital Queue Pass",
                          }),
                          e.jsx("h3", {
                            className:
                              "text-sm font-black text-foreground truncate max-w-[190px]",
                            children: s.businessName,
                          }),
                        ],
                      }),
                      e.jsxs("span", {
                        className:
                          "px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1",
                        children: [
                          e.jsx("span", {
                            className:
                              "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping",
                          }),
                          "Live",
                        ],
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "my-4 text-center",
                    children: [
                      e.jsx("span", {
                        className:
                          "text-[11px] font-bold uppercase tracking-widest text-muted-foreground",
                        children: "Your Token",
                      }),
                      e.jsx(
                        c.div,
                        {
                          className:
                            "font-mono font-black text-4xl text-primary tracking-tight my-1",
                          whileHover: { scale: 1.05 },
                          children: s.userToken,
                        },
                        s.userToken,
                      ),
                      e.jsx("p", {
                        className: "text-xs text-muted-foreground font-medium",
                        children: s.queueName,
                      }),
                    ],
                  }),
                  e.jsxs(
                    c.div,
                    {
                      initial: { scale: 0.96, opacity: 0 },
                      animate: { scale: 1, opacity: 1 },
                      className: `p-4 rounded-2xl border text-center transition-all ${t.status === "called" ? "bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-lg shadow-emerald-500/10" : t.status === "next" ? "bg-amber-500/15 border-amber-500 text-amber-950 dark:text-amber-100" : t.status === "grace" ? "bg-amber-500/20 border-amber-500 text-amber-900 dark:text-amber-100 animate-pulse" : "bg-card border-border shadow-xs"}`,
                      children: [
                        e.jsxs("div", {
                          className:
                            "flex items-center justify-center gap-1.5 mb-1",
                          children: [
                            t.status === "called"
                              ? e.jsx(M, {
                                  className: "w-4 h-4 text-emerald-500",
                                })
                              : t.status === "next"
                                ? e.jsx(k, {
                                    className: "w-4 h-4 text-amber-500",
                                  })
                                : t.status === "grace"
                                  ? e.jsx(L, {
                                      className: "w-4 h-4 text-amber-500",
                                    })
                                  : e.jsx(ee, {
                                      className: "w-3.5 h-3.5 text-primary",
                                    }),
                            e.jsx("span", {
                              className:
                                "text-xs font-bold uppercase tracking-wider",
                              children: t.headline,
                            }),
                          ],
                        }),
                        e.jsx("p", {
                          className: "text-xs opacity-80 leading-snug",
                          children: t.subtext,
                        }),
                      ],
                    },
                    t.status,
                  ),
                  e.jsxs("div", {
                    className: "grid grid-cols-2 gap-2.5 my-4",
                    children: [
                      e.jsxs("div", {
                        className:
                          "p-2.5 rounded-xl bg-muted/40 border border-border/50 text-center",
                        children: [
                          e.jsx("span", {
                            className:
                              "text-[10px] text-muted-foreground block",
                            children: "Ahead of You",
                          }),
                          e.jsx("span", {
                            className:
                              "text-lg font-bold font-mono text-foreground",
                            children: t.aheadCount,
                          }),
                        ],
                      }),
                      e.jsxs("div", {
                        className:
                          "p-2.5 rounded-xl bg-muted/40 border border-border/50 text-center",
                        children: [
                          e.jsx("span", {
                            className:
                              "text-[10px] text-muted-foreground block",
                            children: "Estimated Wait",
                          }),
                          e.jsxs("span", {
                            className:
                              "text-lg font-bold font-mono text-foreground",
                            children: [t.estimatedWaitMinutes, "m"],
                          }),
                        ],
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className: "space-y-1.5 mb-4",
                    children: [
                      e.jsxs("div", {
                        className:
                          "flex items-center justify-between text-[10px] font-semibold text-muted-foreground",
                        children: [
                          e.jsx("span", { children: "Queue Journey" }),
                          e.jsxs("span", {
                            className: "font-mono",
                            children: [t.progressPercentage, "%"],
                          }),
                        ],
                      }),
                      e.jsx("div", {
                        className:
                          "h-2 w-full rounded-full bg-muted overflow-hidden",
                        children: e.jsx(c.div, {
                          className: "h-full bg-primary rounded-full",
                          animate: { width: `${t.progressPercentage}%` },
                          transition: {
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                          },
                        }),
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "space-y-3 pt-2",
                children: [
                  (t.aheadCount <= 1 || t.status === "called") &&
                    t.status !== "grace" &&
                    e.jsxs(c.button, {
                      whileHover: { scale: 1.02 },
                      whileTap: { scale: 0.98 },
                      onClick: i,
                      className:
                        "w-full py-3 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-500/20 flex items-center justify-center gap-1.5 transition-colors",
                      children: [
                        e.jsx(L, { className: "w-3.5 h-3.5" }),
                        e.jsx("span", {
                          children: "I'm 2 Mins Away (Hold Spot)",
                        }),
                      ],
                    }),
                  e.jsxs("div", {
                    className:
                      "p-2.5 rounded-xl bg-muted/30 border border-border/40 text-[10px] text-muted-foreground flex items-center gap-2",
                    children: [
                      e.jsx(z, {
                        className: "w-3.5 h-3.5 text-primary shrink-0",
                      }),
                      e.jsx("span", {
                        children:
                          "Real-time browser updates. No app download needed.",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          e.jsx("div", {
            className: "pt-2 pb-1 flex justify-center",
            children: e.jsx("div", {
              className: "w-32 h-1 rounded-full bg-slate-600",
            }),
          }),
        ],
      });
  },
  q = ({ state: s }) => {
    var a;
    const i = ((a = s.nowServing) == null ? void 0 : a.token) || "—",
      t = s.waitingList.slice(0, 4);
    return e.jsxs("div", {
      className:
        "flex flex-col h-full rounded-3xl border-2 border-primary/30 bg-[#070b14] text-slate-100 shadow-2xl overflow-hidden p-6 justify-between relative",
      children: [
        e.jsx("div", {
          className:
            "absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none",
        }),
        e.jsxs("div", {
          className:
            "flex items-center justify-between pb-4 border-b border-slate-800 relative z-10",
          children: [
            e.jsxs("div", {
              className: "flex items-center gap-3",
              children: [
                e.jsx("div", {
                  className:
                    "w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black",
                  children: "Q",
                }),
                e.jsxs("div", {
                  children: [
                    e.jsx("h3", {
                      className: "text-sm font-black text-white",
                      children: s.businessName,
                    }),
                    e.jsxs("p", {
                      className: "text-[10px] text-slate-400 font-mono",
                      children: ["● LIVE TV BROADCAST · ", s.queueName],
                    }),
                  ],
                }),
              ],
            }),
            e.jsx("div", {
              className: "flex items-center gap-2",
              children: e.jsxs("span", {
                className:
                  "px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1",
                children: [
                  e.jsx("span", {
                    className:
                      "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping",
                  }),
                  "LIVE SYNC",
                ],
              }),
            }),
          ],
        }),
        e.jsxs("div", {
          className: "my-auto text-center py-4 relative z-10",
          children: [
            e.jsx("span", {
              className:
                "font-mono text-xs font-black uppercase tracking-[0.25em] text-primary",
              children: "NOW SERVING",
            }),
            e.jsx("div", {
              className: "py-2",
              children: e.jsx(H, {
                mode: "wait",
                children: e.jsx(
                  c.div,
                  {
                    initial: { scale: 0.8, opacity: 0 },
                    animate: { scale: 1, opacity: 1 },
                    exit: { scale: 1.15, opacity: 0 },
                    transition: { type: "spring", stiffness: 300, damping: 20 },
                    className:
                      "font-mono font-black text-6xl sm:text-7xl text-white tracking-tight drop-shadow-md",
                    children: i,
                  },
                  i,
                ),
              }),
            }),
            e.jsxs("div", {
              className:
                "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold shadow-xs",
              children: [
                e.jsx(M, { className: "w-3.5 h-3.5 text-primary" }),
                e.jsx("span", { children: s.counterName }),
              ],
            }),
          ],
        }),
        e.jsxs("div", {
          className:
            "space-y-3 relative z-10 pt-2 border-t border-slate-800/80",
          children: [
            e.jsxs("div", {
              className:
                "flex items-center justify-between text-[11px] text-slate-400 font-semibold font-mono",
              children: [
                e.jsx("span", { children: "UP NEXT IN LINE" }),
                e.jsxs("span", {
                  children: [s.waitingList.length, " WAITING"],
                }),
              ],
            }),
            e.jsx("div", {
              className: "grid grid-cols-4 gap-2",
              children: t.map((r, l) =>
                e.jsxs(
                  "div",
                  {
                    key: r.id || `upnext-${l}`,
                    className: `p-2 rounded-xl text-center border ${r.isUser ? "bg-primary/20 border-primary/50 text-primary" : "bg-slate-900/60 border-slate-800 text-slate-300"}`,
                    children: [
                      e.jsxs("span", {
                        className: "text-[9px] font-mono block text-slate-400",
                        children: ["#", l + 1],
                      }),
                      e.jsx("span", {
                        className: "font-mono font-black text-xs",
                        children: r.token,
                      }),
                    ],
                  },
                  r.id,
                ),
              ),
            }),
          ],
        }),
      ],
    });
  },
  ge = () => {
    const [s, i] = h.useState("clinic"),
      [t, a] = h.useState(() => W("clinic")),
      [r, l] = h.useState(!1),
      [d, o] = h.useState(""),
      [x, b] = h.useState(!1),
      [m, f] = h.useState("dual"),
      [u, w] = h.useState(!0),
      g = h.useRef(null),
      N = () => {
        (b(!0), setTimeout(() => b(!1), 800));
      },
      j = () => {
        (a((n) => {
          const p = de(n);
          return (
            u &&
              p.nowServing &&
              ($.playCallNextChime(),
              le({
                tokenNumber: p.nowServing.token,
                counterLabel: p.counterName,
                enabled: u,
              })),
            p
          );
        }),
          N());
      },
      I = () => {
        (a((n) => ce(n)), u && $.playServedChime(), N());
      },
      V = () => {
        (a((n) => xe(n)), u && $.playNewVisitorChime(), N());
      },
      v = () => {
        (a((n) => me(n)), N());
      },
      D = () => {
        (a((n) => ({ ...n, isPaused: !n.isPaused })), N());
      },
      S = (n = s) => {
        (g.current && clearInterval(g.current), l(!1), o(""), a(W(n)), N());
      },
      J = (n) => {
        (i(n), S(n));
      };
    h.useEffect(() => {
      const n = (p) => {
        var y;
        p.code === "Space" &&
          (p.target === document.body ||
            ((y = p.target) == null ? void 0 : y.tagName) === "BODY") &&
          (p.preventDefault(), (s === "clinic" && t.waitingList.length === 0 && Boolean(t.nowServing)) ? I() : j());
      };
      return (
        window.addEventListener("keydown", n),
        () => window.removeEventListener("keydown", n)
      );
    }, [u, s, t]);
    h.useEffect(() => {
      return () => {
        if (g.current) clearInterval(g.current);
      };
    }, []);
    const B = () => {
      (S(), l(!0));
      let n = 0;
      (o("Step 1: Front desk calls the first customer in line..."),
        (g.current = setInterval(() => {
          (n++,
            n === 1
              ? (j(),
                o(
                  "Step 2: Notice instant sub-10ms browser sync on customer's phone!",
                ))
              : n === 2
                ? (j(),
                  o(
                    "Step 3: Queue progresses — customer holds spot from cafe nearby.",
                  ))
                : n === 3
                  ? (j(),
                    o(
                      "Step 4: Customer is next! Turn notification triggers arrival alert.",
                    ))
                  : n === 4
                    ? (v(),
                      o(
                        "Step 5: Customer taps 'I\\'m 2 mins away' — zero missed turns or desk chaos.",
                      ))
                    : n === 5
                      ? (j(),
                        o(
                          "Step 6: Customer called to Consultation Room 3 with audio chime!",
                        ))
                      : n >= 6 &&
                        (g.current && clearInterval(g.current),
                        l(!1),
                        o(
                          "Demo complete! All 3 endpoints synchronized flawlessly.",
                        )));
        }, 4e3)));
    };
    return e.jsxs("div", {
      className:
        "min-h-screen bg-slate-950 text-slate-100 dark flex flex-col justify-between selection:bg-primary selection:text-white",
      children: [
        e.jsx(SEO, {
          title: "Live Pitch Simulator — Qblink Zero-Hardware Queue Flow",
          description:
            "Interactive real-time demonstration of Qblink: staff counter terminal, customer mobile ticket, and lobby TV kiosk synchronized with zero hardware.",
          path: "/pitch",
        }),
        e.jsx("header", {
          className:
            "border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl px-5 sm:px-8 py-3.5 sticky top-0 z-50",
          children: e.jsxs("div", {
            className:
              "max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4",
            children: [
              e.jsxs("div", {
                className: "flex items-center gap-3",
                children: [
                  e.jsxs(se, {
                    to: "/",
                    className:
                      "inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900 transition-colors",
                    children: [
                      e.jsx(te, { className: "w-3.5 h-3.5" }),
                      e.jsx("span", { children: "Back to Qblink" }),
                    ],
                  }),
                  e.jsx("div", {
                    className: "h-4 w-[1px] bg-slate-800 hidden sm:block",
                  }),
                  e.jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                      e.jsx("img", {
                        src: ae,
                        alt: "Qblink",
                        className:
                          "w-6 h-6 object-contain ring-1 ring-primary/30 rounded-md",
                      }),
                      e.jsx("span", {
                        className:
                          "font-display font-extrabold text-sm tracking-tight text-white",
                        children: "Live Pitch Simulator",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsx("div", {
                className:
                  "flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800",
                children: Object.keys(P).map((n) => {
                  const p = P[n],
                    y = s === n;
                  return e.jsx(
                    "button",
                    {
                      key: n,
                      onClick: () => J(n),
                      className: `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${y ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-slate-200"}`,
                      children: p.label,
                    },
                    n,
                  );
                }),
              }),
              e.jsxs("div", {
                className:
                  "hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs",
                children: [
                  e.jsx("button", {
                    onClick: () => f("dual"),
                    className: `px-2.5 py-1 rounded-lg font-bold transition-colors ${m === "dual" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"}`,
                    children: "Dual View",
                  }),
                  e.jsx("button", {
                    onClick: () => f("triple"),
                    className: `px-2.5 py-1 rounded-lg font-bold transition-colors ${m === "triple" ? "bg-primary text-white" : "text-slate-400 hover:text-slate-200"}`,
                    children: "Triple Matrix",
                  }),
                  e.jsx("button", {
                    onClick: () => f("tv"),
                    className: `px-2.5 py-1 rounded-lg font-bold transition-colors ${m === "tv" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"}`,
                    children: "TV Kiosk Focus",
                  }),
                ],
              }),
              e.jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  e.jsx("button", {
                    onClick: () => w((n) => !n),
                    title: u
                      ? "Mute simulator audio"
                      : "Enable simulator audio",
                    className: `p-2 rounded-xl border text-xs font-bold transition-colors ${u ? "bg-primary/20 border-primary/40 text-primary" : "bg-slate-800 border-slate-700 text-slate-400"}`,
                    children: u
                      ? e.jsx(re, { className: "w-3.5 h-3.5" })
                      : e.jsx(ne, { className: "w-3.5 h-3.5" }),
                  }),
                  e.jsxs("button", {
                    onClick: B,
                    disabled: r,
                    className: `px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${r ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"}`,
                    children: [
                      e.jsx(G, { className: "w-3.5 h-3.5" }),
                      e.jsx("span", {
                        children: r ? "Tour Running…" : "Auto 60s Tour",
                      }),
                    ],
                  }),
                  e.jsxs("button", {
                    onClick: () => S(),
                    className:
                      "px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors",
                    children: [
                      e.jsx(ie, { className: "w-3.5 h-3.5" }),
                      e.jsx("span", { children: "Reset" }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        e.jsxs("main", {
          className:
            "max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-between w-full",
          children: [
            e.jsxs("div", {
              className: "text-center mb-6",
              children: [
                d
                  ? e.jsxs(
                      c.div,
                      {
                        initial: { opacity: 0, y: -8 },
                        animate: { opacity: 1, y: 0 },
                        className:
                          "inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-primary/20 border-2 border-primary/50 text-white text-xs sm:text-sm font-bold shadow-lg mb-3",
                        children: [
                          e.jsx("span", {
                            className:
                              "w-2.5 h-2.5 rounded-full bg-primary animate-ping",
                          }),
                          e.jsx("span", { children: d }),
                        ],
                      },
                      d,
                    )
                  : e.jsxs("div", {
                      className:
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold uppercase tracking-widest mb-2",
                      children: [
                        e.jsx(M, { className: "w-3.5 h-3.5" }),
                        " Real-time Interactive Sandbox",
                      ],
                    }),
                e.jsx("h1", {
                  className:
                    "text-2xl sm:text-4xl font-black text-white tracking-tight",
                  children: "One Single Platform. Zero Dedicated Hardware.",
                }),
                e.jsxs("p", {
                  className:
                    "text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl mx-auto",
                  children: [
                    "Click ",
                    e.jsx("strong", {
                      className: "text-primary font-bold",
                      children: s === "clinic" ? '"Call Next Patient [Space]"' : '"Call Next Guest [Space]"',
                    }),
                    " on the counter terminal and watch both the customer's phone and lobby TV board update instantly.",
                  ],
                }),
              ],
            }),
            m === "triple"
              ? e.jsxs("div", {
                  className:
                    "grid grid-cols-1 lg:grid-cols-12 gap-5 items-center",
                  children: [
                    e.jsxs("div", {
                      className: "lg:col-span-5 flex flex-col h-[520px]",
                      children: [
                        e.jsxs("div", {
                          className:
                            "flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1",
                          children: [
                            e.jsx(R, { className: "w-4 h-4 text-primary" }),
                            e.jsx("span", {
                              children: "1. Staff Counter Terminal",
                            }),
                          ],
                        }),
                        e.jsx(U, {
                          state: t,
                          onCallNext: j,
                          onServeCurrent: I,
                          onSimulateTraffic: V,
                          onTogglePause: D,
                        }),
                      ],
                    }),
                    e.jsxs("div", {
                      className: "lg:col-span-4 flex flex-col h-[520px]",
                      children: [
                        e.jsxs("div", {
                          className:
                            "flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1",
                          children: [
                            e.jsx(T, { className: "w-4 h-4 text-cyan-400" }),
                            e.jsx("span", {
                              children: "2. Public TV Waiting Kiosk",
                            }),
                          ],
                        }),
                        e.jsx(q, { state: t }),
                      ],
                    }),
                    e.jsxs("div", {
                      className: "lg:col-span-3 flex flex-col items-center",
                      children: [
                        e.jsxs("div", {
                          className:
                            "flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1",
                          children: [
                            e.jsx(C, { className: "w-4 h-4 text-emerald-400" }),
                            e.jsx("span", {
                              children: "3. Customer Mobile Pass",
                            }),
                          ],
                        }),
                        e.jsx(A, { state: t, onRequestGrace: v }),
                      ],
                    }),
                  ],
                })
              : m === "tv"
                ? e.jsxs("div", {
                    className:
                      "grid grid-cols-1 lg:grid-cols-12 gap-6 items-center",
                    children: [
                      e.jsxs("div", {
                        className: "lg:col-span-8 flex flex-col h-[560px]",
                        children: [
                          e.jsxs("div", {
                            className:
                              "flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1",
                            children: [
                              e.jsx(T, { className: "w-4 h-4 text-cyan-400" }),
                              e.jsx("span", {
                                children:
                                  "Public TV Waiting Kiosk (Full-Screen Preview)",
                              }),
                            ],
                          }),
                          e.jsx(q, { state: t }),
                        ],
                      }),
                      e.jsxs("div", {
                        className: "lg:col-span-4 flex flex-col items-center",
                        children: [
                          e.jsxs("div", {
                            className:
                              "flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1",
                            children: [
                              e.jsx(C, {
                                className: "w-4 h-4 text-emerald-400",
                              }),
                              e.jsx("span", {
                                children: "Synchronized Mobile Ticket",
                              }),
                            ],
                          }),
                          e.jsx(A, { state: t, onRequestGrace: v }),
                        ],
                      }),
                    ],
                  })
                : e.jsxs("div", {
                    className:
                      "grid grid-cols-1 lg:grid-cols-12 gap-8 items-center",
                    children: [
                      e.jsxs("div", {
                        className:
                          "lg:col-span-7 flex flex-col h-[580px] sm:h-[620px]",
                        children: [
                          e.jsxs("div", {
                            className:
                              "flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1",
                            children: [
                              e.jsx(R, { className: "w-4 h-4 text-primary" }),
                              e.jsx("span", {
                                children:
                                  "Business / Staff Counter Terminal (Desktop)",
                              }),
                            ],
                          }),
                          e.jsx(U, {
                            state: t,
                            onCallNext: j,
                            onServeCurrent: I,
                            onSimulateTraffic: V,
                            onTogglePause: D,
                          }),
                        ],
                      }),
                      e.jsxs("div", {
                        className:
                          "hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-3",
                        children: [
                          e.jsx("div", {
                            className:
                              "h-20 w-[2px] bg-gradient-to-b from-transparent via-primary/50 to-primary",
                          }),
                          e.jsx(c.div, {
                            animate: {
                              scale: x ? [1, 1.35, 1] : 1,
                              boxShadow: x
                                ? "0 0 25px hsl(var(--primary))"
                                : "0 0 0px transparent",
                            },
                            className:
                              "w-10 h-10 rounded-2xl bg-slate-900 border border-primary text-primary flex items-center justify-center shadow-lg",
                            children: e.jsx(k, { className: "w-5 h-5" }),
                          }),
                          e.jsx("span", {
                            className:
                              "text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center",
                            children: "Instant Sync",
                          }),
                          e.jsx("div", {
                            className:
                              "h-20 w-[2px] bg-gradient-to-b from-primary via-primary/50 to-transparent",
                          }),
                        ],
                      }),
                      e.jsxs("div", {
                        className: "lg:col-span-4 flex flex-col items-center",
                        children: [
                          e.jsxs("div", {
                            className:
                              "flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 self-center sm:self-start px-1",
                            children: [
                              e.jsx(C, {
                                className: "w-4 h-4 text-emerald-400",
                              }),
                              e.jsx("span", {
                                children: "Customer Mobile Ticket (Browser)",
                              }),
                            ],
                          }),
                          e.jsx(A, { state: t, onRequestGrace: v }),
                        ],
                      }),
                    ],
                  }),
          ],
        }),
        e.jsx("footer", {
          className:
            "border-t border-slate-800/80 bg-slate-900/60 px-5 sm:px-8 py-4",
          children: e.jsxs("div", {
            className:
              "max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs",
            children: [
              e.jsxs("div", {
                className:
                  "flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60",
                children: [
                  e.jsx(z, {
                    className: "w-4 h-4 text-emerald-400 shrink-0 mt-0.5",
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("p", {
                        className: "font-bold text-white",
                        children: "100% Zero-App Entry",
                      }),
                      e.jsx("p", {
                        className: "text-slate-400 text-[11px] leading-relaxed",
                        children:
                          "No App Store downloads. Instant web app runs on any smartphone.",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("div", {
                className:
                  "flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60",
                children: [
                  e.jsx(k, {
                    className: "w-4 h-4 text-amber-400 shrink-0 mt-0.5",
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("p", {
                        className: "font-bold text-white",
                        children: "Dynamic Wait Engine",
                      }),
                      e.jsx("p", {
                        className: "text-slate-400 text-[11px] leading-relaxed",
                        children:
                          "Adapts to recent service speeds, eliminating walkaway customer loss.",
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("div", {
                className:
                  "flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60",
                children: [
                  e.jsx(Q, {
                    className: "w-4 h-4 text-primary shrink-0 mt-0.5",
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("p", {
                        className: "font-bold text-white",
                        children: "Arrival Grace Window",
                      }),
                      e.jsx("p", {
                        className: "text-slate-400 text-[11px] leading-relaxed",
                        children: `"I'm 2 mins away" action reduces missed appointments by >90%.`,
                      }),
                    ],
                  }),
                ],
              }),
              e.jsxs("div", {
                className:
                  "flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60",
                children: [
                  e.jsx(T, {
                    className: "w-4 h-4 text-cyan-400 shrink-0 mt-0.5",
                  }),
                  e.jsxs("div", {
                    children: [
                      e.jsx("p", {
                        className: "font-bold text-white",
                        children: "Lobby TV Integration",
                      }),
                      e.jsx("p", {
                        className: "text-slate-400 text-[11px] leading-relaxed",
                        children:
                          "Synchronized full-screen TV kiosk with audio airport chimes.",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  };
export default ge;
export { ge as PitchDemo };

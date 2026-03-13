import React, { useEffect, useMemo, useState } from "react";
import Lenis from "lenis";
import { motion, AnimatePresence } from "framer-motion";

import {
  Plus,
  Trash2,
  Coins,
  TrendingUp,
  CalendarDays,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  Dumbbell,
  Brain,
  LayoutDashboard,
  Trophy,
  Target,
  Flame,
  ArrowLeft,
  BarChart3,
  Wallet,
  Clock3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
// Simple UI components (replacing shadcn components to avoid dependency errors)
const Card = ({ className = "", children }) => <div className={className}>{children}</div>;
const CardContent = ({ className = "", children }) => <div className={className}>{children}</div>;
const CardHeader = ({ className = "", children }) => <div className={className}>{children}</div>;
const CardTitle = ({ className = "", children }) => <h2 className={className}>{children}</h2>;
const CardDescription = ({ className = "", children }) => <p className={className}>{children}</p>;

const Button = ({ className = "", children, ...props }) => (
  <button className={className} {...props}>{children}</button>
);

const Input = (props) => <input {...props} />;
const Label = ({ children, ...props }) => <label {...props}>{children}</label>;
const Textarea = (props) => <textarea {...props} />;

const Badge = ({ className = "", children }) => (
  <span className={className}>{children}</span>
);

const Progress = ({ value = 0, className = "" }) => (
  <div className={className} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 6 }}>
    <div style={{ width: `${value}%`, height: "100%", background: "#6366f1", borderRadius: 6 }} />
  </div>
);

// Very simple replacements for dialog/select used in this demo
const Dialog = ({ children }) => <>{children}</>;
const DialogTrigger = ({ children }) => children;
const DialogContent = ({ children }) => <div>{children}</div>;
const DialogHeader = ({ children }) => <div>{children}</div>;
const DialogTitle = ({ children }) => <h3>{children}</h3>;
const DialogDescription = ({ children }) => <p>{children}</p>;

const Select = ({ children }) => <div>{children}</div>;
const SelectTrigger = ({ children }) => <div>{children}</div>;
const SelectContent = ({ children }) => <div>{children}</div>;
const SelectItem = ({ children }) => <div>{children}</div>;
const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;

const STORAGE_KEY = "daily-focus-tracker-v2";

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const fieldIcons = {
  robotics: Brain,
  "web dev": LayoutDashboard,
  gym: Dumbbell,
  reading: BookOpen,
  quran: BookOpen,
  college: Target,
};

function guessIcon(name) {
  const normalized = String(name || "").toLowerCase();
  const match = Object.keys(fieldIcons).find((key) => normalized.includes(key));
  return match ? fieldIcons[match] : Target;
}

function createInitialState() {
  return {
    coins: 0,
    totalCompleted: 0,
    fields: [
      {
        id: uid(),
        name: "Robotics",
        createdAt: todayStr(),
        tasks: [
          {
            id: uid(),
            title: "Learn linear algebra",
            date: todayStr(),
            completed: false,
            completedAt: null,
          },
          {
            id: uid(),
            title: "Work on electrical project",
            date: todayStr(),
            completed: false,
            completedAt: null,
          },
        ],
      },
      {
        id: uid(),
        name: "Gym",
        createdAt: todayStr(),
        tasks: [
          {
            id: uid(),
            title: "Complete workout session",
            date: todayStr(),
            completed: false,
            completedAt: null,
          },
        ],
      },
    ],
    celebrations: [],
  };
}

function loadState() {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return createInitialState();
    }

    const fields = Array.isArray(parsed.fields)
      ? parsed.fields
      : Array.isArray(parsed.topics)
        ? parsed.topics
        : createInitialState().fields;

    return {
      coins: Number(parsed.coins || 0),
      totalCompleted: Number(parsed.totalCompleted || 0),
      fields,
      celebrations: Array.isArray(parsed.celebrations) ? parsed.celebrations : [],
    };
  } catch {
    return createInitialState();
  }
}

function getAllTasks(fields) {
  return fields.flatMap((field) =>
    field.tasks.map((task) => ({
      ...task,
      fieldId: field.id,
      fieldName: field.name,
    }))
  );
}

function calculateStreak(allTasks) {
  const completedDays = new Set(
    allTasks.filter((task) => task.completedAt).map((task) => String(task.completedAt).slice(0, 10))
  );

  let streak = 0;
  const now = new Date();

  for (let i = 0; i < 365; i += 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (completedDays.has(key)) streak += 1;
    else break;
  }

  return streak;
}

function DashboardStat({ icon: Icon, title, value, subtitle }) {
  return (
    <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white shadow-lg shadow-indigo-900/40">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CelebrationLayer({ celebrations }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {celebrations.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="absolute right-6 top-6"
          >
            <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 px-5 py-4 text-slate-900 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500 p-2 text-white">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-slate-700">{item.message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function DailyMotivationTaskTracker() {
  const [data, setData] = useState(() => createInitialState());
  const [page, setPage] = useState("home");
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldDate, setFieldDate] = useState(todayStr());
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDate, setTaskDate] = useState(todayStr());
  const [reviewMode, setReviewMode] = useState("weekly");

  useEffect(() => {
    setData(loadState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const lenis = new Lenis({ duration: 1.05 });
    let rafId = 0;

    const raf = (time) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const allTasks = useMemo(() => getAllTasks(data.fields), [data.fields]);
  const selectedField = data.fields.find((field) => field.id === selectedFieldId) || null;
  const todaysTasks = useMemo(() => allTasks.filter((task) => task.date === todayStr()), [allTasks]);
  const todaysCompleted = todaysTasks.filter((task) => task.completed).length;
  const todayCompletion = todaysTasks.length ? Math.round((todaysCompleted / todaysTasks.length) * 100) : 0;
  const streak = useMemo(() => calculateStreak(allTasks), [allTasks]);

  const completedHistory = useMemo(() => {
    const bucket = {};

    allTasks.forEach((task) => {
      if (!task.completedAt) return;
      const key = String(task.completedAt).slice(0, 10);
      bucket[key] = (bucket[key] || 0) + 1;
    });

    const now = new Date();
    const range = reviewMode === "weekly" ? 7 : reviewMode === "monthly" ? 30 : 12;

    if (reviewMode === "yearly") {
      const byMonth = {};
      Object.entries(bucket).forEach(([date, count]) => {
        const d = new Date(date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        byMonth[key] = (byMonth[key] || 0) + count;
      });

      return Array.from({ length: range }, (_, index) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (range - 1 - index), 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return {
          label: d.toLocaleDateString(undefined, { month: "short" }),
          completed: byMonth[key] || 0,
        };
      });
    }

    return Array.from({ length: range }, (_, index) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (range - 1 - index));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        label:
          reviewMode === "weekly"
            ? d.toLocaleDateString(undefined, { weekday: "short" })
            : d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        completed: bucket[key] || 0,
      };
    });
  }, [allTasks, reviewMode]);

  const fieldProgressData = useMemo(
    () =>
      data.fields.map((field) => {
        const total = field.tasks.length;
        const done = field.tasks.filter((task) => task.completed).length;
        return {
          name: field.name,
          done,
          pending: Math.max(total - done, 0),
        };
      }),
    [data.fields]
  );

  function addCelebration(title, message) {
    const id = uid();
    setData((prev) => ({
      ...prev,
      celebrations: [...prev.celebrations, { id, title, message }],
    }));

    window.setTimeout(() => {
      setData((prev) => ({
        ...prev,
        celebrations: prev.celebrations.filter((celebration) => celebration.id !== id),
      }));
    }, 2400);
  }

  function handleAddField() {
    if (!fieldName.trim()) return;

    const newField = {
      id: uid(),
      name: fieldName.trim(),
      createdAt: fieldDate,
      tasks: [],
    };

    setData((prev) => ({
      ...prev,
      fields: [newField, ...prev.fields],
    }));

    setFieldName("");
    setFieldDate(todayStr());
    setAddFieldOpen(false);
    addCelebration("New field unlocked ✨", `${newField.name} is ready for your daily work.`);
  }

  function deleteField(id) {
    const field = data.fields.find((item) => item.id === id);

    setData((prev) => ({
      ...prev,
      fields: prev.fields.filter((item) => item.id !== id),
    }));

    if (selectedFieldId === id) {
      setSelectedFieldId(null);
      setPage("fields");
    }

    if (field) {
      addCelebration("Field removed", `${field.name} has been deleted.`);
    }
  }

  function addTaskToField() {
    if (!selectedField || !taskTitle.trim()) return;

    const task = {
      id: uid(),
      title: taskTitle.trim(),
      date: taskDate,
      completed: false,
      completedAt: null,
    };

    setData((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.id === selectedField.id ? { ...field, tasks: [task, ...field.tasks] } : field
      ),
    }));

    setTaskTitle("");
    setTaskDate(todayStr());
    addCelebration("Task added ✅", `A new mission was added to ${selectedField.name}.`);
  }

  function toggleTask(fieldId, taskId) {
    const currentField = data.fields.find((field) => field.id === fieldId);
    const currentTask = currentField?.tasks.find((task) => task.id === taskId);

    if (!currentField || !currentTask) return;

    const becomingComplete = !currentTask.completed;
    const coinGain = becomingComplete ? 10 : -10;

    const updatedFields = data.fields.map((field) => {
      if (field.id !== fieldId) return field;
      return {
        ...field,
        tasks: field.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: becomingComplete,
                completedAt: becomingComplete ? new Date().toISOString() : null,
              }
            : task
        ),
      };
    });

    const updatedField = updatedFields.find((field) => field.id === fieldId);
    const todaysFieldTasks = updatedField ? updatedField.tasks.filter((task) => task.date === todayStr()) : [];
    const fieldCompletedToday = todaysFieldTasks.length > 0 && todaysFieldTasks.every((task) => task.completed);

    const updatedTodayTasks = getAllTasks(updatedFields).filter((task) => task.date === todayStr());
    const allFieldsCompletedToday =
      updatedTodayTasks.length > 0 && updatedTodayTasks.every((task) => task.completed);

    setData((prev) => ({
      ...prev,
      fields: updatedFields,
      coins: Math.max(prev.coins + coinGain, 0),
      totalCompleted: becomingComplete
        ? prev.totalCompleted + 1
        : Math.max(prev.totalCompleted - 1, 0),
    }));

    if (becomingComplete) {
      addCelebration("+10 coins earned 🪙", `Great job! You completed “${currentTask.title}”.`);

      if (fieldCompletedToday) {
        window.setTimeout(() => {
          addCelebration("Field cleared 🔥", `You finished all today’s tasks in ${currentField.name}.`);
        }, 320);
      }

      if (allFieldsCompletedToday) {
        window.setTimeout(() => {
          setData((prev) => ({ ...prev, coins: prev.coins + 25 }));
          addCelebration("Daily victory 🏆", "You completed all today’s tasks. Bonus +25 coins added.");
        }, 700);
      }
    }
  }

  const navItems = [
    { key: "home", label: "Home", icon: LayoutDashboard },
    { key: "fields", label: "Fields", icon: BookOpen },
    { key: "review", label: "Review Progress", icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),transparent_35%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.16),transparent_40%),linear-gradient(180deg,#020617,#0f172a)] text-slate-100">
      <CelebrationLayer celebrations={data.celebrations || []} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-indigo-900/10 backdrop-blur-xl sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                AI Productivity Engine
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Your Daily Discipline Operating System
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Add your daily fields like Robotics, Gym, Web Dev, College Work, or Quran. Each field contains the tasks you want to complete today.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
              <DashboardStat icon={Wallet} title="Coin Vault" value={`${data.coins}`} subtitle="Virtual reward balance" />
              <DashboardStat icon={Clock3} title="Today’s Tasks" value={`${todaysTasks.length}`} subtitle="Focus for today only" />
              <DashboardStat icon={CheckCircle2} title="Completed Today" value={`${todaysCompleted}`} subtitle="Keep momentum alive" />
              <DashboardStat icon={Flame} title="Completion" value={`${todayCompletion}%`} subtitle="Today’s progress" />
              <DashboardStat icon={Trophy} title="Streak" value={`${streak} days`} subtitle="Consistency chain" />
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Card className="h-fit rounded-[28px] border border-white/10 bg-black/30 text-white shadow-xl shadow-black/30 backdrop-blur-2xl">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Motivation</p>
                  <h2 className="text-lg font-bold">Discipline Engine</h2>
                </div>
              </div>

              <div className="space-y-2">
                {navItems.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPage(key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                      page === key ? "bg-white text-slate-900 shadow-lg" : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>

              <Dialog open={addFieldOpen} onOpenChange={setAddFieldOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-5 w-full rounded-2xl bg-indigo-500 py-6 text-sm font-semibold text-white hover:bg-indigo-400">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Field
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-3xl border-white/10 bg-slate-950 text-white sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl">Create a new field</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Example fields: Robotics, Web Dev, Gym, College Work, Reading Quran.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 pt-3">
                    <div className="grid gap-2">
                      <Label>Name of field</Label>
                      <Input
                        placeholder="e.g. Robotics"
                        value={fieldName}
                        onChange={(event) => setFieldName(event.target.value)}
                        className="rounded-2xl border-white/10 bg-white/5"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={fieldDate}
                        onChange={(event) => setFieldDate(event.target.value)}
                        className="rounded-2xl border-white/10 bg-white/5"
                      />
                    </div>
                    <Button onClick={handleAddField} className="rounded-2xl py-6 text-sm font-semibold">
                      Save Field
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Card className="mt-5 rounded-3xl border border-white/10 bg-white/5 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Coins className="h-4 w-4 text-amber-300" />
                    Coin System
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-300">
                    <p>+10 coins for every completed task.</p>
                    <p>Celebration when one field is fully cleared for today.</p>
                    <p>Bonus +25 coins when all today’s tasks across all fields are done.</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {page === "home" && (
              <motion.div
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="space-y-6"
              >
                <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
                  <Card className="rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-2xl text-white">Home</CardTitle>
                      <CardDescription className="text-slate-400">
                        Your dashboard gives quick access to fields, tasks, progress, and rewards.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          title: "Add New Field",
                          desc: "Create a new life area you want to work on daily.",
                          action: () => setAddFieldOpen(true),
                          icon: Plus,
                        },
                        {
                          title: "Fields",
                          desc: "Open beautiful field cards and manage daily tasks.",
                          action: () => setPage("fields"),
                          icon: BookOpen,
                        },
                        {
                          title: "Review Progress",
                          desc: "See weekly, monthly, and yearly charts.",
                          action: () => setPage("review"),
                          icon: BarChart3,
                        },
                        {
                          title: "Coins in Vault",
                          desc: `${data.coins} coins saved from your consistency.`,
                          action: () => setPage("home"),
                          icon: Coins,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <motion.button
                            key={item.title}
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.985 }}
                            onClick={item.action}
                            className="group rounded-[26px] border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-5 text-left shadow-sm transition hover:shadow-xl hover:shadow-black/20"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
                              </div>
                              <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white shadow-lg transition group-hover:scale-110 group-hover:rotate-3">
                                <Icon className="h-5 w-5" />
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </CardContent>
                  </Card>

                  <Card className="rounded-[28px] border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-slate-900 text-white shadow-2xl shadow-indigo-900/20">
                    <CardHeader>
                      <CardTitle className="text-2xl">Today’s energy</CardTitle>
                      <CardDescription className="text-indigo-100">
                        Only today’s tasks appear here.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-3xl bg-white/10 p-4 backdrop-blur-xl">
                        <div className="flex items-center justify-between text-sm">
                          <span>Daily completion</span>
                          <span className="font-semibold">{todayCompletion}%</span>
                        </div>
                        <Progress value={todayCompletion} className="mt-3 h-3 bg-white/20" />

                        <div className="mt-5 space-y-3">
                          {todaysTasks.length === 0 ? (
                            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-indigo-50">
                              No tasks added for today yet. Start with a field and add your first mission.
                            </div>
                          ) : (
                            todaysTasks.slice(0, 5).map((task) => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3"
                              >
                                <div>
                                  <p className="text-sm font-semibold">{task.title}</p>
                                  <p className="text-xs text-indigo-100/80">{task.fieldName}</p>
                                </div>
                                {task.completed ? (
                                  <Badge className="rounded-full border-0 bg-emerald-400/20 text-emerald-100">Done</Badge>
                                ) : (
                                  <Badge className="rounded-full border-0 bg-amber-300/20 text-amber-50">Pending</Badge>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {page === "fields" && !selectedField && (
              <motion.div
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              >
                <Card className="rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white">Fields</CardTitle>
                        <CardDescription className="text-slate-400">
                          Each field represents an area of life like Robotics, Gym, Quran, Web Dev, or College Work. Inside each field, you manage the real daily tasks.
                        </CardDescription>
                      </div>
                      <Button onClick={() => setAddFieldOpen(true)} className="rounded-2xl">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Field
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {data.fields.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
                        <h3 className="text-lg font-bold text-white">No fields yet</h3>
                        <p className="mt-2 text-sm text-slate-400">
                          Create fields like Robotics, Web Dev, Gym, College Work, or Reading Quran.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {data.fields.map((field) => {
                          const Icon = guessIcon(field.name);
                          const todaysCount = field.tasks.filter((task) => task.date === todayStr()).length;
                          const todaysDone = field.tasks.filter(
                            (task) => task.date === todayStr() && task.completed
                          ).length;
                          const fieldProgress = todaysCount ? Math.round((todaysDone / todaysCount) * 100) : 0;

                          return (
                            <motion.div
                              key={field.id}
                              whileHover={{ y: -6 }}
                              className="rounded-[30px] border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-5 shadow-lg shadow-black/20"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 text-white shadow-lg">
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-extrabold text-white">{field.name}</h3>
                                    <p className="text-xs text-slate-400">Created on {formatDate(field.createdAt)}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteField(field.id)}
                                  className="rounded-xl p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                                  aria-label={`Delete ${field.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-5 rounded-2xl bg-white/5 p-4">
                                <div className="flex items-center justify-between text-sm text-slate-300">
                                  <span>Today’s progress</span>
                                  <span>
                                    {todaysDone}/{todaysCount}
                                  </span>
                                </div>
                                <Progress value={fieldProgress} className="mt-3 h-3" />
                              </div>

                              <Button
                                onClick={() => {
                                  setSelectedFieldId(field.id);
                                  setPage("fields");
                                }}
                                className="mt-5 w-full rounded-2xl py-6"
                              >
                                Open Field
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {page === "fields" && selectedField && (
              <motion.div
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="space-y-6"
              >
                <Button variant="outline" onClick={() => setSelectedFieldId(null)} className="rounded-2xl">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Fields
                </Button>

                <Card className="rounded-[28px] border border-white/10 bg-black/30 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl font-black text-white">{selectedField.name}</CardTitle>
                        <CardDescription className="text-slate-400">
                          This field contains the tasks you perform today. Fields remind you where to focus; tasks represent the actual work you execute daily.
                        </CardDescription>
                      </div>
                      <Badge className="w-fit rounded-full px-3 py-1 text-sm">
                        Field created {formatDate(selectedField.createdAt)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card className="rounded-[28px] border border-white/10 bg-white/5 shadow-none">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">Add today’s task</CardTitle>
                        <CardDescription className="text-slate-400">
                          Add the actual work you want to complete inside this field.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label>Task name</Label>
                          <Textarea
                            placeholder="e.g. Learn linear algebra"
                            value={taskTitle}
                            onChange={(event) => setTaskTitle(event.target.value)}
                            className="min-h-[120px] rounded-2xl border-white/10 bg-white/5"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={taskDate}
                            onChange={(event) => setTaskDate(event.target.value)}
                            className="rounded-2xl border-white/10 bg-white/5"
                          />
                        </div>
                        <Button onClick={addTaskToField} className="w-full rounded-2xl py-6 font-semibold">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Task
                        </Button>
                      </CardContent>
                    </Card>

                    <div className="space-y-4">
                      <Card className="rounded-[28px] border-0 bg-gradient-to-r from-slate-950 to-indigo-950 text-white">
                        <CardContent className="flex items-center justify-between gap-4 p-5">
                          <div>
                            <p className="text-sm text-slate-300">Today’s tasks in {selectedField.name}</p>
                            <h3 className="mt-1 text-2xl font-black">
                              {selectedField.tasks.filter((task) => task.date === todayStr()).length}
                            </h3>
                          </div>
                          <CalendarDays className="h-10 w-10 text-indigo-300" />
                        </CardContent>
                      </Card>

                      <Card className="rounded-[28px] border border-white/10 bg-black/30 shadow-2xl shadow-black/30 backdrop-blur-xl">
                        <CardHeader>
                          <CardTitle className="text-xl text-white">Today’s visible tasks only</CardTitle>
                          <CardDescription className="text-slate-400">
                            Completed tasks from previous days will not appear here.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedField.tasks.filter((task) => task.date === todayStr()).length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm text-slate-400">
                                No tasks for today in this field yet.
                              </div>
                            ) : (
                              selectedField.tasks
                                .filter((task) => task.date === todayStr())
                                .map((task) => (
                                  <motion.div
                                    key={task.id}
                                    layout
                                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                                      task.completed
                                        ? "border-emerald-500/30 bg-emerald-500/10"
                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <button onClick={() => toggleTask(selectedField.id, task.id)}>
                                        {task.completed ? (
                                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                                        ) : (
                                          <Circle className="h-6 w-6 text-slate-500" />
                                        )}
                                      </button>
                                      <div>
                                        <p
                                          className={`font-semibold ${
                                            task.completed ? "text-emerald-200 line-through" : "text-white"
                                          }`}
                                        >
                                          {task.title}
                                        </p>
                                        <p className="text-xs text-slate-400">Date: {formatDate(task.date)}</p>
                                      </div>
                                    </div>
                                    <Badge
                                      className={`rounded-full ${
                                        task.completed
                                          ? "bg-emerald-500/20 text-emerald-200"
                                          : "bg-white/10 text-slate-300"
                                      }`}
                                    >
                                      {task.completed ? "+10 coins" : "Pending"}
                                    </Badge>
                                  </motion.div>
                                ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {page === "review" && (
              <motion.div
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="space-y-6"
              >
                <Card className="rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle className="text-2xl text-white">Review Progress</CardTitle>
                        <CardDescription className="text-slate-400">
                          Choose weekly, monthly, or yearly view for graph and history.
                        </CardDescription>
                      </div>
                      <Select value={reviewMode} onValueChange={setReviewMode}>
                        <SelectTrigger className="w-[180px] rounded-2xl border-white/10 bg-white/5 text-white">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-6 xl:grid-cols-2">
                    <Card className="rounded-[28px] border border-white/10 bg-white/5 shadow-none">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">Completion Graph</CardTitle>
                        <CardDescription className="text-slate-400">
                          Visual progress based on completed tasks.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={completedHistory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="label" stroke="rgba(148,163,184,0.7)" />
                            <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.7)" />
                            <Tooltip />
                            <Area type="monotone" dataKey="completed" stroke="#818cf8" fill="#818cf8" fillOpacity={0.18} strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="rounded-[28px] border border-white/10 bg-white/5 shadow-none">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">Field History</CardTitle>
                        <CardDescription className="text-slate-400">
                          See how your work is distributed across your fields.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={fieldProgressData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                            <XAxis dataKey="name" stroke="rgba(148,163,184,0.7)" />
                            <YAxis allowDecimals={false} stroke="rgba(148,163,184,0.7)" />
                            <Tooltip />
                            <Bar dataKey="done" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">History list</CardTitle>
                    <CardDescription className="text-slate-400">A clean log of your task journey.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {allTasks
                        .filter((task) => task.completedAt)
                        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
                        .slice(0, 20)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-semibold text-white">{task.title}</p>
                              <p className="text-sm text-slate-400">
                                {task.fieldName} • Completed on {formatDate(task.completedAt)}
                              </p>
                            </div>
                            <Badge className="w-fit rounded-full bg-emerald-500/20 text-emerald-200">
                              +10 coins earned
                            </Badge>
                          </div>
                        ))}

                      {allTasks.filter((task) => task.completedAt).length === 0 && (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-400">
                          No completed history yet. Once you finish tasks, your timeline will appear here.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export {
  todayStr,
  formatDate,
  getAllTasks,
  calculateStreak,
  createInitialState,
};

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Gamepad2,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Moon,
  Plus,
  Send,
  Settings,
  Smartphone,
  Star,
  Sun,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  Answer,
  AttendanceRecord,
  Doubt,
  Feedback,
  Notification,
  Poll,
  Profile,
  Question,
  Quiz,
} from "./backend.d";
import { Role } from "./backend.d";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(time: bigint) {
  return new Date(Number(time) / 1_000_000).toLocaleDateString();
}

function shortPrincipal(p: { toText(): string } | undefined) {
  if (!p) return "Unknown";
  const s = p.toText();
  return s.length > 12 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

// ─── Design tokens ──────────────────────────────────────────────────────────

const GLASS = {
  background: "rgba(17,24,55,0.65)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
} as const;

const _GLASS_LIGHT = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "1rem",
} as const;

// ─── Bar Chart (div-based) ──────────────────────────────────────────────────

interface BarChartData {
  label: string;
  value: number;
  color: string;
}
function BarChart({ data, max = 100 }: { data: BarChartData[]; max?: number }) {
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-xs text-muted-foreground">{d.value}</span>
          <div
            className="w-full rounded-t-md transition-all duration-700"
            style={{
              height: `${(d.value / max) * 120}px`,
              background: d.color,
            }}
          />
          <span className="text-xs text-center text-muted-foreground truncate w-full">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Line Chart (div-based) ─────────────────────────────────────────────────

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (v / max) * 80,
  }));
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`)
    .join(" ");
  return (
    <div className="relative">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-32"
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#a855f7" />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type DashboardView =
  | "dashboard"
  | "quiz"
  | "polls"
  | "game"
  | "doubts"
  | "attendance"
  | "notifications"
  | "quiz-manager"
  | "poll-manager"
  | "doubts-inbox"
  | "feedback"
  | "attend-mgmt";

// ─── LOGIN PAGE ─────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (p: Profile) => void }) {
  const { actor } = useActor();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role>(Role.student);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!actor || !username.trim()) {
      toast.error("Enter a username");
      return;
    }
    setLoading(true);
    try {
      await actor.registerUser(username.trim(), role);
      const profile = await actor.getCallerUserProfile();
      if (profile) {
        onLogin(profile);
        toast.success(`Welcome, ${profile.username}!`);
      } else {
        toast.error("Could not load profile");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0b1020, #0f172a, #1a0533)",
      }}
    >
      {/* Glow blobs */}
      <div
        className="absolute top-20 left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "#3b82f6" }}
      />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{ background: "#a855f7" }}
      />

      <div
        className="relative z-10 w-full max-w-md p-8 glow-pulse"
        style={GLASS}
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎓</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Smart Classroom
          </h1>
          <p className="text-muted-foreground mt-1">
            Interactive · Engaging · Data-Driven
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Username</label>
            <Input
              data-ocid="auth.input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Enter your username"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger
                data-ocid="auth.select"
                className="bg-white/5 border-white/10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.student}>Student 🎒</SelectItem>
                <SelectItem value={Role.teacher}>Teacher 👩‍🏫</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            data-ocid="auth.submit_button"
            onClick={handleLogin}
            disabled={loading}
            className="gradient-btn w-full py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Signing in…" : "Sign In / Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TOP NAV ─────────────────────────────────────────────────────────────────

function TopNav({
  profile,
  darkMode,
  setDarkMode,
  unreadCount,
  onBell,
  onLogout,
  onMobile,
}: {
  profile: Profile;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  unreadCount: number;
  onBell: () => void;
  onLogout: () => void;
  onMobile: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 shadow-lg"
      style={{
        background: darkMode ? "rgba(15,23,42,0.92)" : "rgba(248,250,252,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          🎓 Smart Classroom
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground hidden sm:block">
          {profile.role === Role.teacher ? "👩‍🏫" : "🎒"} {profile.username}
        </span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          data-ocid="nav.toggle"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>
        <button
          onClick={onBell}
          data-ocid="nav.link"
          className="p-2 rounded-lg hover:bg-white/10 relative transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
              style={{ background: "#ef4444", color: "white" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={onMobile}
          data-ocid="nav.toggle"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          title="Mobile view"
        >
          <Smartphone className="w-5 h-5" />
        </button>
        <button
          onClick={onLogout}
          data-ocid="nav.link"
          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

interface NavItem {
  id: DashboardView;
  label: string;
  icon: React.ReactNode;
}

function Sidebar({
  items,
  active,
  onSelect,
  darkMode,
}: {
  items: NavItem[];
  active: DashboardView;
  onSelect: (v: DashboardView) => void;
  darkMode: boolean;
}) {
  return (
    <aside
      className="w-60 min-h-screen flex-shrink-0 p-4 space-y-1"
      style={{
        background: darkMode ? "rgba(11,16,32,0.95)" : "rgba(241,245,249,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          data-ocid={`nav.${item.id}.link`}
          onClick={() => onSelect(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            active === item.id
              ? "text-white shadow-lg"
              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
          }`}
          style={
            active === item.id
              ? { background: "linear-gradient(135deg,#38bdf8,#a855f7)" }
              : {}
          }
        >
          {item.icon}
          {item.label}
          {active === item.id && <ChevronRight className="ml-auto w-4 h-4" />}
        </button>
      ))}
    </aside>
  );
}

// ─── STATS CARD ──────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// ─── STUDENT: DASHBOARD ──────────────────────────────────────────────────────

function StudentDashboard({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: quizzes = [] } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => actor.getQuizzes(),
  });
  const { data: doubts = [] } = useQuery({
    queryKey: ["myDoubts"],
    queryFn: () => actor.getMyDoubts(),
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => actor.getAttendanceHistory(null),
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => actor.getNotifications(),
  });
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => actor.getGameLeaderboard(),
  });

  const presentDays = attendance.filter((a) => a.isPresent).length;
  const attendancePercent = attendance.length
    ? Math.round((presentDays / attendance.length) * 100)
    : 0;
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  const myPoints = leaderboard[0] ? Number(leaderboard[0][1]) : 0;

  const suggestions: string[] = [];
  if (attendancePercent < 75)
    suggestions.push(
      "⚠️ Your attendance is below 75%. Try to attend more classes.",
    );
  if (quizzes.length > 0)
    suggestions.push(
      `📝 You have ${quizzes.length} quiz(zes) available. Take them to improve your score!`,
    );
  if (unreadNotifs > 0)
    suggestions.push(`🔔 You have ${unreadNotifs} unread notification(s).`);
  if (doubts.filter((d) => !d.isResolved).length > 0)
    suggestions.push(
      "❓ You have pending doubts. Check if the teacher replied!",
    );
  if (suggestions.length === 0)
    suggestions.push("✅ Great job! Keep up the good work.");

  const chartData: BarChartData[] = [
    { label: "Quizzes", value: quizzes.length, color: "#38bdf8" },
    { label: "Points", value: myPoints, color: "#a855f7" },
    { label: "Attend%", value: attendancePercent, color: "#22c55e" },
    { label: "Doubts", value: doubts.length, color: "#facc15" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 My Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📝"
          label="Quizzes"
          value={quizzes.length}
          color="linear-gradient(135deg,#38bdf8,#3b82f6)"
        />
        <StatCard
          icon="🏆"
          label="Game Points"
          value={myPoints}
          color="linear-gradient(135deg,#facc15,#f97316)"
        />
        <StatCard
          icon="📅"
          label="Attendance"
          value={`${attendancePercent}%`}
          color="linear-gradient(135deg,#22c55e,#16a34a)"
        />
        <StatCard
          icon="🔔"
          label="Notifications"
          value={unreadNotifs}
          color="linear-gradient(135deg,#a855f7,#7c3aed)"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Activity Overview</h3>
          <BarChart
            data={chartData}
            max={Math.max(...chartData.map((d) => d.value), 10)}
          />
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">💡 Smart Suggestions</h3>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="text-sm p-3 rounded-lg"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT: QUIZ ───────────────────────────────────────────────────────────

function StudentQuiz({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => actor.getQuizzes(),
  });
  const [activeQuiz, setActiveQuiz] = useState<{
    quiz: Quiz;
    quizIdx: number;
  } | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [timer, setTimer] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qc = useQueryClient();

  const startTimer = useCallback(() => {
    setTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () =>
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return t - 1;
        }),
      1000,
    );
  }, []);

  const startQuiz = (quiz: Quiz, idx: number) => {
    setActiveQuiz({ quiz, quizIdx: idx });
    setQIdx(0);
    setAnswers([]);
    setSelected(null);
    setScore(null);
    startTimer();
  };

  const nextQ = async () => {
    if (!activeQuiz) return;
    const newAnswers = [...answers];
    if (selected !== null) {
      newAnswers.push({
        questionIndex: BigInt(qIdx),
        selectedOption: BigInt(selected),
      });
    }
    setAnswers(newAnswers);
    if (qIdx + 1 < activeQuiz.quiz.questions.length) {
      setQIdx(qIdx + 1);
      setSelected(null);
      startTimer();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        const s = await actor.submitQuizAnswers(
          BigInt(activeQuiz.quizIdx),
          newAnswers,
        );
        setScore(Number(s));
        qc.invalidateQueries({ queryKey: ["quizzes"] });
        toast.success(`Quiz complete! Score: ${Number(s)}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : String(e));
      }
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  if (score !== null)
    return (
      <div className="glass-card p-10 text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {score} pts
        </p>
        <button
          className="gradient-btn mt-6 px-6 py-2 rounded-xl"
          onClick={() => {
            setActiveQuiz(null);
            setScore(null);
          }}
        >
          Back to Quizzes
        </button>
      </div>
    );

  if (activeQuiz) {
    const q = activeQuiz.quiz.questions[qIdx];
    return (
      <div className="glass-card p-6 max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            Q{qIdx + 1}/{activeQuiz.quiz.questions.length}
          </span>
          <span
            className={`font-mono font-bold text-lg ${timer <= 5 ? "text-red-400" : "text-cyan-400"}`}
          >
            ⏱ {timer}s
          </span>
        </div>
        <Progress value={(timer / 30) * 100} className="mb-4" />
        <h3 className="text-lg font-semibold mb-4">{q.text}</h3>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <button
              key={i}
              data-ocid={`quiz.item.${i + 1}`}
              onClick={() => setSelected(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                selected === i
                  ? "border-cyan-400 bg-cyan-400/10"
                  : "border-white/10 hover:border-white/30 bg-white/5"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          data-ocid="quiz.submit_button"
          onClick={nextQ}
          className="gradient-btn w-full py-3 rounded-xl mt-4"
        >
          {qIdx + 1 < activeQuiz.quiz.questions.length ? "Next" : "Submit"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🧠 Available Quizzes</h2>
      {quizzes.length === 0 ? (
        <div
          data-ocid="quiz.empty_state"
          className="glass-card p-10 text-center text-muted-foreground"
        >
          No quizzes available yet. Check back later!
        </div>
      ) : (
        quizzes.map((quiz, i) => (
          <div
            key={i}
            data-ocid={`quiz.item.${i + 1}`}
            className="glass-card p-5 flex items-center justify-between"
          >
            <div>
              <h3 className="font-semibold">{quiz.title}</h3>
              <p className="text-sm text-muted-foreground">
                {quiz.questions.length} questions
              </p>
            </div>
            <button
              className="gradient-btn px-5 py-2 rounded-xl"
              onClick={() => startQuiz(quiz, i)}
            >
              Start
            </button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── STUDENT: POLLS ──────────────────────────────────────────────────────────

function StudentPolls({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ["polls"],
    queryFn: () => actor.getPolls(),
  });
  const qc = useQueryClient();
  const [voting, setVoting] = useState<number | null>(null);

  const vote = async (pollIdx: number, optIdx: number) => {
    setVoting(pollIdx);
    try {
      await actor.votePoll(BigInt(pollIdx), BigInt(optIdx));
      qc.invalidateQueries({ queryKey: ["polls"] });
      toast.success("Vote submitted!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setVoting(null);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📊 Live Polls</h2>
      {polls.length === 0 ? (
        <div
          data-ocid="polls.empty_state"
          className="glass-card p-10 text-center text-muted-foreground"
        >
          No active polls. Check back soon!
        </div>
      ) : (
        polls.map((poll, pi) => {
          const total = poll.voteCounts.reduce((a, b) => a + Number(b), 0);
          return (
            <div
              key={pi}
              data-ocid={`polls.item.${pi + 1}`}
              className="glass-card p-5 space-y-4"
            >
              <h3 className="font-semibold">{poll.question}</h3>
              {poll.options.map((opt, oi) => {
                const pct = total
                  ? Math.round((Number(poll.voteCounts[oi]) / total) * 100)
                  : 0;
                return (
                  <div key={oi} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{opt}</span>
                      <span className="text-muted-foreground">
                        {pct}% ({Number(poll.voteCounts[oi])} votes)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-white/10">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background:
                              "linear-gradient(90deg,#38bdf8,#a855f7)",
                          }}
                        />
                      </div>
                      <button
                        data-ocid={`polls.item.${pi + 1}`}
                        onClick={() => vote(pi, oi)}
                        disabled={voting === pi}
                        className="gradient-btn text-xs px-3 py-1 rounded-lg"
                      >
                        {voting === pi ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Vote"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── STUDENT: KNOWLEDGE GAME ─────────────────────────────────────────────────

const GAME_QUESTIONS = [
  {
    q: "What does HTML stand for?",
    opts: [
      "HyperText Markup Language",
      "High Text Machine Language",
      "HyperTool Multi Language",
      "None",
    ],
    ans: 0,
  },
  {
    q: "Which planet is closest to the Sun?",
    opts: ["Venus", "Earth", "Mercury", "Mars"],
    ans: 2,
  },
  { q: "What is 12 × 12?", opts: ["124", "144", "134", "154"], ans: 1 },
  {
    q: "Who invented the telephone?",
    opts: ["Edison", "Tesla", "Bell", "Marconi"],
    ans: 2,
  },
  {
    q: "What is the chemical symbol for water?",
    opts: ["O2", "H2O", "CO2", "HO"],
    ans: 1,
  },
  {
    q: "Which continent is Egypt in?",
    opts: ["Asia", "Europe", "Africa", "South America"],
    ans: 2,
  },
  { q: "How many bits in a byte?", opts: ["4", "16", "8", "32"], ans: 2 },
  {
    q: "What is the speed of light (approx)?",
    opts: ["3×10⁸ m/s", "3×10⁶ m/s", "3×10⁴ m/s", "3×10¹⁰ m/s"],
    ans: 0,
  },
  {
    q: "What does CSS stand for?",
    opts: [
      "Computer Style Sheets",
      "Cascading Style Sheets",
      "Creative Style System",
      "Colorful Style Sheets",
    ],
    ans: 1,
  },
  {
    q: "Which gas do plants absorb?",
    opts: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    ans: 2,
  },
];

function KnowledgeGame({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => actor.getGameLeaderboard(),
  });
  const qc = useQueryClient();
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [qIdx, setQIdx] = useState(0);
  const [points, setPoints] = useState(0);
  const [timer, setTimer] = useState(15);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startGame = () => {
    setPhase("playing");
    setQIdx(0);
    setPoints(0);
    setTimer(15);
    setSelected(null);
    setAnswered(false);
    startTimer();
  };

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(
      () =>
        setTimer((t) => {
          if (t <= 1) {
            clearTimer();
            handleNext(null);
            return 0;
          }
          return t - 1;
        }),
      1000,
    );
  };

  const handleAnswer = (i: number) => {
    if (answered) return;
    clearTimer();
    setSelected(i);
    setAnswered(true);
    if (i === GAME_QUESTIONS[qIdx].ans) {
      const bonus = Math.ceil(timer / 5);
      setPoints((p) => p + 10 + bonus);
    }
    setTimeout(() => handleNext(i), 1000);
  };

  const handleNext = (_: number | null) => {
    if (qIdx + 1 >= GAME_QUESTIONS.length) {
      setPhase("done");
    } else {
      setQIdx((q) => q + 1);
      setSelected(null);
      setAnswered(false);
      setTimer(15);
      startTimer();
    }
  };

  const submitScore = async (pts: number) => {
    try {
      await actor.submitGameScore(pts);
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success(`Score ${pts} submitted!`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  if (phase === "done") {
    submitScore(points);
    return (
      <div className="glass-card p-10 text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
        <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          {points} pts
        </p>
        <button
          className="gradient-btn mt-6 px-6 py-2 rounded-xl"
          onClick={() => setPhase("idle")}
        >
          Play Again
        </button>
      </div>
    );
  }

  if (phase === "playing") {
    const gq = GAME_QUESTIONS[qIdx];
    return (
      <div className="glass-card p-6 max-w-lg mx-auto">
        <div className="flex justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            Q{qIdx + 1}/10 · {points} pts
          </span>
          <span
            className={`font-mono font-bold text-lg ${timer <= 5 ? "text-red-400" : "text-cyan-400"}`}
          >
            ⏱ {timer}s
          </span>
        </div>
        <Progress value={(timer / 15) * 100} className="mb-4" />
        <h3 className="text-lg font-semibold mb-4">{gq.q}</h3>
        <div className="grid grid-cols-2 gap-3">
          {gq.opts.map((o, i) => (
            <button
              key={i}
              data-ocid={`game.item.${i + 1}`}
              onClick={() => handleAnswer(i)}
              disabled={answered}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                !answered
                  ? "border-white/10 bg-white/5 hover:border-cyan-400/50"
                  : i === gq.ans
                    ? "border-green-400 bg-green-400/20 text-green-300"
                    : i === selected
                      ? "border-red-400 bg-red-400/20 text-red-300"
                      : "border-white/5 bg-white/5 opacity-50"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🎮 Knowledge Game</h2>
      <div className="glass-card p-8 text-center">
        <div className="text-5xl mb-4">🎮</div>
        <h3 className="text-xl font-semibold mb-2">10 Questions · 15s each</h3>
        <p className="text-muted-foreground mb-6">
          Answer fast for bonus points!
        </p>
        <button
          data-ocid="game.primary_button"
          className="gradient-btn px-8 py-3 rounded-xl text-lg"
          onClick={startGame}
        >
          Start Game
        </button>
      </div>
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
        </h3>
        {leaderboard.length === 0 ? (
          <p
            data-ocid="game.empty_state"
            className="text-muted-foreground text-center py-4"
          >
            No scores yet. Be the first!
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map(([principal, pts], i) => (
              <div
                key={i}
                data-ocid={`game.item.${i + 1}`}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background:
                        i < 3
                          ? ["#facc15", "#9ca3af", "#a16207"][i]
                          : "#374151",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm">
                    {shortPrincipal(
                      principal as unknown as { toText(): string },
                    )}
                  </span>
                </span>
                <span className="font-bold text-yellow-400">{pts} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STUDENT: DOUBTS ─────────────────────────────────────────────────────────

function StudentDoubts({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: doubts = [], isLoading } = useQuery({
    queryKey: ["myDoubts"],
    queryFn: () => actor.getMyDoubts(),
  });
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const startVoice = () => {
    // biome-ignore lint: browser speech API
    const win = window as any;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice not supported in this browser");
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.onresult = (e: any) => setText(e.results[0][0].transcript);
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    r.start();
    setIsRecording(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const submit = async () => {
    if (!text.trim()) {
      toast.error("Enter your doubt");
      return;
    }
    setSubmitting(true);
    try {
      await actor.submitDoubt(text.trim());
      setText("");
      qc.invalidateQueries({ queryKey: ["myDoubts"] });
      toast.success("Doubt submitted!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">❓ My Doubts</h2>
      <div className="glass-card p-5 space-y-3">
        <Textarea
          data-ocid="doubts.textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your doubt here…"
          className="bg-white/5 border-white/10 resize-none"
          rows={3}
        />
        <div className="flex gap-2">
          <button
            data-ocid="doubts.submit_button"
            onClick={submit}
            disabled={submitting}
            className="gradient-btn flex-1 py-2 rounded-xl flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit
          </button>
          <button
            data-ocid="doubts.toggle"
            onClick={isRecording ? stopVoice : startVoice}
            className={`px-4 py-2 rounded-xl border transition-all ${
              isRecording
                ? "border-red-400 bg-red-400/20 text-red-400"
                : "border-white/20 bg-white/5 hover:bg-white/10"
            }`}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>
        {isRecording && (
          <p className="text-sm text-red-400 animate-pulse">
            🎙 Recording… Click mic to stop
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}

      <div className="space-y-3">
        {doubts.length === 0 && !isLoading ? (
          <div
            data-ocid="doubts.empty_state"
            className="glass-card p-8 text-center text-muted-foreground"
          >
            No doubts submitted yet.
          </div>
        ) : (
          doubts.map((d, i) => (
            <div
              key={i}
              data-ocid={`doubts.item.${i + 1}`}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{
                    background: "linear-gradient(135deg,#38bdf8,#3b82f6)",
                  }}
                >
                  You
                </div>
                <div className="flex-1">
                  <p className="text-sm">{d.text}</p>
                  <Badge
                    className={`mt-1 text-xs ${d.isResolved ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
                  >
                    {d.isResolved ? "Resolved" : "Pending"}
                  </Badge>
                </div>
              </div>
              {d.reply && (
                <div className="flex items-start gap-3 pl-4 border-l-2 border-purple-500/40">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: "linear-gradient(135deg,#a855f7,#7c3aed)",
                    }}
                  >
                    T
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">
                      Teacher replied:
                    </p>
                    <p className="text-sm">{d.reply}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── STUDENT: ATTENDANCE ─────────────────────────────────────────────────────

function StudentAttendance({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => actor.getAttendanceHistory(null),
  });
  const present = records.filter((r) => r.isPresent).length;
  const pct = records.length ? Math.round((present / records.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📅 Attendance History</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon="✅"
          label="Present"
          value={present}
          color="linear-gradient(135deg,#22c55e,#16a34a)"
        />
        <StatCard
          icon="❌"
          label="Absent"
          value={records.length - present}
          color="linear-gradient(135deg,#ef4444,#dc2626)"
        />
        <StatCard
          icon="📊"
          label="Percentage"
          value={`${pct}%`}
          color="linear-gradient(135deg,#38bdf8,#3b82f6)"
        />
      </div>
      <div className="glass-card p-5">
        <Progress value={pct} className="mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          {pct}% attendance rate
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm text-muted-foreground">
                  Date
                </th>
                <th className="text-left p-4 text-sm text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={2}
                    data-ocid="attendance.empty_state"
                    className="p-8 text-center text-muted-foreground"
                  >
                    No attendance records
                  </td>
                </tr>
              ) : (
                records.map((r, i) => (
                  <tr
                    key={i}
                    data-ocid={`attendance.item.${i + 1}`}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-4 text-sm">{formatDate(r.date)}</td>
                    <td className="p-4">
                      {r.isPresent ? (
                        <span className="flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle className="w-4 h-4" /> Present
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-sm">
                          <XCircle className="w-4 h-4" /> Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

function NotificationsPanel({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => actor.getNotifications(),
  });
  const qc = useQueryClient();
  const [marking, setMarking] = useState(false);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await actor.markNotificationsAsRead();
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All marked as read");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">🔔 Notifications</h2>
        <button
          data-ocid="notifications.primary_button"
          onClick={markAllRead}
          disabled={marking}
          className="gradient-btn px-4 py-2 rounded-xl text-sm flex items-center gap-2"
        >
          {marking ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}{" "}
          Mark all read
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}
      {notifications.length === 0 && !isLoading ? (
        <div
          data-ocid="notifications.empty_state"
          className="glass-card p-10 text-center text-muted-foreground"
        >
          No notifications yet.
        </div>
      ) : null}
      <div className="space-y-2">
        {notifications.map((n, i) => (
          <div
            key={i}
            data-ocid={`notifications.item.${i + 1}`}
            className={`glass-card p-4 flex items-start gap-3 ${!n.isRead ? "border-l-4" : ""}`}
            style={!n.isRead ? { borderLeftColor: "#38bdf8" } : {}}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: "rgba(99,102,241,0.3)" }}
            >
              🔔
            </div>
            <div className="flex-1">
              <p className="text-sm">{n.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="text-xs bg-white/10">
                  {n.notificationType}
                </Badge>
                {!n.isRead && (
                  <Badge className="text-xs bg-cyan-500/20 text-cyan-400">
                    New
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TEACHER: DASHBOARD ──────────────────────────────────────────────────────

function TeacherDashboard({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: students = [] } = useQuery({
    queryKey: ["students"],
    queryFn: () => actor.getStudents(),
  });
  const { data: quizzes = [] } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => actor.getQuizzes(),
  });
  const { data: doubts = [] } = useQuery({
    queryKey: ["allDoubts"],
    queryFn: () => actor.getAllDoubts(),
  });
  const { data: polls = [] } = useQuery({
    queryKey: ["polls"],
    queryFn: () => actor.getPolls(),
  });

  const pending = doubts.filter((d) => !d.isResolved).length;
  const weeklyEngagement = [60, 68, 75, 82, 78, 88, 92];
  const weekLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const suggestions: string[] = [];
  if (pending > 0)
    suggestions.push(`⚠️ ${pending} student doubts are pending your reply.`);
  if (quizzes.length === 0)
    suggestions.push("📝 No quizzes created yet. Create one for students!");
  if (polls.length === 0)
    suggestions.push("📊 No polls active. Engage students with a live poll!");
  if (suggestions.length === 0)
    suggestions.push("✅ Class is running smoothly!");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Teacher Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Students"
          value={students.length}
          color="linear-gradient(135deg,#38bdf8,#3b82f6)"
        />
        <StatCard
          icon="📝"
          label="Quizzes"
          value={quizzes.length}
          color="linear-gradient(135deg,#a855f7,#7c3aed)"
        />
        <StatCard
          icon="❓"
          label="Pending Doubts"
          value={pending}
          color="linear-gradient(135deg,#ef4444,#dc2626)"
        />
        <StatCard
          icon="📊"
          label="Polls"
          value={polls.length}
          color="linear-gradient(135deg,#22c55e,#16a34a)"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Weekly Engagement</h3>
          <LineChart data={weeklyEngagement} labels={weekLabels} />
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">💡 Smart Suggestions</h3>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="text-sm p-3 rounded-lg"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TEACHER: QUIZ MANAGER ───────────────────────────────────────────────────

function TeacherQuizManager({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => actor.getQuizzes(),
  });
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<
    { text: string; options: string[]; correctIndex: number }[]
  >([{ text: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const [creating, setCreating] = useState(false);

  const addQuestion = () =>
    setQuestions((qs) => [
      ...qs,
      { text: "", options: ["", "", "", ""], correctIndex: 0 },
    ]);
  const removeQuestion = (i: number) =>
    setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const updateQ = (
    qi: number,
    field: "text" | "correctIndex",
    val: string | number,
  ) =>
    setQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, [field]: val } : q)),
    );

  const updateOpt = (qi: number, oi: number, val: string) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? val : o)) }
          : q,
      ),
    );

  const createQuiz = async () => {
    if (!title.trim()) {
      toast.error("Add a title");
      return;
    }
    if (
      questions.some((q) => !q.text.trim() || q.options.some((o) => !o.trim()))
    ) {
      toast.error("Fill all questions and options");
      return;
    }
    setCreating(true);
    try {
      const qs: Question[] = questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctIndex: BigInt(q.correctIndex),
      }));
      await actor.createQuiz(title.trim(), qs);
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      toast.success("Quiz created!");
      setTitle("");
      setQuestions([{ text: "", options: ["", "", "", ""], correctIndex: 0 }]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🧪 Quiz Manager</h2>
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold">Create New Quiz</h3>
        <Input
          data-ocid="quiz_manager.input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quiz title"
          className="bg-white/5 border-white/10"
        />
        {questions.map((q, qi) => (
          <div
            key={qi}
            className="p-4 rounded-xl border border-white/10 bg-white/3 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Q{qi + 1}
              </span>
              <Input
                data-ocid={`quiz_manager.item.${qi + 1}`}
                value={q.text}
                onChange={(e) => updateQ(qi, "text", e.target.value)}
                placeholder="Question text"
                className="flex-1 bg-white/5 border-white/10"
              />
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qi)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct_${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => updateQ(qi, "correctIndex", oi)}
                    className="accent-cyan-400"
                  />
                  <Input
                    value={opt}
                    onChange={(e) => updateOpt(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="bg-white/5 border-white/10 text-sm"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select the radio button next to the correct answer
            </p>
          </div>
        ))}
        <div className="flex gap-3">
          <button
            onClick={addQuestion}
            data-ocid="quiz_manager.secondary_button"
            className="flex-1 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
          <button
            onClick={createQuiz}
            disabled={creating}
            data-ocid="quiz_manager.submit_button"
            className="gradient-btn flex-1 py-2 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{" "}
            Create Quiz
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold">Existing Quizzes</h3>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}
      {quizzes.length === 0 && !isLoading ? (
        <div
          data-ocid="quiz_manager.empty_state"
          className="glass-card p-8 text-center text-muted-foreground"
        >
          No quizzes yet.
        </div>
      ) : null}
      <div className="space-y-3">
        {quizzes.map((q, i) => (
          <div
            key={i}
            data-ocid={`quiz_manager.item.${i + 1}`}
            className="glass-card p-4 flex items-center justify-between"
          >
            <div>
              <h4 className="font-medium">{q.title}</h4>
              <p className="text-sm text-muted-foreground">
                {q.questions.length} questions
              </p>
            </div>
            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TEACHER: POLL MANAGER ───────────────────────────────────────────────────

function TeacherPollManager({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: polls = [], isLoading } = useQuery({
    queryKey: ["polls"],
    queryFn: () => actor.getPolls(),
  });
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  const createPoll = async () => {
    if (!question.trim() || options.some((o) => !o.trim())) {
      toast.error("Fill all fields");
      return;
    }
    setCreating(true);
    try {
      await actor.createPoll(
        question.trim(),
        options.filter((o) => o.trim()),
      );
      qc.invalidateQueries({ queryKey: ["polls"] });
      toast.success("Poll created!");
      setQuestion("");
      setOptions(["", ""]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Poll Manager</h2>
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold">Create New Poll</h3>
        <Input
          data-ocid="poll_manager.input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Poll question"
          className="bg-white/5 border-white/10"
        />
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              data-ocid={`poll_manager.item.${i + 1}`}
              value={opt}
              onChange={(e) =>
                setOptions((os) =>
                  os.map((o, j) => (j === i ? e.target.value : o)),
                )
              }
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-white/5 border-white/10"
            />
            {options.length > 2 && (
              <button
                onClick={() => setOptions((os) => os.filter((_, j) => j !== i))}
                className="text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <div className="flex gap-3">
          <button
            onClick={() => setOptions((os) => [...os, ""])}
            data-ocid="poll_manager.secondary_button"
            className="flex-1 py-2 rounded-xl border border-white/20 bg-white/5 text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Option
          </button>
          <button
            onClick={createPoll}
            disabled={creating}
            data-ocid="poll_manager.submit_button"
            className="gradient-btn flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{" "}
            Create Poll
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold">Active Polls</h3>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}
      {polls.length === 0 && !isLoading ? (
        <div
          data-ocid="poll_manager.empty_state"
          className="glass-card p-8 text-center text-muted-foreground"
        >
          No polls yet.
        </div>
      ) : null}
      {polls.map((poll, pi) => {
        const total = poll.voteCounts.reduce((a, b) => a + Number(b), 0);
        return (
          <div
            key={pi}
            data-ocid={`poll_manager.item.${pi + 1}`}
            className="glass-card p-5 space-y-3"
          >
            <h4 className="font-medium">{poll.question}</h4>
            {poll.options.map((opt, oi) => {
              const pct = total
                ? Math.round((Number(poll.voteCounts[oi]) / total) * 100)
                : 0;
              return (
                <div key={oi}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{opt}</span>
                    <span className="text-muted-foreground">
                      {pct}% · {Number(poll.voteCounts[oi])} votes
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg,#38bdf8,#a855f7)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              Total votes: {total}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── TEACHER: DOUBTS INBOX ────────────────────────────────────────────────────

function TeacherDoubtsInbox({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: doubts = [], isLoading } = useQuery({
    queryKey: ["allDoubts"],
    queryFn: () => actor.getAllDoubts(),
  });
  const qc = useQueryClient();
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});

  const reply = async (idx: number) => {
    const text = replies[idx];
    if (!text?.trim()) {
      toast.error("Enter a reply");
      return;
    }
    setLoading((l) => ({ ...l, [idx]: true }));
    try {
      await actor.replyDoubt(BigInt(idx), text.trim());
      qc.invalidateQueries({ queryKey: ["allDoubts"] });
      toast.success("Reply sent!");
      setReplies((r) => ({ ...r, [idx]: "" }));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading((l) => ({ ...l, [idx]: false }));
    }
  };

  const resolve = async (idx: number) => {
    setLoading((l) => ({ ...l, [`r${idx}`]: true }));
    try {
      await actor.markDoubtResolved(BigInt(idx));
      qc.invalidateQueries({ queryKey: ["allDoubts"] });
      toast.success("Marked resolved!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading((l) => ({ ...l, [`r${idx}`]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📥 Doubts Inbox</h2>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}
      {doubts.length === 0 && !isLoading ? (
        <div
          data-ocid="doubts_inbox.empty_state"
          className="glass-card p-10 text-center text-muted-foreground"
        >
          No student doubts yet.
        </div>
      ) : null}
      <div className="space-y-4">
        {doubts.map((d, i) => (
          <div
            key={i}
            data-ocid={`doubts_inbox.item.${i + 1}`}
            className="glass-card p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                  style={{
                    background: "linear-gradient(135deg,#38bdf8,#3b82f6)",
                  }}
                >
                  S
                </div>
                <span className="text-sm text-muted-foreground">
                  {shortPrincipal(
                    d.studentId as unknown as { toText(): string },
                  )}
                </span>
              </div>
              <Badge
                className={
                  d.isResolved
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
                }
              >
                {d.isResolved ? "Resolved" : "Pending"}
              </Badge>
            </div>
            <p className="text-sm">{d.text}</p>
            {d.reply && (
              <div
                className="p-3 rounded-lg border-l-2 border-purple-500/40"
                style={{ background: "rgba(168,85,247,0.1)" }}
              >
                <p className="text-xs text-muted-foreground mb-1">
                  Your reply:
                </p>
                <p className="text-sm">{d.reply}</p>
              </div>
            )}
            {!d.isResolved && (
              <div className="flex gap-2">
                <Input
                  data-ocid={`doubts_inbox.item.${i + 1}`}
                  value={replies[i] ?? ""}
                  onChange={(e) =>
                    setReplies((r) => ({ ...r, [i]: e.target.value }))
                  }
                  placeholder="Reply to this doubt…"
                  className="flex-1 bg-white/5 border-white/10"
                  onKeyDown={(e) => e.key === "Enter" && reply(i)}
                />
                <button
                  data-ocid={"doubts_inbox.submit_button"}
                  onClick={() => reply(i)}
                  disabled={loading[i]}
                  className="gradient-btn px-4 py-2 rounded-xl"
                >
                  {loading[i] ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
                <button
                  data-ocid={"doubts_inbox.delete_button"}
                  onClick={() => resolve(i)}
                  disabled={!!loading[`r${i}`]}
                  className="px-4 py-2 rounded-xl border border-green-500/40 text-green-400 hover:bg-green-500/10"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TEACHER: FEEDBACK ───────────────────────────────────────────────────────

function TeacherFeedback({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["feedback"],
    queryFn: () => actor.getAllFeedback(),
  });

  const avgRating = feedback.length
    ? (
        feedback.reduce((a, f) => a + Number(f.rating), 0) / feedback.length
      ).toFixed(1)
    : "–";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📝 Student Feedback</h2>
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          <span className="font-bold">{avgRating}</span>
          <span className="text-sm text-muted-foreground">avg</span>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}
      {feedback.length === 0 && !isLoading ? (
        <div
          data-ocid="feedback.empty_state"
          className="glass-card p-10 text-center text-muted-foreground"
        >
          No feedback yet.
        </div>
      ) : null}
      <div className="space-y-3">
        {feedback.map((f, i) => (
          <div
            key={i}
            data-ocid={`feedback.item.${i + 1}`}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {shortPrincipal(f.studentId as unknown as { toText(): string })}
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Number(f.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm">{f.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TEACHER: ATTENDANCE MANAGEMENT ──────────────────────────────────────────

function TeacherAttendance({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => actor.getStudents(),
  });
  const { data: classAttendance = [] } = useQuery({
    queryKey: ["classAttendance"],
    queryFn: () => actor.getClassAttendance(),
  });
  const qc = useQueryClient();
  const [marking, setMarking] = useState<Record<string, boolean>>({});

  const markAttendance = async (studentId: unknown, isPresent: boolean) => {
    const key = `${studentId}_${isPresent}`;
    setMarking((m) => ({ ...m, [key]: true }));
    try {
      await actor.markAttendance(
        studentId as Parameters<typeof actor.markAttendance>[0],
        isPresent,
      );
      qc.invalidateQueries({ queryKey: ["classAttendance"] });
      toast.success(`Marked ${isPresent ? "present" : "absent"}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setMarking((m) => ({ ...m, [key]: false }));
    }
  };

  const getStudentAttendance = (principal: unknown): AttendanceRecord[] => {
    const rec = classAttendance.find(([p]) => p === principal);
    return rec ? rec[1] : [];
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📋 Attendance Management</h2>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : null}
      {students.length === 0 && !isLoading ? (
        <div
          data-ocid="attendance_mgmt.empty_state"
          className="glass-card p-10 text-center text-muted-foreground"
        >
          No students registered yet.
        </div>
      ) : null}
      <div className="space-y-3">
        {students.map((student, i) => {
          const records = getStudentAttendance(student);
          const present = records.filter((r) => r.isPresent).length;
          const pct = records.length
            ? Math.round((present / records.length) * 100)
            : 0;
          return (
            <div
              key={i}
              data-ocid={`attendance_mgmt.item.${i + 1}`}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium">{student.username}</h4>
                  <p className="text-xs text-muted-foreground">
                    {pct}% attendance · {records.length} days
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    data-ocid={"attendance_mgmt.primary_button"}
                    onClick={() => markAttendance(student, true)}
                    disabled={!!marking[`${student}_true`]}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 flex items-center gap-1"
                  >
                    {marking[`${student}_true`] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}{" "}
                    Present
                  </button>
                  <button
                    data-ocid={"attendance_mgmt.delete_button"}
                    onClick={() => markAttendance(student, false)}
                    disabled={!!marking[`${student}_false`]}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center gap-1"
                  >
                    {marking[`${student}_false`] ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}{" "}
                    Absent
                  </button>
                </div>
              </div>
              <Progress value={pct} className="h-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── STUDENT FEEDBACK SUBMIT ─────────────────────────────────────────────────

function StudentFeedback({
  actor,
}: { actor: NonNullable<ReturnType<typeof useActor>["actor"]> }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim()) {
      toast.error("Enter feedback");
      return;
    }
    setSubmitting(true);
    try {
      await actor.submitFeedback(text.trim(), BigInt(rating));
      qc.invalidateQueries({ queryKey: ["feedback"] });
      toast.success("Feedback submitted!");
      setText("");
      setRating(5);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">📝 Submit Feedback</h2>
      <div className="glass-card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => setRating(s)}
                className="text-2xl transition-transform hover:scale-110"
              >
                <Star
                  className={`w-7 h-7 ${s <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <Textarea
          data-ocid="feedback.textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your feedback…"
          className="bg-white/5 border-white/10 resize-none"
          rows={4}
        />
        <button
          data-ocid="feedback.submit_button"
          onClick={submit}
          disabled={submitting}
          className="gradient-btn w-full py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}{" "}
          Submit Feedback
        </button>
      </div>
    </div>
  );
}

// ─── MOBILE FRAME ─────────────────────────────────────────────────────────────

function MobileFrame({
  children,
  onClose,
}: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative"
        style={{
          width: 375,
          height: 812,
          border: "12px solid #1a1a2e",
          borderRadius: 40,
          boxShadow: "0 0 0 4px #333, 0 30px 80px rgba(0,0,0,0.8)",
          overflow: "hidden",
          background: "#0b1020",
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 rounded-b-2xl z-10"
          style={{ background: "#1a1a2e" }}
        />
        <div className="overflow-auto h-full pt-6">{children}</div>
      </div>
      <button
        onClick={onClose}
        data-ocid="mobile.close_button"
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl"
      >
        ✕
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const { actor } = useActor();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("dark");
    return stored !== null ? stored === "true" : true;
  });
  const [view, setView] = useState<DashboardView>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const qc = useQueryClient();

  // apply dark class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("dark", String(darkMode));
  }, [darkMode]);

  // auto-login if profile exists
  useEffect(() => {
    if (!actor) return;
    actor
      .getCallerUserProfile()
      .then((p) => {
        if (p) setProfile(p);
        setCheckingProfile(false);
      })
      .catch(() => setCheckingProfile(false));
  }, [actor]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => actor!.getNotifications(),
    enabled: !!actor && !!profile,
  });
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    setProfile(null);
    qc.clear();
  };

  const isTeacher = profile?.role === Role.teacher;

  const studentNav: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    { id: "quiz", label: "Quiz", icon: <ClipboardList className="w-4 h-4" /> },
    {
      id: "polls",
      label: "Live Polls",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "game",
      label: "Knowledge Game",
      icon: <Gamepad2 className="w-4 h-4" />,
    },
    {
      id: "doubts",
      label: "My Doubts",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  const teacherNav: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: "quiz-manager",
      label: "Quiz Manager",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: "poll-manager",
      label: "Poll Manager",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "doubts-inbox",
      label: "Doubts Inbox",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: "attend-mgmt",
      label: "Attendance",
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
  ];

  const navItems = isTeacher ? teacherNav : studentNav;

  if (checkingProfile)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#0b1020,#0f172a)" }}
      >
        <div className="text-center">
          <Loader2
            className="w-12 h-12 animate-spin mx-auto mb-4"
            style={{ color: "#38bdf8" }}
          />
          <p className="text-muted-foreground">Loading Smart Classroom…</p>
        </div>
      </div>
    );

  if (!profile)
    return (
      <>
        <LoginPage
          onLogin={(p) => {
            setProfile(p);
            setView("dashboard");
          }}
        />
        <Toaster />
      </>
    );

  const renderView = () => {
    if (!actor) return null;
    if (isTeacher) {
      switch (view) {
        case "dashboard":
          return <TeacherDashboard actor={actor} />;
        case "quiz-manager":
          return <TeacherQuizManager actor={actor} />;
        case "poll-manager":
          return <TeacherPollManager actor={actor} />;
        case "doubts-inbox":
          return <TeacherDoubtsInbox actor={actor} />;
        case "feedback":
          return <TeacherFeedback actor={actor} />;
        case "attend-mgmt":
          return <TeacherAttendance actor={actor} />;
        case "notifications":
          return <NotificationsPanel actor={actor} />;
        default:
          return <TeacherDashboard actor={actor} />;
      }
    }
    switch (view) {
      case "dashboard":
        return <StudentDashboard actor={actor} />;
      case "quiz":
        return <StudentQuiz actor={actor} />;
      case "polls":
        return <StudentPolls actor={actor} />;
      case "game":
        return <KnowledgeGame actor={actor} />;
      case "doubts":
        return <StudentDoubts actor={actor} />;
      case "feedback":
        return <StudentFeedback actor={actor} />;
      case "attendance":
        return <StudentAttendance actor={actor} />;
      case "notifications":
        return <NotificationsPanel actor={actor} />;
      default:
        return <StudentDashboard actor={actor} />;
    }
  };

  const dashboardContent = (
    <div
      className="flex min-h-screen"
      style={{
        background: darkMode
          ? "linear-gradient(135deg,#0b1020,#0f172a,#1a0533)"
          : undefined,
      }}
    >
      {/* Background glows */}
      {darkMode && (
        <>
          <div
            className="fixed top-32 left-40 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: "#3b82f6" }}
          />
          <div
            className="fixed bottom-32 right-40 w-96 h-96 rounded-full opacity-8 blur-3xl pointer-events-none"
            style={{ background: "#a855f7" }}
          />
        </>
      )}
      <Sidebar
        items={navItems}
        active={view}
        onSelect={setView}
        darkMode={darkMode}
      />
      <main className="flex-1 overflow-auto">
        <TopNav
          profile={profile}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          unreadCount={unreadCount}
          onBell={() => setView("notifications")}
          onLogout={handleLogout}
          onMobile={() => setMobileOpen(true)}
        />
        <div className="p-6 max-w-5xl">{renderView()}</div>
        <footer className="text-center py-6 text-sm text-muted-foreground border-t border-white/5">
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:underline"
          >
            caffeine.ai
          </a>
        </footer>
      </main>
    </div>
  );

  return (
    <div className={darkMode ? "dark" : ""}>
      <Toaster />
      {dashboardContent}
      {mobileOpen && (
        <MobileFrame onClose={() => setMobileOpen(false)}>
          {dashboardContent}
        </MobileFrame>
      )}
      {/* Floating mobile button */}
      <button
        data-ocid="nav.toggle"
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-40 gradient-btn"
        title="Mobile simulation"
      >
        <Smartphone className="w-5 h-5" />
      </button>
    </div>
  );
}

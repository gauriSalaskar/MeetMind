import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  Brain,
  BellRing,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ListChecks,
  Snowflake,
} from "lucide-react";
import { dashboardApi, commitmentsApi } from "../api/endpoints";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import { SkeletonStat, SkeletonContactCard } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import CommitmentsList from "../components/CommitmentsList";
import CountUp from "../components/CountUp";

const STAT_CONFIG = [
  { key: "total_contacts", label: "Total Contacts", icon: Users },
  { key: "meetings_logged", label: "Meetings Logged", icon: CalendarCheck },
  { key: "memory_score_average", label: "Memory Score Average", icon: Brain },
  { key: "follow_ups_due", label: "Follow-Ups Due", icon: BellRing },
  { key: "commitments_due", label: "Commitments Due/Overdue", icon: ListChecks },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commitments, setCommitments] = useState([]);

  const fetchCommitments = () => {
    commitmentsApi
      .list()
      .then((res) => setCommitments(res.data.commitments.filter((c) => !c.done)))
      .catch(() => {});
  };

  useEffect(() => {
    dashboardApi
      .summary()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
    fetchCommitments();
  }, []);

  const commitmentsDue = commitments.filter((c) => c.status === "due_today" || c.status === "overdue").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-primary">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-ink-muted mt-1">Here's what's happening with your relationships.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
          : STAT_CONFIG.map(({ key, label, icon: Icon }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-ink-muted">{label}</span>
                    <div className="w-8 h-8 rounded-lg bg-clay/10 flex items-center justify-center">
                      <Icon size={15} className="text-clay-soft" />
                    </div>
                  </div>
                  <p className="font-display text-3xl font-bold text-ink-primary">
                    <CountUp value={key === "commitments_due" ? commitmentsDue : data?.stats?.[key] ?? 0} />
                  </p>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Going Cold */}
      {!loading && data?.going_cold?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Snowflake size={16} className="text-sky-400" />
            <h2 className="font-display text-lg font-semibold text-ink-primary">
              Going Cold
            </h2>
            <span className="text-xs text-ink-muted">
              — contacts you haven't connected with in a while
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.going_cold.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link to={`/contacts/${c.id}`}>
                  <Card className="flex items-center gap-3 py-3">
                    <Avatar initials={c.initials} category={c.category} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-primary truncate text-sm">{c.name}</p>
                      <p className="text-xs text-sky-400">
                        {c.days_since_contact}d since contact
                      </p>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contacts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Recent Contacts</h2>
            <Link to="/contacts" className="text-sm text-clay-soft hover:text-glow-light flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <SkeletonContactCard key={i} />)}
            </div>
          ) : data?.recent_contacts?.length ? (
            <div className="space-y-3">
              {data.recent_contacts.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link to={`/contacts/${c.id}`}>
                    <Card className="flex items-center gap-4 py-4">
                      <Avatar initials={c.initials} category={c.category} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink-primary truncate">{c.name}</p>
                        <p className="text-sm text-ink-muted truncate">
                          {c.role || "—"} {c.company ? `at ${c.company}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-ink-muted shrink-0">
                        {c.relationship_score ?? 0}
                      </span>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card hover={false}>
              <EmptyState
                icon={Users}
                title="No contacts yet"
                description="Add your first relationship to start building your second brain."
                action={
                  <Link to="/contacts">
                    <span className="text-sm text-clay-soft hover:text-glow-light font-medium">
                      Add a contact →
                    </span>
                  </Link>
                }
              />
            </Card>
          )}
        </div>

        {/* Sidebar: Follow-ups & Relationship Overview */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Open Commitments</h2>
            <Card hover={false} className="py-4">
              <CommitmentsList
                commitments={commitments.slice(0, 5)}
                onChanged={fetchCommitments}
                emptyText="Nothing tracked yet — commitments surface automatically from your meetings and voice notes."
              />
            </Card>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Upcoming Follow-Ups</h2>
            {loading ? (
              <SkeletonContactCard />
            ) : data?.upcoming_follow_ups?.length ? (
              <Card className="space-y-3 py-4">
                {data.upcoming_follow_ups.map((r) => (
                  <div key={r.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-clay/10 flex items-center justify-center mt-0.5 shrink-0">
                      <BellRing size={13} className="text-clay-soft" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-ink-primary truncate">{r.title}</p>
                      <p className="text-xs text-ink-muted">{r.due_date}</p>
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <Card hover={false}>
                <p className="text-sm text-ink-muted text-center py-4">No reminders yet.</p>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-ink-primary">Relationship Overview</h2>
            {loading ? (
              <SkeletonStat />
            ) : (
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-clay-soft" />
                    <span className="text-sm text-ink-secondary">Healthy</span>
                  </div>
                  <span className="text-lg font-display font-bold text-clay-soft">
                    {data?.relationship_overview?.healthy_count ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" />
                    <span className="text-sm text-ink-secondary">Needs Attention</span>
                  </div>
                  <span className="text-lg font-display font-bold text-amber-400">
                    {data?.relationship_overview?.needs_attention_count ?? 0}
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
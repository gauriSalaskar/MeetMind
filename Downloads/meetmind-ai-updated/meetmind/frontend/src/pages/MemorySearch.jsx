import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { aiApi } from "../api/endpoints";
import Card from "../components/Card";
import Avatar from "../components/Avatar";
import CategoryBadge from "../components/CategoryBadge";
import Input from "../components/Input";
import Button from "../components/Button";
import AILoading from "../components/AILoading";
import EmptyState from "../components/EmptyState";
import { useToast } from "../context/ToastContext";

const EXAMPLES = [
  "Who is building a startup?",
  "Who likes cricket?",
  "Who wants an internship?",
  "Who works in fintech?",
];

export default function MemorySearch() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (q) => {
    const text = (q ?? query).trim();
    if (!text) return;
    setQuery(text);
    setLoading(true);
    setSearched(true);
    try {
      const res = await aiApi.search(text);
      setResults(res.data.results);
    } catch (err) {
      showToast(err.response?.data?.error || "Search failed", "error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-primary flex items-center gap-2">
          <Sparkles size={24} className="text-clay-soft" /> AI Memory Search
        </h1>
        <p className="text-ink-muted mt-1">Ask in plain language. MeetMind AI searches your entire memory.</p>
      </div>

      <Card hover={false}>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder='Try: "Who is building a startup?"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11"
            />
          </div>
          <Button type="submit" variant="primary" loading={loading}>
            <Sparkles size={16} /> Search
          </Button>
        </form>

        {!searched && (
          <div className="flex flex-wrap gap-2 mt-4">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => runSearch(ex)}
                className="text-xs px-3 py-1.5 rounded-full glass text-ink-muted hover:text-clay-soft hover:border-clay/30 border border-transparent transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </Card>

      {loading ? (
        <Card hover={false}>
          <AILoading label="Searching across contacts, meetings, and memories..." />
        </Card>
      ) : searched && results ? (
        results.length === 0 ? (
          <Card hover={false}>
            <EmptyState
              icon={Search}
              title="No matches found"
              description="Try rephrasing your search or log more meetings to build memory."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {results.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                >
                  <Link to={`/contacts/${r.id}`}>
                    <Card>
                      <div className="flex items-start gap-4 mb-3">
                        <Avatar initials={r.initials} category={r.category} />
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-ink-primary truncate">{r.name}</p>
                          <p className="text-sm text-ink-muted truncate">
                            {r.role || "—"} {r.company ? `at ${r.company}` : ""}
                          </p>
                        </div>
                      </div>
                      <CategoryBadge category={r.category} />
                      {r.reason && (
                        <p className="text-sm text-ink-secondary mt-3 flex items-start gap-2">
                          <Sparkles size={13} className="text-clay-soft mt-0.5 shrink-0" />
                          <span>{r.reason}</span>
                        </p>
                      )}
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      ) : null}
    </div>
  );
}

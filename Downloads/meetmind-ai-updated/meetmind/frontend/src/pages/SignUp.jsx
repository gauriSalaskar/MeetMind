import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ParticleNetwork from "../components/ParticleNetwork";
import Input from "../components/Input";
import Button from "../components/Button";
import GoogleSignInButton from "../components/GoogleSignInButton";

export default function SignUp() {
  const { signup, googleSignin } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.confirmPassword);
      showToast("Account created! Welcome to MeetMind AI.", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    try {
      await googleSignin(credential);
      showToast("Account created! Welcome to MeetMind AI.", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to sign up with Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <ParticleNetwork variant="minimal" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-clay to-clay-soft flex items-center justify-center shadow-glow">
              <Brain size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-xl text-ink-primary">MeetMind AI</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-ink-primary mb-1">Create your account</h1>
          <p className="text-sm text-ink-muted">Start remembering what matters</p>
        </div>

        <div className="glass rounded-2xl p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
            <Input
              label="Name"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={update("name")}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update("email")}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={update("password")}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              required
            />
            <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
              Create account <ArrowRight size={16} />
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-ink-muted">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleCredential}
            onError={(msg) => setError(msg)}
          />
        </div>

        <p className="text-center text-sm text-ink-muted mt-6">
          Already have an account?{" "}
          <Link to="/signin" className="text-clay-soft hover:text-glow-light font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
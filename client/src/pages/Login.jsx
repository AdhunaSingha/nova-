import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [
    authLoading,
    isAuthenticated,
    navigate,
  ]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const fillDemoCredentials = () => {
    setForm({
      email: "demo@nova.dev",
      password: "DemoPass@2026",
      remember: true,
    });

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: form.email.trim(),
        password: form.password,
      });

      const destination =
        location.state?.from || "/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (submitError) {
      setError(
        submitError.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">

        {/* =================================================
            LEFT — NOVA BRAND / PRODUCT INTRO
            ================================================= */}

        <div className="auth-hero">

          <div className="auth-brand">
            <div className="auth-brand-mark">
              N
            </div>

            <div>
              <span className="auth-brand-name">
                NOVA
              </span>

              <span className="auth-brand-version">
                TEAM PRODUCTIVITY
              </span>
            </div>
          </div>

          <div className="auth-hero-content">
            <p className="auth-eyebrow">
              PLAN. COLLABORATE. DELIVER.
            </p>

            <h1>
              Your team's work,
              <br />
              <span>in one orbit.</span>
            </h1>

            <p className="auth-hero-description">
              Plan projects, coordinate teams, manage
              tasks and turn engineering work into
              measurable delivery.
            </p>

            <div className="auth-feature-list">

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  ◈
                </div>

                <div>
                  <strong>
                    Project intelligence
                  </strong>

                  <span>
                    Track progress, velocity and
                    delivery health in real time.
                  </span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Task orchestration
                  </strong>

                  <span>
                    Move work from backlog to done
                    with a focused Kanban workflow.
                  </span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  ◎
                </div>

                <div>
                  <strong>
                    Team visibility
                  </strong>

                  <span>
                    Understand workload, capacity
                    and current team activity.
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="auth-system-status">
            <span className="auth-status-dot" />

            <div>
              <strong>
                NOVA SYSTEMS OPERATIONAL
              </strong>

              <span>
                Workspace services ready
              </span>
            </div>
          </div>

        </div>

        {/* =================================================
            RIGHT — LOGIN
            ================================================= */}

        <div className="auth-panel">

          <div className="auth-panel-top">
            <span className="auth-panel-label">
              WORKSPACE ACCESS
            </span>

            <span className="auth-secure-badge">
              SECURE SESSION
            </span>
          </div>

          <div className="auth-form-container">

            <div className="auth-heading">
              <p className="auth-eyebrow">
                WELCOME BACK
              </p>

              <h2>
                Sign in to NOVA<span>.</span>
              </h2>

              <p>
                Access your projects, tasks and
                team workspace.
              </p>
            </div>

            {/* Demo credentials */}

            <button
              type="button"
              className="auth-demo-button"
              onClick={fillDemoCredentials}
            >
              <span className="auth-demo-icon">
                ⚡
              </span>

              <span>
                Use demo credentials
              </span>

              <span className="auth-demo-arrow">
                →
              </span>
            </button>

            {/* Error */}

            {error && (
              <div className="auth-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >

              {/* Email */}

              <div className="auth-field">
                <label htmlFor="login-email">
                  EMAIL ADDRESS
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    @
                  </span>

                  <input
                    id="login-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password">
                    PASSWORD
                  </label>

                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={() =>
                      setError(
                        "Password recovery will be connected to the backend."
                      )
                    }
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    •••
                  </span>

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={form.password}
                    onChange={(event) =>
                      updateField(
                        "password",
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "◉" : "○"}
                  </button>
                </div>
              </div>

              {/* Remember */}

              <div className="auth-options">

                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(event) =>
                      updateField(
                        "remember",
                        event.target.checked
                      )
                    }
                  />

                  <span>
                    Remember me
                  </span>
                </label>

                <span className="auth-session-info">
                  JWT SESSION · 7 DAYS
                </span>

              </div>

              {/* Submit */}

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="auth-spinner" />
                    Verifying credentials...
                  </>
                ) : (
                  <>
                    Sign in to workspace
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            {/* Register */}

            <div className="auth-register">
              <span>
                Don't have a NOVA workspace?
              </span>

              <Link to="/register">
                Create one
              </Link>
            </div>

          </div>

          <div className="auth-footer">
            <span>
              NOVA v1.0
            </span>

            <div>
              <span>Privacy</span>
              <span>•</span>
              <span>Security</span>
            </div>
          </div>

        </div>

      </section>
    </main>
  );
}

export default Login;
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();

  const {
    register,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    workspace: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", {
        replace: true,
      });
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!form.workspace.trim()) {
      setError("Please enter a workspace name.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      form.password !== form.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.agree) {
      setError(
        "Please accept the terms to continue."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        workspace: form.workspace.trim(),
      });

      navigate("/dashboard", {
        replace: true,
      });
    } catch (submitError) {
      setError(
        submitError.message ||
          "Unable to create your workspace."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-shell">

        {/* =================================================
            LEFT — BRAND
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
              BUILD YOUR WORKSPACE
            </p>

            <h1>
              Turn scattered work
              <br />
              <span>into momentum.</span>
            </h1>

            <p className="auth-hero-description">
              Create a centralized workspace for
              your projects, engineering teams and
              delivery workflows.
            </p>

            <div className="auth-feature-list">

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  +
                </div>

                <div>
                  <strong>
                    One workspace
                  </strong>

                  <span>
                    Bring projects, tasks and people
                    together in one place.
                  </span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  ↗
                </div>

                <div>
                  <strong>
                    Delivery focused
                  </strong>

                  <span>
                    Measure progress and keep every
                    sprint moving forward.
                  </span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  ◌
                </div>

                <div>
                  <strong>
                    Team aware
                  </strong>

                  <span>
                    Give everyone visibility into
                    ownership and workload.
                  </span>
                </div>
              </div>

            </div>

          </div>

          <div className="auth-system-status">
            <span className="auth-status-dot" />

            <div>
              <strong>
                WORKSPACE SERVICES READY
              </strong>

              <span>
                NOVA registration system
              </span>
            </div>
          </div>

        </div>

        {/* =================================================
            RIGHT — REGISTER
            ================================================= */}

        <div className="auth-panel">

          <div className="auth-panel-top">
            <span className="auth-panel-label">
              NEW WORKSPACE
            </span>

            <span className="auth-secure-badge">
              SECURE SETUP
            </span>
          </div>

          <div className="auth-form-container">

            <div className="auth-heading">
              <p className="auth-eyebrow">
                GET STARTED
              </p>

              <h2>
                Create your NOVA workspace<span>.</span>
              </h2>

              <p>
                Set up your account and start
                organizing your team's work.
              </p>
            </div>

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

              {/* Name */}

              <div className="auth-field">
                <label htmlFor="register-name">
                  FULL NAME
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    N
                  </span>

                  <input
                    id="register-name"
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="Alex Morgan"
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}

              <div className="auth-field">
                <label htmlFor="register-email">
                  WORK EMAIL
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    @
                  </span>

                  <input
                    id="register-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value
                      )
                    }
                    placeholder="alex@company.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Workspace */}

              <div className="auth-field">
                <label htmlFor="register-workspace">
                  WORKSPACE NAME
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    #
                  </span>

                  <input
                    id="register-workspace"
                    type="text"
                    value={form.workspace}
                    onChange={(event) =>
                      updateField(
                        "workspace",
                        event.target.value
                      )
                    }
                    placeholder="NOVA Engineering"
                  />
                </div>

                <span className="auth-field-help">
                  You can change this later from
                  workspace settings.
                </span>
              </div>

              {/* Password */}

              <div className="auth-field">
                <label htmlFor="register-password">
                  PASSWORD
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    •••
                  </span>

                  <input
                    id="register-password"
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
                    placeholder="Create a password"
                    autoComplete="new-password"
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

              {/* Confirm password */}

              <div className="auth-field">
                <label htmlFor="register-confirm-password">
                  CONFIRM PASSWORD
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    •••
                  </span>

                  <input
                    id="register-confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={form.confirmPassword}
                    onChange={(event) =>
                      updateField(
                        "confirmPassword",
                        event.target.value
                      )
                    }
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword
                      ? "◉"
                      : "○"}
                  </button>
                </div>
              </div>

              {/* Terms */}

              <label className="auth-checkbox auth-terms">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(event) =>
                    updateField(
                      "agree",
                      event.target.checked
                    )
                  }
                />

                <span>
                  I agree to the NOVA workspace
                  terms and security policy.
                </span>
              </label>

              {/* Submit */}

              <button
                type="submit"
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="auth-spinner" />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create team workspace
                    <span>→</span>
                  </>
                )}
              </button>

            </form>

            <div className="auth-register">
              <span>
                Already have a NOVA account?
              </span>

              <Link to="/login">
                Sign in
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

export default Register;
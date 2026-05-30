import { useState } from "react";
import { ArrowRight, Check, ClipboardList, Hand, ListChecks, Mic, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";

const featureItems = [
  {
    icon: ListChecks,
    title: "Voice-Guided Navigation",
    text: "Follow along hands-free. Navigate between tutorial steps, repeat instructions, or ask for details using simple English commands.",
  },
  {
    icon: Mic,
    title: "Interactive Workspace Prep",
    text: "Prepare your tools and checklist before starting. View required materials and check off completed items in real time.",
  },
  {
    icon: ClipboardList,
    title: "Flexible Guided Sessions",
    text: "Walk through step-by-step tutorials with structured guidance, showing you how controls adjust to different environments.",
  },
  {
    icon: Hand,
    title: "Seamless Touch Fallback",
    text: "Ditch voice controls anytime. Interactive on-screen buttons remain fully functional for quick manual navigation.",
  },
];

const voiceCommandsDetails = [
  {
    phrase: "next step",
    action: "Navigates forward",
    desc: "Moves the tutorial to the next step card and resets focus to the top of the new instructions."
  },
  {
    phrase: "repeat instruction",
    action: "Reads step aloud",
    desc: "Triggers voice narration to read the current step instruction aloud so you don't have to look at the screen."
  },
  {
    phrase: "show materials",
    action: "Opens materials list",
    desc: "Slides open the required tools and materials list panel from the side for quick verification."
  },
  {
    phrase: "scroll down",
    action: "Scrolls instructions",
    desc: "Scrolls the browser page downward by a portion of the screen, helping you see further instructions."
  }
];

export function LandingPage() {
  const [activeCommand, setActiveCommand] = useState("next step");

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy animate-fade-in-up">
            <p className="eyebrow">Smart DIY Companion</p>
            <h1>Build hands-free with voice assistance</h1>
            <p className="hero-text">
              Ditch the touch screen when your hands are full of paint, glue, or dust. Follow step-by-step tutorials with simple, responsive voice commands.
            </p>
            <div className="hero-actions">
              <Link className="button primary-button" to="/tutorials">
                Browse Tutorials
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="button secondary-button" to="/guided-session">
                Try Guided Session
              </Link>
            </div>
          </div>

          <div className="hero-media animate-float" aria-label="DIY Voice Assistant Preview">
            <div className="hero-mockup-card">
              <div className="mockup-badge">
                <span className="mockup-indicator-dot pulse-animation" />
                <span>Voice Active</span>
              </div>
              <div className="mockup-card-header">
                <span className="mockup-step-count">Step 3 of 6</span>
                <span className="mockup-time">Prep Time: 5 min</span>
              </div>
              <div className="mockup-card-body">
                <h3>Applying Painter's Tape</h3>
                <p>
                  Press the tape firmly along the baseboard to ensure a sharp, clean paint line. Keep your alignment straight.
                </p>
              </div>
              <div className="mockup-card-footer">
                <div className="mockup-status-group">
                  <Mic className="pulse-mic-icon" size={14} aria-hidden="true" />
                  <span className="mockup-status-text">Listening...</span>
                </div>
                <div className="mockup-tip">
                  Say <code className="mockup-code">"next step"</code> to advance
                </div>
              </div>
            </div>
            <div className="hero-blur-blob" />
          </div>
        </div>
      </section>

      <section className="content-band feature-section">
        <div className="section-heading">
          <p className="eyebrow">Core Features</p>
          <h2>Designed for hands-busy moments</h2>
        </div>
        <div className="landing-feature-grid">
          {featureItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <article className={`landing-card feature-card-${idx}`} key={item.title}>
                <span className="feature-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <div className="feature-card-accent" />
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-band voice-preview-section">
        <div className="voice-preview-grid">
          <div className="voice-preview-copy">
            <p className="eyebrow">Hands-Free Control</p>
            <h2>Control steps with simple voice commands</h2>
            <p>
              Turn on your microphone and navigate your guides using simple English phrases. No screen touching required, ideal for when your hands are full of paint, tools, or grease.
            </p>
            <div className="voice-status-mock">
              <div className="status-mic-badge">
                <Mic size={16} className="pulse-mic-icon" />
                <span>Microphone Mode Active</span>
              </div>
            </div>
          </div>

          <div className="voice-commands-showcase" aria-label="Voice commands reference guide">
            {voiceCommandsDetails.map((cmd) => {
              const isSelected = activeCommand === cmd.phrase;
              return (
                <button
                  type="button"
                  key={cmd.phrase}
                  className={isSelected ? "voice-cmd-card active" : "voice-cmd-card"}
                  onClick={() => setActiveCommand(cmd.phrase)}
                  aria-expanded={isSelected}
                  aria-controls={`voice-command-${cmd.phrase.replaceAll(" ", "-")}`}
                >
                  <div className="voice-cmd-header">
                    <span className="voice-cmd-phrase">"{cmd.phrase}"</span>
                    <span className="voice-cmd-action">{cmd.action}</span>
                  </div>
                  <div
                    className="voice-cmd-body"
                    id={`voice-command-${cmd.phrase.replaceAll(" ", "-")}`}
                    aria-hidden={!isSelected}
                  >
                    <div className="voice-cmd-body-inner">
                      <p>{cmd.desc}</p>
                      <div className="voice-cmd-pulse-line">
                        <span className="pulse-dot" />
                        <span className="pulse-wave" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="content-band guided-session-section">
        <div className="guided-session-split">
          <div className="guided-session-visual">
            <div className="guided-tour-card">
              <div className="guided-tour-card-header">
                <div>
                  <h3>Your guided journey</h3>
                </div>
                <span className="guided-tour-status">
                  <span className="guided-tour-status-dot" />
                  In progress
                </span>
              </div>

              <div className="guided-tour-progress">
                <div className="guided-tour-progress-line" aria-hidden="true" />
                <div className="guided-tour-step completed">
                  <span className="guided-tour-step-marker">
                    <Check size={14} aria-hidden="true" />
                  </span>
                  <div>
                    <span className="guided-tour-step-state">Completed</span>
                    <strong>Set up workspace</strong>
                  </div>
                </div>
                <div className="guided-tour-step active">
                  <span className="guided-tour-step-marker">2</span>
                  <div>
                    <span className="guided-tour-step-state">Current step</span>
                    <strong>Practice voice commands</strong>
                  </div>
                </div>
                <div className="guided-tour-step">
                  <span className="guided-tour-step-marker">3</span>
                  <div>
                    <span className="guided-tour-step-state">Up next</span>
                    <strong>Complete DIY steps</strong>
                  </div>
                </div>
                <div className="guided-tour-step">
                  <span className="guided-tour-step-marker">4</span>
                  <div>
                    <span className="guided-tour-step-state">Final step</span>
                    <strong>Submit feedback survey</strong>
                  </div>
                </div>
              </div>

              <div className="guided-tour-card-footer">
                <Mic size={15} aria-hidden="true" />
                <span>Voice guidance stays available throughout the tour.</span>
              </div>
            </div>
          </div>
          <div className="guided-session-info">
            <p className="eyebrow">Guided Tour</p>
            <h2>Try a structured Guided Session</h2>
            <p>
              Experience the hands-free tutorial flow in a guided environment. Learn how voice commands, material lists, and search work in a complete.
            </p>
            <Link className="button primary-button" to="/guided-session">
              Start Guided Session
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="content-band final-cta-section">
        <div className="final-cta-panel">
          <PackageCheck aria-hidden="true" />
          <div>
            <h2>Ready to start building?</h2>
            <p>Browse our catalog of interactive tutorials, prepare your tools, and follow along with the controls that fit your space.</p>
          </div>
          <Link className="button primary-button" to="/tutorials">
            Explore Tutorials
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

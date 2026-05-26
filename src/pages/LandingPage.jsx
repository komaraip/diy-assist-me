import { ArrowRight, ClipboardList, Hand, ListChecks, Mic, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { ImageWithFallback } from "../components/common/ImageWithFallback.jsx";

const heroImage =
  "https://images.unsplash.com/photo-1666356011542-0acf82fb16a1?auto=format&fit=crop&w=1200&q=80";
const workshopImage =
  "https://images.unsplash.com/photo-1602856805912-5dab4ce4b618?auto=format&fit=crop&w=800&q=80";

const featureItems = [
  {
    icon: ListChecks,
    title: "Structured tutorial website",
    text: "Shared step cards, materials, search, and overview controls keep both study conditions comparable.",
  },
  {
    icon: Mic,
    title: "Fixed English voice commands",
    text: "A constrained command set triggers the same tutorial actions as touch controls in Chrome desktop.",
  },
  {
    icon: ClipboardList,
    title: "Chapter 4 study flow",
    text: "AB/BA sessions collect task timing, task success, SUS, voice reliability, and debrief evidence.",
  },
  {
    icon: Hand,
    title: "Touch fallback",
    text: "Buttons remain available during voice mode and fallback use is logged for analysis.",
  },
];

const howItWorksItems = [
  {
    title: "Create a study session",
    text: "Confirm consent, assign AB or BA order, choose tutorial rotation, and record setup notes.",
  },
  {
    title: "Run matched tasks",
    text: "Participants complete practice and measured task scripts in touch and voice mode.",
  },
  {
    title: "Export evidence",
    text: "Task trials, SUS, logs, observer notes, and debrief responses support Chapter 4 analysis.",
  },
];

const voiceCommands = ["next step", "repeat", "show materials", "search for tape"];

export function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero-section">
        <ImageWithFallback
          src={heroImage}
          alt="Hands preparing a DIY project on a work surface"
          className="hero-background-image"
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Practical DIY help</p>
            <h1>DIY tutorials for hands-busy moments</h1>
            <p className="hero-text">
              Choose a tutorial, prepare your materials, and follow each step with touch controls or
              simple voice commands.
            </p>
            <div className="hero-actions">
              <Link className="button primary-button" to="/tutorials">
                Browse Tutorials
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="button secondary-button" to="/study">
                Try Guided Session
              </Link>
            </div>
          </div>
          <div className="hero-media" aria-label="DIY project preview">
            <div className="hero-image-small">
              <ImageWithFallback src={workshopImage} alt="Hands working with wood in a workshop" />
            </div>
            <div className="floating-status">Chrome desktop, low-noise room, no raw audio</div>
          </div>
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <p className="eyebrow">What you can do</p>
          <h2>Helpful tools for following DIY steps without losing your place.</h2>
        </div>
        <div className="landing-feature-grid">
          {featureItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className="landing-card" key={item.title}>
                <span className="feature-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-band landing-section">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Start a project and move through each instruction at your own pace.</h2>
        </div>
        <div className="how-steps">
          {howItWorksItems.map((item, index) => (
            <article className="how-step" key={item.title}>
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band voice-preview-section">
        <div className="voice-preview-copy">
          <p className="eyebrow">Voice command preview</p>
          <h2>Keep going with simple spoken shortcuts.</h2>
          <p>
            Voice commands are there when your hands are full. You can still use the on-screen
            buttons anytime.
          </p>
        </div>
        <div className="command-preview-list" aria-label="Example voice commands">
          {voiceCommands.map((command) => (
            <span className="command-chip" key={command}>
              <Mic aria-hidden="true" />
              {command}
            </span>
          ))}
        </div>
      </section>

      <section className="content-band guided-session-section">
        <div className="guided-session-panel">
          <div>
            <p className="eyebrow">Guided session</p>
            <h2>Try a more structured way to explore the tutorial experience.</h2>
            <p>
              A guided session walks you through a tutorial flow so you can try touch controls,
              voice commands, materials, and step navigation in one place.
            </p>
          </div>
          <Link className="button secondary-action" to="/study">
            Start guided study session
          </Link>
        </div>
      </section>

      <section className="content-band final-cta-section">
        <div className="final-cta-panel">
          <PackageCheck aria-hidden="true" />
          <div>
            <h2>Ready to start learning?</h2>
            <p>Browse tutorials, gather your materials, and follow each step with the controls that fit the moment.</p>
          </div>
          <Link className="button primary-button" to="/tutorials">
            Browse Tutorials
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

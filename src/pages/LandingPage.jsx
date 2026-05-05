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
    title: "Step-by-step tutorials",
    text: "Clear instructions help you move through each project one step at a time.",
  },
  {
    icon: Mic,
    title: "Hands-free voice commands",
    text: "Say simple commands like next step, repeat, or show materials when your hands are busy.",
  },
  {
    icon: ClipboardList,
    title: "Materials checklist",
    text: "See what you need before you start, then reopen the list whenever you need it.",
  },
  {
    icon: Hand,
    title: "Accessible touch controls",
    text: "Use large buttons, keyboard-friendly controls, and readable step layouts at your own pace.",
  },
];

const howItWorksItems = [
  {
    title: "Choose a tutorial",
    text: "Browse practical projects and pick the one that fits what you want to make or fix.",
  },
  {
    title: "Follow each step",
    text: "Prepare your materials, read the instruction, and move forward when you are ready.",
  },
  {
    title: "Use buttons or voice commands when needed",
    text: "Tap the controls or say a quick command to continue, repeat, search, or show materials.",
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
            <div className="floating-status">Try saying: next step</div>
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
            Try Guided Session
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

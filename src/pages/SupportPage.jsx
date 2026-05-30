import { useState } from "react";
import {
  HelpCircle,
  Mic,
  MousePointer2,
  Navigation,
  ClipboardList,
  ListChecks,
  Search,
  ChevronsUpDown,
  ShieldCheck,
  ChevronDown
} from "lucide-react";

const voiceCardGroups = [
  {
    title: "Step Navigation",
    description: "Voice commands to navigate between tutorial steps or repeat instructions.",
    icon: Navigation,
    commands: [
      { label: "Go to the next step", phrases: ["next", "next step", "continue", "go forward"] },
      { label: "Go to the previous step", phrases: ["previous", "back", "go back", "previous step"] },
      { label: "Repeat current step instruction", phrases: ["repeat", "repeat instruction", "say that again", "read again"] },
      { label: "Jump to a specific step", phrases: ["go to step 4", "step 3", "open step 5", "jump to step number 2"] }
    ]
  },
  {
    title: "Materials List",
    description: "Open or close the materials list required for the tutorial.",
    icon: ClipboardList,
    commands: [
      { label: "Open materials panel", phrases: ["show materials", "open materials", "what do i need", "materials"] },
      { label: "Close materials panel", phrases: ["close materials", "hide materials"] }
    ]
  },
  {
    title: "Step Overview",
    description: "Open the overview checklist to view all steps or jump between them.",
    icon: ListChecks,
    commands: [
      { label: "Open step overview", phrases: ["show overview", "go to overview", "back to overview", "overview"] },
      { label: "Close step overview", phrases: ["close overview", "hide overview"] }
    ]
  },
  {
    title: "Tutorial Search",
    description: "Search for steps, tools, or materials in the tutorial.",
    icon: Search,
    commands: [
      { label: "Open search panel", phrases: ["search", "open search", "show search"] },
      { label: "Search for a specific query", phrases: ["search for paint", "find tape", "look for brush"] },
      { label: "Close search panel", phrases: ["close search", "hide search"] }
    ]
  },
  {
    title: "Page Scrolling",
    description: "Scroll the page up, down, or jump to top and bottom hands-free.",
    icon: ChevronsUpDown,
    commands: [
      { label: "Scroll page down", phrases: ["scroll down", "go down", "page down"] },
      { label: "Scroll page up", phrases: ["scroll up", "go up", "page up"] },
      { label: "Scroll to top / bottom", phrases: ["scroll to top", "scroll to bottom"] }
    ]
  },
  {
    title: "Voice System Control",
    description: "Manage voice recognition status or view command hints.",
    icon: Mic,
    commands: [
      { label: "Show command examples", phrases: ["help", "what can i say", "show commands", "commands"] },
      { label: "Stop voice recognition", phrases: ["stop listening", "turn off voice", "stop voice", "stop"] },
      { label: "Trigger activation test", phrases: ["start listening", "start voice", "listen"] }
    ]
  }
];

const faqs = [
  {
    q: "Why are voice commands only supported in English?",
    a: "Our voice recognition engine is currently optimized for English to ensure high-accuracy keyword recognition and consistent performance across all commands."
  },
  {
    q: "How do I enable microphone access if it was blocked?",
    a: "Click the site permissions icon (the lock symbol or sliders) on the left side of your browser's address bar, set Microphone to 'Allow', and then reload the page."
  },
  {
    q: "Why is the scroll command not moving the page?",
    a: "Ensure that voice mode is currently active (the microphone button is glowing blue). On mobile/tablet viewports, the scroll commands will scroll the browser window itself."
  },
  {
    q: "Which browser is recommended for voice navigation?",
    a: "Google Chrome (desktop or mobile) is highly recommended, as it features optimized Web Speech API support for fast and accurate speech-to-text conversion."
  },
  {
    q: "Does the application record and store my audio files?",
    a: "No. We value your privacy. The system processes your voice locally inside your browser and only evaluates text commands to trigger actions. Raw microphone audio is never recorded, saved, or uploaded."
  }
];

export function SupportPage() {
  const [activeTab, setActiveTab] = useState("commands");
  const [expandedFaq, setExpandedFaq] = useState(null);

  function toggleFaq(index) {
    setExpandedFaq(expandedFaq === index ? null : index);
  }

  return (
    <section className="page-section support-page-section">
      <div className="page-header support-page-header">
        <h1>Support Center</h1>
        <p>
          Learn how to navigate our step-by-step DIY tutorials hands-free using keyword-based English voice commands, or use standard on-screen touch controls.
        </p>
      </div>

      <div className="support-layout-wrapper">
        <aside className="support-sidebar">
          <div className="support-tabs" role="tablist">
            <button
              type="button"
              className={activeTab === "commands" ? "support-tab-btn active" : "support-tab-btn"}
              onClick={() => setActiveTab("commands")}
              role="tab"
              aria-selected={activeTab === "commands"}
            >
              <Mic size={16} aria-hidden="true" />
              Voice Commands
            </button>
            <button
              type="button"
              className={activeTab === "faq" ? "support-tab-btn active" : "support-tab-btn"}
              onClick={() => setActiveTab("faq")}
              role="tab"
              aria-selected={activeTab === "faq"}
            >
              <HelpCircle size={16} aria-hidden="true" />
              FAQs & Privacy
            </button>
          </div>
        </aside>

        <div className="support-content-area">
          {activeTab === "commands" ? (
            <div className="commands-tab-content">


              <div className="support-rows-list">
                {voiceCardGroups.map((group) => {
                  const IconComponent = group.icon;
                  return (
                    <div key={group.title} className="support-row">
                      <div className="support-row-info">
                        <div className="support-row-info-header">
                          <IconComponent size={18} aria-hidden="true" />
                          <h3>{group.title}</h3>
                        </div>
                        <p>{group.description}</p>
                      </div>
                      <div className="support-row-commands">
                        {group.commands.map((cmd) => (
                          <div key={cmd.label} className="support-row-command-item">
                            <span className="support-row-command-label">{cmd.label}</span>
                            <div className="support-row-command-badges">
                              {cmd.phrases.map((phrase) => (
                                <code key={phrase} className="support-badge">
                                  "{phrase}"
                                </code>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="faq-tab-content">
              <div className="faq-panels-layout">
                <div className="faq-main-column">


                  <div className="faq-accordion">
                    {faqs.map((faq, index) => {
                      const isExpanded = expandedFaq === index;
                      return (
                        <div key={index} className={isExpanded ? "faq-item expanded" : "faq-item"}>
                          <button
                            type="button"
                            className="faq-question-btn"
                            onClick={() => toggleFaq(index)}
                            aria-expanded={isExpanded}
                          >
                            <span>{faq.q}</span>
                            <ChevronDown size={16} className="faq-arrow" aria-hidden="true" />
                          </button>
                          <div className="faq-answer-container" style={{ maxHeight: isExpanded ? "250px" : "0px" }}>
                            <p className="faq-answer">{faq.a}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="faq-sidebar-column">
                  <article className="info-box-card touch-info-box">
                    <div className="info-box-header">
                      <MousePointer2 size={16} aria-hidden="true" />
                      <h3>Touch Mode Controls</h3>
                    </div>
                    <p>
                      If you disable voice mode or experience microphone issues, you can navigate tutorials entirely using the on-screen buttons (Next, Back, Repeat, Materials, Search, Overview).
                    </p>
                  </article>

                  <article className="info-box-card privacy-info-box">
                    <div className="info-box-header">
                      <ShieldCheck size={16} aria-hidden="true" />
                      <h3>Browser & Privacy Notes</h3>
                    </div>
                    <p>
                      Voice navigation uses your browser's built-in Web Speech API. For safety and performance, the app only logs basic command logs and execution metrics, **never storing raw audio files**.
                    </p>
                  </article>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

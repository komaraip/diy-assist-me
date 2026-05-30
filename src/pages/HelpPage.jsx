import { HelpCircle, Mic, MousePointer2 } from "lucide-react";

const commandGroups = [
  "Next: next, next step, continue, go forward",
  "Previous: previous, back, go back, previous step",
  "Repeat: repeat, repeat instruction, say that again, read again",
  "Materials: show materials, open materials, what do I need, close materials",
  "Overview: go to overview, back to overview, show tutorial overview",
  "Search: search for [query], find [query], look for [query]",
  "Go to step: go to step [number], step [number], open step [number], jump to step [number]",
  "Scroll: scroll down, scroll up, page down, page up, go down, go up, scroll to top, scroll to bottom",
  "Stop: stop listening, turn off voice, stop voice",
];

export function HelpPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <p className="eyebrow">Help</p>
        <h1>Study controls and voice command help</h1>
        <p>
          This prototype compares conventional touch navigation with a fixed set of English voice
          commands in structured DIY tutorial tasks. If voice is not available, touch, mouse, and
          keyboard controls remain available.
        </p>
      </div>
      <div className="placeholder-panels">
        <article className="placeholder-panel">
          <MousePointer2 aria-hidden="true" />
          <h2>Touch mode controls</h2>
          <p>Use buttons to go forward, go back, repeat instructions, show materials, open the overview, search, and finish the task.</p>
        </article>
        <article className="placeholder-panel">
          <HelpCircle aria-hidden="true" />
          <h2>Browser and privacy notes</h2>
          <p>Voice mode requires Web Speech API support and should be tested on a documented device and browser in a quiet or low-noise room. The app stores transcripts, command outcomes, timestamps, and metadata, but not raw microphone audio.</p>
        </article>
        <article className="placeholder-panel">
          <Mic aria-hidden="true" />
          <h2>Supported voice commands</h2>
          <p>Use these constrained commands. Open-ended conversation, multilingual commands, and noisy environments are outside the study scope.</p>
          <ul className="plain-list">
            {commandGroups.map((group) => (
              <li key={group}>{group}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

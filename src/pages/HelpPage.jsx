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
        <h1>Voice and touch help</h1>
        <p>
          Use voice commands or the on-screen buttons to move through a tutorial. If voice is not
          available, you can still use touch, mouse, or keyboard controls.
        </p>
      </div>
      <div className="placeholder-panels">
        <article className="placeholder-panel">
          <MousePointer2 aria-hidden="true" />
          <h2>Button controls</h2>
          <p>Use the buttons to go forward, go back, repeat instructions, show materials, and open the overview.</p>
        </article>
        <article className="placeholder-panel">
          <HelpCircle aria-hidden="true" />
          <h2>Browser note</h2>
          <p>Voice commands work best in Google Chrome on desktop. Buttons work in any supported browser.</p>
        </article>
        <article className="placeholder-panel">
          <Mic aria-hidden="true" />
          <h2>Voice commands</h2>
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

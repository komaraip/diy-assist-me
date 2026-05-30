import { Trash2 } from "lucide-react";
import { useState } from "react";
import { purgeAllStudyData } from "../../services/adminDataService.js";

export function PurgeButton({ onPurged }) {
  const [step, setStep] = useState("idle"); // idle | confirm | purging | done | error
  const [confirmText, setConfirmText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deletedCount, setDeletedCount] = useState(null);

  async function handlePurge() {
    if (confirmText !== "PURGE") return;
    setStep("purging");
    const result = await purgeAllStudyData();
    if (result.error) {
      setErrorMsg(result.error);
      setStep("error");
      return;
    }
    setDeletedCount(result.data?.deleted ?? "?");
    setStep("done");
    setConfirmText("");
    onPurged?.();
  }

  if (step === "idle") {
    return (
      <button type="button" className="button danger-button" onClick={() => setStep("confirm")}>
        <Trash2 size={14} aria-hidden="true" />
        Purge all data
      </button>
    );
  }

  if (step === "confirm") {
    return (
      <div className="admin-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="purge-confirm-title">
        <div className="admin-confirm-dialog">
          <h3 id="purge-confirm-title">Warning: Purge ALL Firestore data?</h3>
          <p>
            This will permanently delete <strong>every document</strong> in all study collections:
            participants, sessions, taskTrials, interactionLogs, susResponses, debriefResponses, and observerNotes.
            This cannot be undone.
          </p>
          <p>Type <strong>PURGE</strong> to confirm:</p>
          <input
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="Type PURGE"
            autoFocus
            className="admin-confirm-input"
          />
          <div className="admin-confirm-actions">
            <button type="button" className="button secondary-action" onClick={() => { setStep("idle"); setConfirmText(""); }}>
              Cancel
            </button>
            <button
              type="button"
              className="button danger-button"
              onClick={handlePurge}
              disabled={confirmText !== "PURGE"}
            >
              Yes, purge everything
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "purging") {
    return <button type="button" className="button danger-button" disabled>Purging...</button>;
  }

  if (step === "done") {
    return (
      <button type="button" className="button secondary-action" onClick={() => setStep("idle")}>
        Purged {deletedCount} docs - dismiss
      </button>
    );
  }

  if (step === "error") {
    return (
      <button type="button" className="button danger-button" onClick={() => setStep("idle")} title={errorMsg}>
        Purge failed - dismiss
      </button>
    );
  }

  return null;
}

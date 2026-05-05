import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { downloadTextFile, EXPORT_FILENAMES, generateExportFiles } from "../../services/exportService.js";

const exportCards = [
  {
    fileName: EXPORT_FILENAMES.taskTrials,
    title: "Task trials CSV",
    description: "Task timing, completion status, mode, validity notes, and task identifiers.",
    icon: FileSpreadsheet,
  },
  {
    fileName: EXPORT_FILENAMES.susResponses,
    title: "SUS responses CSV",
    description: "Questionnaire item responses, contribution totals, calculated SUS scores, and timestamps.",
    icon: FileSpreadsheet,
  },
  {
    fileName: EXPORT_FILENAMES.voiceLogs,
    title: "Voice logs CSV",
    description: "Transcripts, matched intents, command success, recovery, fallback, and recognition errors.",
    icon: FileSpreadsheet,
  },
  {
    fileName: EXPORT_FILENAMES.fullSessions,
    title: "Full sessions JSON",
    description: "Complete session bundles with participants, tasks, responses, notes, logs, and metadata.",
    icon: FileJson,
  },
  {
    fileName: EXPORT_FILENAMES.chapter4Metrics,
    title: "Chapter 4 summary metrics JSON",
    description: "Summary metrics for RQ1, RQ2, RQ3, and RQ4 with export metadata.",
    icon: FileJson,
  },
];

export function ExportControls() {
  const [exportResult, setExportResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  async function handleGenerate() {
    setIsGenerating(true);
    setStatusMessage("");
    const result = await generateExportFiles();
    setExportResult(result);
    setStatusMessage(result.error || `Generated ${result.data.files.length} export files from ${result.source} data.`);
    setIsGenerating(false);
  }

  function handleDownload(file) {
    if (!file) return;
    downloadTextFile(file);
  }

  function handleDownloadAll() {
    (exportResult?.data?.files || []).forEach((file) => downloadTextFile(file));
  }

  function findGeneratedFile(fileName) {
    return (exportResult?.data?.files || []).find((file) => file.fileName === fileName) || null;
  }

  return (
    <section className="admin-panel" aria-labelledby="export-controls-heading">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Exports</p>
          <h2 id="export-controls-heading">Generate and download files</h2>
          <p>Generate exports once, then download individual files or the complete set.</p>
        </div>
        <Download aria-hidden="true" />
      </div>

      <div className="export-actions-row">
        <button type="button" className="button primary-button" onClick={handleGenerate} disabled={isGenerating}>
          <Download aria-hidden="true" />
          {isGenerating ? "Generating..." : "Generate exports"}
        </button>
        <button
          type="button"
          className="button complete-button"
          onClick={handleDownloadAll}
          disabled={!exportResult?.data?.files?.length}
        >
          Download all files
        </button>
      </div>

      {statusMessage ? (
        <p className={exportResult?.error ? "status-note error-note" : "status-note"} role="status">
          {statusMessage}
        </p>
      ) : (
        <p className="empty-state">Generate exports to enable downloads.</p>
      )}

      {exportResult?.warning ? <p className="status-note">{exportResult.warning}</p> : null}

      {exportResult?.data ? (
        <dl className="detail-list export-metadata">
          <dt>Exported at</dt>
          <dd>{exportResult.data.metadata.exportedAt}</dd>
          <dt>Export source</dt>
          <dd>{exportResult.data.metadata.exportSource}</dd>
          <dt>App version</dt>
          <dd>{exportResult.data.metadata.appVersion || "Not available"}</dd>
        </dl>
      ) : null}

      <div className="export-card-grid">
        {exportCards.map((card) => {
          const Icon = card.icon;
          const generatedFile = findGeneratedFile(card.fileName);
          return (
            <article className="export-card" key={card.fileName}>
              <span className="export-card-icon">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h3>{card.title}</h3>
                <code>{card.fileName}</code>
                <p>{card.description}</p>
              </div>
              <button
                type="button"
                className="button secondary-action"
                onClick={() => handleDownload(generatedFile)}
                disabled={!generatedFile}
              >
                <Download aria-hidden="true" />
                Download
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

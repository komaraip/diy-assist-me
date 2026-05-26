export function toPrettyJson(value) {
  return JSON.stringify(value, null, 2);
}

export function buildExportMetadata({ exportSource, appVersion }) {
  return {
    exportedAt: new Date().toISOString(),
    source: "diy-assist-me",
    exportSource,
    appVersion: appVersion || null,
  };
}

import { serviceFailure, serviceSuccess } from "../utils/serviceResult.js";

const STORAGE_PREFIX = "diyAssist";
const memoryStore = new Map();

function hasLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function collectionKey(collectionName) {
  return `${STORAGE_PREFIX}.${collectionName}`;
}

function readCollection(collectionName) {
  const key = collectionKey(collectionName);

  if (!hasLocalStorage()) {
    return memoryStore.get(key) || [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCollection(collectionName, records) {
  const key = collectionKey(collectionName);

  if (!hasLocalStorage()) {
    memoryStore.set(key, records);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(records));
}

export function listLocalRecords(collectionName) {
  try {
    return serviceSuccess(readCollection(collectionName), "local");
  } catch (error) {
    return serviceFailure(error, "local", []);
  }
}

export function getLocalRecord(collectionName, id) {
  try {
    return serviceSuccess(readCollection(collectionName).find((record) => record.id === id) || null, "local");
  } catch (error) {
    return serviceFailure(error, "local");
  }
}

export function createLocalRecord(collectionName, data) {
  try {
    const records = readCollection(collectionName);
    const record = {
      ...data,
      id: data.id || generateLocalId(collectionName),
    };
    writeCollection(collectionName, [...records, record]);
    return serviceSuccess(record, "local");
  } catch (error) {
    return serviceFailure(error, "local");
  }
}

export function updateLocalRecord(collectionName, id, patch) {
  try {
    const records = readCollection(collectionName);
    let updatedRecord = null;
    const updatedRecords = records.map((record) => {
      if (record.id !== id) return record;
      updatedRecord = {
        ...record,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return updatedRecord;
    });

    if (!updatedRecord) return serviceFailure("Local record not found.", "local");
    writeCollection(collectionName, updatedRecords);
    return serviceSuccess(updatedRecord, "local");
  } catch (error) {
    return serviceFailure(error, "local");
  }
}

export function deleteLocalRecord(collectionName, id) {
  try {
    const records = readCollection(collectionName);
    const remaining = records.filter((record) => record.id !== id);
    if (remaining.length === records.length) return serviceFailure("Local record not found.", "local");
    writeCollection(collectionName, remaining);
    return serviceSuccess({ id }, "local");
  } catch (error) {
    return serviceFailure(error, "local");
  }
}

export function deleteLocalRecordsByField(collectionName, field, value) {
  try {
    const records = readCollection(collectionName);
    const remaining = records.filter((record) => record[field] !== value);
    writeCollection(collectionName, remaining);
    return serviceSuccess({ deleted: records.length - remaining.length }, "local");
  } catch (error) {
    return serviceFailure(error, "local");
  }
}

function generateLocalId(prefix = "record") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

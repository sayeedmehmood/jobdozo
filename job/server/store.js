/**
 * JobDozo data store — single centralized database.
 *
 * Default driver is an embedded JSON document store (zero-setup, file persisted
 * at server/data/db.json) exposing a Mongo-like collection API. The API surface
 * (find / findOne / byId / insert / update / remove) is intentionally shaped so
 * the storage engine can be swapped for MongoDB/Mongoose (see docker-compose's
 * mongo service and MONGODB_URI in .env.example) without touching route code.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const COLLECTIONS = ["users", "jobs", "applications", "notifications", "activity", "conversations", "messages", "skillSessions", "alertMatches", "billing"];
let data = Object.fromEntries(COLLECTIONS.map((c) => [c, []]));

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      for (const c of COLLECTIONS) data[c] = Array.isArray(parsed[c]) ? parsed[c] : [];
    }
  } catch (e) {
    console.error("[store] failed to load db.json, starting fresh:", e.message);
  }
}
load();

let writeTimer = null;
function persist() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(data));
    } catch (e) {
      console.error("[store] persist failed:", e.message);
    }
  }, 60);
}

const uid = () => crypto.randomUUID();

function matches(doc, query) {
  if (typeof query === "function") return query(doc);
  return Object.entries(query || {}).every(([k, v]) => doc[k] === v);
}

function col(name) {
  if (!COLLECTIONS.includes(name)) throw new Error("Unknown collection: " + name);
  return {
    all: () => data[name],
    count: (q) => (q ? data[name].filter((d) => matches(d, q)).length : data[name].length),
    find: (q) => data[name].filter((d) => matches(d, q)),
    findOne: (q) => data[name].find((d) => matches(d, q)) || null,
    byId: (id) => data[name].find((d) => d.id === id) || null,
    insert: (doc) => {
      doc.id = doc.id || uid();
      doc.createdAt = doc.createdAt || new Date().toISOString();
      data[name].unshift(doc);
      persist();
      return doc;
    },
    update: (id, patch) => {
      const doc = data[name].find((d) => d.id === id);
      if (!doc) return null;
      Object.assign(doc, patch, { updatedAt: new Date().toISOString() });
      persist();
      return doc;
    },
    remove: (id) => {
      const i = data[name].findIndex((d) => d.id === id);
      if (i < 0) return null;
      const [doc] = data[name].splice(i, 1);
      persist();
      return doc;
    },
  };
}

function reset() {
  data = Object.fromEntries(COLLECTIONS.map((c) => [c, []]));
  persist();
}

module.exports = { col, persist, reset, uid, isEmpty: () => data.users.length === 0 };

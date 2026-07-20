import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, "..", "emp.sqlite"));

db.exec("PRAGMA journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL,
  pseudo TEXT NOT NULL,
  grade TEXT NOT NULL,
  discord_id TEXT,
  roblox_id TEXT
);

CREATE TABLE IF NOT EXISTS sanctions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL,
  titre TEXT NOT NULL,
  cible TEXT,
  type TEXT NOT NULL,
  statut TEXT NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS planning (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS absences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL,
  membre TEXT NOT NULL,
  debut TEXT NOT NULL,
  fin TEXT NOT NULL,
  raison TEXT
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL,
  date TEXT NOT NULL,
  user TEXT NOT NULL,
  action TEXT NOT NULL,
  cible TEXT
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  branch TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  date TEXT NOT NULL
);
`);

function logActivity(branch, user, action, cible) {
  db.prepare(
    `INSERT INTO activity (branch, date, user, action, cible) VALUES (?, ?, ?, ?, ?)`
  ).run(branch, new Date().toISOString(), user, action, cible ?? "");
}

export const Members = {
  add: (branch, pseudo, grade, discordId, robloxId) => {
    const info = db
      .prepare(`INSERT INTO members (branch, pseudo, grade, discord_id, roblox_id) VALUES (?, ?, ?, ?, ?)`)
      .run(branch, pseudo, grade, discordId ?? "", robloxId ?? "");
    return info.lastInsertRowid;
  },
  list: (branch) => db.prepare(`SELECT * FROM members WHERE branch = ? ORDER BY pseudo`).all(branch),
  listAll: () => db.prepare(`SELECT * FROM members ORDER BY branch, pseudo`).all(),
  remove: (branch, pseudo) => db.prepare(`DELETE FROM members WHERE branch = ? AND pseudo = ?`).run(branch, pseudo),
  updateGrade: (branch, pseudo, grade) =>
    db.prepare(`UPDATE members SET grade = ? WHERE branch = ? AND pseudo = ?`).run(grade, branch, pseudo),
  setDiscordId: (branch, pseudo, discordId) =>
    db.prepare(`UPDATE members SET discord_id = ? WHERE branch = ? AND pseudo = ?`).run(discordId, branch, pseudo),
  setRobloxId: (branch, pseudo, robloxId) =>
    db.prepare(`UPDATE members SET roblox_id = ? WHERE branch = ? AND pseudo = ?`).run(robloxId, branch, pseudo),
};

export const Sanctions = {
  add: (branch, titre, cible, type, statut) => {
    const info = db.prepare(
      `INSERT INTO sanctions (branch, titre, cible, type, statut, date) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(branch, titre, cible ?? "", type, statut, new Date().toISOString());
    return info.lastInsertRowid;
  },
  list: (branch) => db.prepare(`SELECT * FROM sanctions WHERE branch = ? ORDER BY date DESC`).all(branch),
  remove: (branch, id) => db.prepare(`DELETE FROM sanctions WHERE branch = ? AND id = ?`).run(branch, id),
};

export const Planning = {
  add: (branch, date, title, category) => {
    const info = db.prepare(`INSERT INTO planning (branch, date, title, category) VALUES (?, ?, ?, ?)`).run(branch, date, title, category);
    return info.lastInsertRowid;
  },
  list: (branch) => db.prepare(`SELECT * FROM planning WHERE branch = ? ORDER BY date`).all(branch),
  remove: (branch, id) => db.prepare(`DELETE FROM planning WHERE branch = ? AND id = ?`).run(branch, id),
};

export const Absences = {
  add: (branch, membre, debut, fin, raison) => {
    const info = db.prepare(`INSERT INTO absences (branch, membre, debut, fin, raison) VALUES (?, ?, ?, ?, ?)`).run(
      branch, membre, debut, fin, raison ?? ""
    );
    return info.lastInsertRowid;
  },
  list: (branch) => db.prepare(`SELECT * FROM absences WHERE branch = ? ORDER BY debut DESC`).all(branch),
  remove: (branch, id) => db.prepare(`DELETE FROM absences WHERE branch = ? AND id = ?`).run(branch, id),
};

export const Documents = {
  add: (branch, title, content) => {
    const info = db.prepare(`INSERT INTO documents (branch, title, content, date) VALUES (?, ?, ?, ?)`).run(
      branch, title, content ?? "", new Date().toISOString()
    );
    return info.lastInsertRowid;
  },
  list: (branch) => db.prepare(`SELECT * FROM documents WHERE branch = ? ORDER BY date DESC`).all(branch),
  remove: (branch, id) => db.prepare(`DELETE FROM documents WHERE branch = ? AND id = ?`).run(branch, id),
};

export const Activity = {
  log: logActivity,
  list: (branch) => db.prepare(`SELECT * FROM activity WHERE branch = ? ORDER BY date DESC LIMIT 100`).all(branch),
};

export default db;

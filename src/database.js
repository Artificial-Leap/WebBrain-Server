import { config } from "./configLoader.js";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import * as fs from "fs";

export default class database {
  static instance;
  db = null;

  constructor() {
    database.instance = this;

    this.initDB();
  }

  initDB = async () => {
    let firstInit = !fs.existsSync("./" + config.db_name);

    this.db = await open({
      filename: config.db_name,
      driver: sqlite3.Database,
    });

    if (firstInit) {
      await this.db.run(
        "CREATE TABLE IF NOT EXISTS chat_history(channel TEXT, sender TEXT, receiver TEXT, text TEXT, timestamp INTEGER)"
      );
    }
  };

  addMessage = async (channel, sender, text, timestamp) => {
    await this.db.run("INSERT INTO chat_history VALUES(?, ?, ?, ?, ?)", [
      channel,
      sender,
      receiver,
      text,
      timestamp,
    ]);
  };

  getMessages = async (channel, sender, agent, max_message_count) => {
    const query =
      "SELECT * FROM chat_history WHERE channel = ? AND sender = ? ORDER BY timestamp DESC LIMIT ?";
    const result = await this.db
      .all(query, [channel, sender, max_message_count])
      .then((rows) => rows.map((row) => row.text));

    return result;
  };

  deleteMessage = async (channel, sender, text, timestamp) => {
    await this.db.run(
      "DELETE FROM chat_history WHERE channel = ? AND sender = ? AND text = ? AND timestamp = ?",
      [channel, sender, text, timestamp]
    );
  };

  getMessagesCount = async (sender, agent) => {
    const query =
      "SELECT COUNT(*) FROM chat_history WHERE sender = ? OR sender = ?";
    const result = await this.db
      .get(query, [sender, agent])
      .then((row) => row["COUNT(*)"]);
    return result;
  };
}

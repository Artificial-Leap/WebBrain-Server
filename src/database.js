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
      await this.db.run(
        "CREATE TABLE IF NOT EXISTS users(username TEXT, password TEXT, brains TEXT)"
      );
      await this.db.run(
        "CREATE TABLE IF NOT EXISTS brains(id TEXT, test1 TEXT, test2 TEXT)"
      );
    }
  };

  login = async (username, password) => {
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    const result = await this.db.get(query, [username, password]);

    if (!result || result.length === 0) {
      return "Invalid credentials";
    }

    return result;
  };

  register = async (username, password) => {
    if (await this.usernameExists(username)) {
      return "Username already exists";
    }

    await this.db.run("INSERT INTO users VALUES(?, ?, ?)", [
      username,
      password,
      "",
    ]);

    return "ok";
  };

  generateBrainId = async () => {
    const query = "SELECT * FROM brains";
    const result = await this.db.all(query);

    return result.length;
  };

  addBrain = async (username) => {
    const brain = await this.generateBrainId();
    const query = "SELECT * FROM users WHERE username = ?";
    const result = await this.db.get(query, [username]);
    const brains = result.brains.split(",");
    brains.push(brain);
    await this.db.run("UPDATE users SET brains = ? WHERE username = ?", [
      brains.join(","),
      username,
    ]);
    await this.db.run("INSERT INTO brains VALUES(?, ?, ?)", [
      brain,
      "test1",
      "test2",
    ]);
  };

  getBrains = async (username) => {
    const query = "SELECT * FROM users WHERE username = ?";
    const result = await this.db.get(query, [username]);
    console.log("result");
    console.log(result);
    if (result) {
      let brains = result.brains.split(",");
      console.log(brains);
      brains = brains.filter((brain) => brain !== "");
      return brains;
    }
    return [];
  };

  getBrain = async (id) => {
    const query = "SELECT * FROM brains WHERE id = ?";
    const result = await this.db.get(query, [id]);
    return result;
  };

  deleteBrain = async (username, brain) => {
    const query = "SELECT * FROM users WHERE username = ?";
    const result = await this.db.get(query, [username]);
    const brains = result.brains.split(",");
    const index = brains.indexOf(brain);
    if (index > -1) {
      brains.splice(index, 1);
    }
    await this.db.run("UPDATE users SET brains = ? WHERE username = ?", [
      brains.join(","),
      username,
    ]);
    await this.db.run("DELETE FROM brains WHERE id = ?", [brain]);
  };

  usernameExists = async (username) => {
    const query = "SELECT * FROM users WHERE username = ?";
    const result = await this.db.get(query, [username]);
    return result && result.length > 0;
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

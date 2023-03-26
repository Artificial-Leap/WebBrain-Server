import express, { json, urlencoded } from "express";
import cors from "cors";
import database from "./database.js";

export default class server {
  static instance;

  constructor(port) {
    server.instance = this;

    this.initServer(port);
  }

  initServer = async (_port) => {
    const app = express();
    const port = _port || 65535;

    app.use(cors());
    app.use(json());
    app.use(urlencoded({ extended: true }));

    app.post("/login", async (req, res) => {
      console.log("login");
      const username = req.body.username;
      const password = req.body.password;

      const result = await database.instance.login(username, password);

      if (!(typeof result === "string")) {
        console.log(result);

        let brains = result.brains.split(",");
        brains = brains.filter((brain) => brain !== "");
        const resp = {
          username: result.username,
          brains: brains,
        };
        res.send(resp);
      } else {
        res.send({ error: result });
      }
    });
    app.post("/register", async (req, res) => {
      const username = req.body.username;
      const password = req.body.password;

      const result = await database.instance.register(username, password);

      if (result === "ok") {
        console.log(result);
        res.send("ok");
      } else {
        res.send({ error: result });
      }
    });
    app.get("/brain", async (req, res) => {
      const brainId = req.query.id;
      console.log("get: " + brainId);

      const result = await database.instance.getBrain(brainId);

      res.send(result);
    });
    app.post("/brain", async (req, res) => {
      const username = req.body.username;

      const result = await database.instance.addBrain(username);

      res.send(await database.instance.getBrains(username));
    });
    app.delete("/brain", async (req, res) => {
      const username = req.query.username;
      const brain = req.query.id;
      console.log("delete: " + brain + " from " + username);

      const result = await database.instance.deleteBrain(username, brain);

      const brains = await database.instance.getBrains(username);
      console.log(brains);
      res.send(brains);
    });

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  };
}

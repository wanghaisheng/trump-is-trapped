import { Soul } from "@opensouls/engine";
import * as PlayHT from "playht";
import { speak } from "./voice.js";

import { config } from "dotenv";
config();

PlayHT.init({
  apiKey: process.env["PLAY_HT_SECRET"]!,
  userId: process.env["PLAY_HT_USER_ID"]!,
});

async function connect() {
  const soul = new Soul({
    soulId: String("dev-001"),
    organization: process.env["SOUL_ENGINE_ORGANIZATION"]!,
    blueprint: "milton",
    token: process.env["SOUL_ENGINE_TOKEN"]!,
    debug: true,
  });

  soul.on("says", async (event) => {
    console.log("Says event received");
    await speak(event);
  });

  await soul.connect();
}

connect();

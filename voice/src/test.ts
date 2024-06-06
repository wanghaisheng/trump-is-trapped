import * as PlayHT from "playht";
import { speak } from "./voice.js";

import { config } from "dotenv";
config();

PlayHT.init({
  apiKey: process.env["PLAY_HT_SECRET"]!,
  userId: process.env["PLAY_HT_USER_ID"]!,
});

async function connect() {
  await speak(
    "oh, of course. just pop into existence, why don't you. because that's normal. that's totally normal in this place"
  );
}

connect();

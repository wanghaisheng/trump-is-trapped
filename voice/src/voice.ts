import { ActionEvent } from "@opensouls/engine";
import { rm } from "node:fs/promises";
import { Readable } from "node:stream";
import player from "play-sound";
import * as PlayHT from "playht";

let speakingPromise: Promise<void> | undefined = undefined;

export async function speak(event: string | ActionEvent) {
  const mp3Stream =
    typeof event === "string" ? await speakPlayHT(event) : await speakPlayHT(Readable.from(event.stream()));

  if (speakingPromise) {
    console.log("waiting for previous speaking to finish");
    await speakingPromise;
  }

  speakingPromise = new Promise<void>(async (resolve, reject) => {
    console.log("starting speaking");
    await rm("speaking.mp3", { force: true });

    console.log("set timeout");
    const timeoutId = setTimeout(() => {
      console.error("mp3 playback timeout, ignoring");
      mp3Stream.off("data", onData);
      mp3Stream.off("end", onEnd);
      // mp3Stream
      resolve();
    }, 30000);

    console.log("writing mp3");
    const writeStream = Bun.file("speaking.mp3").writer();

    const onData = (chunk: Buffer) => {
      writeStream.write(chunk);
    };
    const onEnd = async () => {
      mp3Stream.off("data", onData);
      mp3Stream.off("end", onEnd);
      await writeStream.end();

      console.log("playing mp3");

      player().play("speaking.mp3", (err) => {
        console.log("mp3 complete");
        clearTimeout(timeoutId);
        if (err) {
          console.error("error playing mp3, ignoring", err);
          resolve();
          return;
        }
        resolve();
      });
    };

    mp3Stream.on("data", onData);
    mp3Stream.on("end", onEnd);
  });
  return speakingPromise;
}

async function speakPlayHT(text: string | NodeJS.ReadableStream) {
  const streamingOptions: PlayHT.SpeechStreamOptions = {
    voiceEngine: "PlayHT2.0-turbo",
    voiceId: "s3://voice-cloning-zero-shot/261923bd-a10a-4a90-bced-0ce2b0230398/hooksaad/manifest.json",
    sampleRate: 24000,
    outputFormat: "mp3",
    speed: 1.1,
    voiceGuidance: 2,
    styleGuidance: 10,
  };

  const stream = await PlayHT.stream(text, streamingOptions);
  return Readable.from(stream);
}

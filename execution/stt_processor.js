const { SpeechClient } = require("@google-cloud/speech");

/**
 * STT Processor - Converts audio buffer to text.
 * Layer 3: Execution
 */
async function processSTT(audioBuffer, credentialsJson) {
  if (!audioBuffer) throw new Error("Missing audio buffer");

  const client = new SpeechClient({
    credentials: JSON.parse(credentialsJson || "{}"),
  });

  const request = {
    audio: { content: audioBuffer.toString("base64") },
    config: {
      encoding: "WEBM_OPUS",
      sampleRateHertz: 48000,
      languageCode: "en-US",
    },
  };

  const [response] = await client.recognize(request);
  const transcript = response.results
    ?.map((result) => result.alternatives?.[0].transcript)
    .join("\n");

  return transcript;
}

module.exports = { processSTT };

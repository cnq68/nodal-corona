const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Summarize Processor - Summarizes text using Gemini.
 * Layer 3: Execution
 */
async function processSummarize(transcript, apiKey) {
  if (!transcript) throw new Error("Missing transcript");

  const genAI = new GoogleGenerativeAI(apiKey || "");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Summarize the following audio transcript into concise bullet points using a minimalist and professional tone:\n\n${transcript}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summary = response.text();

  return summary;
}

module.exports = { processSummarize };

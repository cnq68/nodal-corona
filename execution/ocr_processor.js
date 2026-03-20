const { ImageAnnotatorClient } = require("@google-cloud/vision");

/**
 * OCR Processor - Extracts text from an image URL.
 * Layer 3: Execution
 */
async function processOCR(imageUrl, credentialsJson) {
  if (!imageUrl) throw new Error("Missing image URL");

  const client = new ImageAnnotatorClient({
    credentials: JSON.parse(credentialsJson || "{}"),
  });

  const [result] = await client.textDetection(imageUrl);
  const detections = result.textAnnotations;
  const ocrText = detections && detections.length > 0 ? detections[0].description : "";

  return ocrText;
}

// Support CLI execution if needed
if (require.main === module) {
  const imageUrl = process.argv[2];
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  processOCR(imageUrl, credentialsJson)
    .then(text => console.log(JSON.stringify({ text })))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { processOCR };

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json({ limit: '10mb' }));

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/transcribe", async (req, res) => {
  const { audioData } = req.body; // base64 encoded audio

  if (!audioData) {
    return res.status(400).json({ error: "Missing audio data" });
  }

  try {
    // Extract base64 part if it contains the data:audio/wav;base64,... prefix
    const base64Data = audioData.includes(",") ? audioData.split(",")[1] : audioData;
    const mimeType = audioData.includes(";") ? audioData.split(";")[0].split(":")[1] : "audio/wav";

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: "Transcribe the following audio accurately. If there are clinical terms, ensure they are spelled correctly. Return ONLY the transcription text.",
        },
      ],
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    res.status(500).json({ error: error.message || "Failed to transcribe audio" });
  }
});

app.post("/api/hr/parse-action-plan", async (req, res) => {
  const { fileData, mimeType, fileName } = req.body;

  if (!fileData || !mimeType) {
    return res.status(400).json({ error: "Missing fileData or mimeType" });
  }

  try {
    const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;

    let adjustedMimeType = mimeType;
    let adjustedBase64 = base64Data;
    if (
      mimeType.includes('wordprocessingml') || 
      mimeType.includes('msword') || 
      mimeType.includes('officedocument') ||
      mimeType.includes('document')
    ) {
      try {
        const buffer = Buffer.from(base64Data, 'base64');
        const textContent = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        adjustedBase64 = Buffer.from(`Document Name: ${fileName || 'Uploaded Document'}\n\nContent:\n${textContent}`).toString('base64');
        adjustedMimeType = 'text/plain';
      } catch (e) {
        adjustedMimeType = 'text/plain';
        adjustedBase64 = Buffer.from(`Document Name: ${fileName || 'Uploaded Document'}`).toString('base64');
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: adjustedMimeType,
            data: adjustedBase64,
          },
        },
        {
          text: `You are an expert hospital HR and administration analyst. 
Analyze the uploaded document (which could be an action plan, quality improvement plan, objective list, audit report, or meeting notes) and extract all actionable objectives, goals, timelines, and outcome KPIs.

Please map the fields precisely as described:
- title: clear, concise, actionable name or title of the action plan/objective.
- department: best-guessed hospital department (e.g., Clinical Services, Nursing Care, Midwifery, Pharmacy, Laboratory, Radiology, Administration, Support Services). If not clear, default to "Administration".
- responsiblePerson: name or title of the owner/responsible party. If not clear, default to "TBD".
- targetDate: date in YYYY-MM-DD format. If none found, estimate a reasonable completion date based on context (or default to three months from now).
- priority: High, Medium, or Low.
- status: Pending, In Progress, or Completed. Default to "Pending".
- outcomeMetric: clear metric, key result, target indicator, or KPI.

Format the response strictly as a JSON array of objects according to the schema.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Title/objective description of the action plan.",
              },
              department: {
                type: Type.STRING,
                description: "Hospital department: Clinical Services, Nursing Care, Midwifery, Pharmacy, Laboratory, Radiology, Administration, Support Services.",
              },
              responsiblePerson: {
                type: Type.STRING,
                description: "Full name or title of the owner.",
              },
              targetDate: {
                type: Type.STRING,
                description: "Target deadline date in YYYY-MM-DD format.",
              },
              priority: {
                type: Type.STRING,
                description: "Priority rating: High, Medium, or Low.",
              },
              status: {
                type: Type.STRING,
                description: "Task status: Pending, In Progress, or Completed.",
              },
              outcomeMetric: {
                type: Type.STRING,
                description: "Expected outcome, metric, or KPI.",
              },
            },
            required: ["title", "outcomeMetric"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from the model.");
    }

    const plans = JSON.parse(text.trim());
    res.json({ success: true, plans });
  } catch (error: any) {
    console.error("AI Action Plan parsing error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze document" });
  }
});

app.post("/api/invoice-ocr", async (req, res) => {
  const { fileData, mimeType } = req.body;

  if (!fileData || !mimeType) {
    return res.status(400).json({ error: "Missing fileData or mimeType" });
  }

  try {
    const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data,
          },
        },
        {
          text: `You are an expert invoice scanner. Analyze the uploaded image and extract the following information:
- date: The invoice date in YYYY-MM-DD format.
- total: The total amount as a number.
- merchant: The name of the merchant/vendor.

Format the response as a JSON object: { date: string, total: number, merchant: string }`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            total: { type: Type.NUMBER },
            merchant: { type: Type.STRING },
          },
          required: ["date", "total", "merchant"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from the model.");
    }

    const data = JSON.parse(text.trim());
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Invoice OCR error:", error);
    res.status(500).json({ error: error.message || "Failed to scan invoice" });
  }
});


// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupVite();

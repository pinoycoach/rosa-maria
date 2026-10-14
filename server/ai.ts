// Google's AI, only for card pictures: making a picture from a short description, and checking every picture
// (made or uploaded) before it is offered. It never writes or changes prayers. Runs on Vertex AI (the Google
// Cloud project pays) or with a Gemini API key. Only this server calls it, so no key reaches the browser.
import { GoogleGenAI } from "@google/genai";
import { pictureInstruction, PICTURE_CHECK_QUESTION, type PictureVerdict } from "../shared/pictures";

const USE_VERTEX = /^(true|1)$/i.test(process.env.GOOGLE_GENAI_USE_VERTEXAI || "");
const MODELS = {
  image: process.env.MODEL_IMAGE || "gemini-3.1-flash-lite-image",
  text: process.env.MODEL_TEXT || "gemini-3.8-flash",
};

/** True when the server has a way to reach Google's AI. */
export const aiConfigured = () =>
  USE_VERTEX ? !!process.env.GOOGLE_CLOUD_PROJECT : !!(process.env.GEMINI_API_KEY || process.env.API_KEY);

let client: GoogleGenAI | null = null;
const getAI = () => {
  if (client) return client;
  if (USE_VERTEX) {
    client = new GoogleGenAI({ vertexai: true, project: process.env.GOOGLE_CLOUD_PROJECT, location: process.env.GOOGLE_CLOUD_LOCATION || "global" });
  } else {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) throw new Error("No AI configured.");
    // Tests point GOOGLE_GEMINI_BASE_URL at a stand-in, so they never call Google or spend money.
    const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL;
    client = new GoogleGenAI({ apiKey, ...(baseUrl ? { httpOptions: { baseUrl } } : {}) });
  }
  return client;
};

export const isBusy = (err: any) =>
  [503, 429].includes(err?.status) || [503, 429].includes(err?.code) || /503|high demand|UNAVAILABLE|Resource exhausted/i.test(err?.message || "");

/** Retries Google's brief busy spikes. */
async function withRetry<T>(action: () => Promise<T>, retries = 3, initialDelayMs = 1500): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await action();
    } catch (err: any) {
      if (!isBusy(err) || attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, initialDelayMs * 2 ** (attempt - 1) + Math.random() * 500));
    }
  }
}

/** A picture from a (already checked) description: { data (base64), mimeType }, or null when none came back. */
export async function makePicture(prompt: string): Promise<{ data: string; mimeType: string } | null> {
  const response = await withRetry(() =>
    getAI().models.generateContent({
      model: MODELS.image,
      contents: [{ role: "user", parts: [{ text: pictureInstruction(prompt) }] }],
      config: { responseModalities: ["TEXT", "IMAGE"] },
    })
  );
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData?.data) return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png" };
  }
  return null;
}

/** Looks at a picture for people, holy figures, text or anything unsuitable. Null when the check couldn't run. */
export async function checkPicture(data: string, mimeType: string): Promise<Partial<PictureVerdict> | null> {
  try {
    const response = await withRetry(() =>
      getAI().models.generateContent({
        model: MODELS.text,
        contents: [{ role: "user", parts: [{ inlineData: { mimeType, data } }, { text: PICTURE_CHECK_QUESTION }] }],
        config: { responseMimeType: "application/json" },
      })
    );
    const parsed = JSON.parse(response.text || "null");
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err: any) {
    console.error("picture check:", err?.message || err);
    return null;
  }
}

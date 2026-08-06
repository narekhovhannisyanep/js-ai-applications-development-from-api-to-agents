import { start } from "../base_app";
import { GeminiAICLient } from "./client";
import { CustomGeminiAIClient } from "./custom_client";

import {
  DEFAULT_SYSTEM_PROMPT,
  GEMINI_ENDPOINT,
  GEMINI_API_KEY,
} from "../../commons";

const geminiClient = new GeminiAICLient(
  GEMINI_ENDPOINT,
  "gemini-3.5-flash-lite",
  GEMINI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

const geminiCustomClient = new CustomGeminiAIClient(
  GEMINI_ENDPOINT,
  "gemini-3.5-flash-lite",
  GEMINI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

start(true, geminiCustomClient);

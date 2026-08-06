import { config } from "dotenv";

/**
 * Configuration constants for AI service integrations.
 *
 * This module centralizes all API endpoints, API keys, and default configuration
 * values used across different AI service providers (OpenAI, Anthropic, Gemini).
 *
 * All API keys are loaded from environment variables for security.
 */

config();

// Default system prompt used across all AI services
export const DEFAULT_SYSTEM_PROMPT =
  "You are an assistant who answers concisely and informatively.";

// OpenAI API configuration
export const OPENAI_HOST = "https://api.openai.com";
export const OPENAI_CHAT_COMPLETIONS_ENDPOINT = `${OPENAI_HOST}/v1/chat/completions`;
export const OPENAI_RESPONSES_ENDPOINT = `${OPENAI_HOST}/v1/responses`;
export const OPENAI_EMBEDDINGS_ENDPOINT = `${OPENAI_HOST}/v1/embeddings`;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const GPT_5_4_NANO = "gpt-5.4-nano";

// Anthropic API configuration
export const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
export const ANTHROPIC_VERSION = "2023-06-01";
export const CLAUDE_HAIKU_4_5 = "claude-haiku-4-5";

// Google Gemini API configuration
export const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_3_5_FLASH_LITE = "gemini-3.5-flash-lite";

// User Service API configuration
export const USER_SERVICE_ENDPOINT = "http://localhost:8041";

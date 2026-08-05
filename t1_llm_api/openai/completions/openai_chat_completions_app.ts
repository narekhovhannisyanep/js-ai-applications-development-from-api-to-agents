import { OpenAIClient } from "./client";
import { CustomOpenAIClient } from "./custom_client";

import {
  OPENAI_API_KEY,
  OPENAI_CHAT_COMPLETIONS_ENDPOINT,
  DEFAULT_SYSTEM_PROMPT,
} from "../../../commons";
import { start } from "../../base_app";

const openAIClient = new OpenAIClient(
  OPENAI_CHAT_COMPLETIONS_ENDPOINT,
  "gpt-5.4-nano",
  OPENAI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

const openAICustomClient = new CustomOpenAIClient(
  OPENAI_CHAT_COMPLETIONS_ENDPOINT,
  "gpt-5.4-nano",
  OPENAI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

start(true, openAIClient);

import { OpenAIClient } from "./client";
import { CustomOpenAIClient } from "./custom_client";

import {
  OPENAI_API_KEY,
  OPENAI_CHAT_COMPLETIONS_ENDPOINT,
  DEFAULT_SYSTEM_PROMPT,
  GPT_5_4_NANO,
} from "../../../commons";
import { start } from "../../base_app";

const openAIClient = new OpenAIClient(
  OPENAI_CHAT_COMPLETIONS_ENDPOINT,
  GPT_5_4_NANO,
  OPENAI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

const openAICustomClient = new CustomOpenAIClient(
  OPENAI_CHAT_COMPLETIONS_ENDPOINT,
  GPT_5_4_NANO,
  OPENAI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

start(true, openAICustomClient);

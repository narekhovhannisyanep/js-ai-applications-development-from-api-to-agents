import { OpenAIResponsesClient } from "./client";
import { CustomOpenAIResponsesClient } from "./custom_client";

import {
  DEFAULT_SYSTEM_PROMPT,
  OPENAI_API_KEY,
  OPENAI_RESPONSES_ENDPOINT,
  GPT_5_4_NANO,
} from "../../../commons";
import { start } from "../../base_app";

const openAIClient = new OpenAIResponsesClient(
  OPENAI_RESPONSES_ENDPOINT,
  GPT_5_4_NANO,
  OPENAI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

const openAICustomClient = new CustomOpenAIResponsesClient(
  OPENAI_RESPONSES_ENDPOINT,
  GPT_5_4_NANO,
  OPENAI_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

start(true, openAICustomClient);

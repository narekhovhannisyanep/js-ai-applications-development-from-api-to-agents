import { start } from "../base_app";
import { AnthropicAIClient } from "./client";
import { CustomAnthropicAIClient } from "./custom_client";

import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_ENDPOINT,
  CLAUDE_HAIKU_4_5,
  DEFAULT_SYSTEM_PROMPT,
} from "../../commons";

const anthropicClient = new AnthropicAIClient(
  ANTHROPIC_ENDPOINT,
  CLAUDE_HAIKU_4_5,
  ANTHROPIC_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

const anthropicCustomClient = new CustomAnthropicAIClient(
  ANTHROPIC_ENDPOINT,
  CLAUDE_HAIKU_4_5,
  ANTHROPIC_API_KEY,
  DEFAULT_SYSTEM_PROMPT,
);

start(true, anthropicCustomClient);

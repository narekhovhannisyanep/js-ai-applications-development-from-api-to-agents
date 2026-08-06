import Anthropic from "@anthropic-ai/sdk";

import AIClient from "../base_client";

import { Message, Role } from "../../commons";

/**
 * Client for Anthropic's Claude API using the official SDK.
 *
 * This implementation uses the official Anthropic TypeScript library to interact
 * with Claude models, providing both synchronous and streaming response capabilities.
 *
 * Inherits all attributes from AIClient.
 */
export class AnthropicAIClient extends AIClient {
  client!: Anthropic;

  /**
   * Initialize the Anthropic client with the official SDK.
   *
   * @param args Constructor parameters inherited from AIClient (endpoint, modelName, apiKey, systemPrompt).
   */
  constructor(...args: ConstructorParameters<typeof AIClient>) {
    super(...args);
    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  /**
   * Get a synchronous response from Anthropic's Claude API.
   *
   * @param messages The conversation history.
   * @returns The AI's response message.
   *
   * Note: Claude's API uses a separate 'system' parameter for system instructions.
   * Response content blocks are concatenated into a single text response.
   * The response is printed to stdout before being returned.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    const requsetOptions: Anthropic.MessageCreateParamsNonStreaming = {
      model: this.modelName,
      system: this.systemPrompt,
      messages: messages.map((msg) => ({
        ...msg,
        role: msg.role === "user" ? "user" : "assistant",
      })),
      max_tokens: 100,
      temperature: 0.3,
      cache_control: { type: "ephemeral" },
    };

    const aiResponse = (await this.client.messages.create(
      requsetOptions,
    )) as Anthropic.Messages.Message;
    const content = (aiResponse.content[0] as Anthropic.TextBlock).text;
    console.log(content);

    return new Message(Role.ASSISTANT, content);
  };

  /**
   * Get a streaming response from Anthropic's Claude API.
   *
   * The response is streamed using event-based streaming, with text deltas
   * printed immediately as they arrive.
   *
   * @param messages The conversation history.
   * @returns The complete AI response message after all deltas are received.
   *
   * Note: Listens for 'text' events with text deltas.
   * Each delta is printed to stdout as it arrives for real-time display.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    const requestOptions: Anthropic.MessageCreateParamsStreaming = {
      model: this.modelName,
      system: this.systemPrompt,
      messages: messages as Anthropic.MessageParam[],
      stream: true,
      max_tokens: 100,
      cache_control: { type: "ephemeral" },
    };

    let deltaContents: Array<string> = [];
    const stream = await this.client.messages.create(requestOptions);

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        deltaContents.push(event.delta.text);
        process.stdout.write(event.delta.text);
      }
    }

    process.stdout.write("\n");
    return new Message(Role.ASSISTANT, deltaContents.join(""));
  };
}

import Anthropic from "@anthropic-ai/sdk";

import AIClient from "../base_client";

import { ANTHROPIC_VERSION, Message, Role } from "../../commons";

/**
 * Custom HTTP client for Anthropic's Claude API.
 *
 * This implementation uses raw HTTP requests instead of the official SDK,
 * demonstrating how to interact with Claude's API directly
 * and handle its Server-Sent Events (SSE) streaming format.
 */
export class CustomAnthropicAIClient extends AIClient {
  /**
   * Get a synchronous response using a raw HTTP POST request.
   *
   * @param messages The conversation history.
   * @returns The AI's response message.
   *
   * Note: Requires 'x-api-key' header and 'anthropic-version' header.
   * Claude's API returns content as an array of content blocks.
   * The response is printed to stdout before being returned.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    const headers = {
      "Content-Type": "application-json",
      "x-api-key": this.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    };

    const requestOptions: Anthropic.MessageCreateParams = {
      model: this.modelName,
      system: this.systemPrompt,
      messages: messages as Anthropic.MessageParam[],
      cache_control: { type: "ephemeral" },
      max_tokens: 100,
    };

    try {
      const httpResponse = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestOptions),
      });

      if (!httpResponse.ok) {
        const errorText = await httpResponse.text();
        throw new Error(`HTTP: ${httpResponse.status} ${errorText}`);
      }

      const data = (await httpResponse.json()) as Anthropic.Messages.Message;
      let content = null;
      if (data.content[0].type === "text") {
        content = data.content[0].text;
        console.log(content);
      }

      return new Message(
        Role.ASSISTANT,
        content ?? "Anthropic API response text is empty!",
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  };

  /**
   * Get a streaming response using raw HTTP with Server-Sent Events (SSE).
   *
   * The response is streamed using Anthropic's SSE format, with text deltas
   * printed immediately as they arrive.
   *
   * @param messages The conversation history.
   * @returns The complete AI response message after all deltas are received.
   *
   * Note: Uses Server-Sent Events (SSE) format where each line starts with "data: ".
   * Listens for 'content_block_delta' events with 'text_delta' type.
   * Stops processing when 'message_stop' event is received.
   * Each delta is printed to stdout as it arrives.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    const headers = {
      "Content-Type": "application-json",
      "x-api-key": this.apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    };

    const requestOptions: Anthropic.MessageCreateParamsStreaming = {
      model: this.modelName,
      system: this.systemPrompt,
      messages: messages as Anthropic.MessageParam[],
      cache_control: { type: "ephemeral" },
      max_tokens: 100,
      stream: true,
    };

    try {
      const httpResponse = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestOptions),
      });

      if (!httpResponse.ok) {
        const errorText = await httpResponse.text();
        throw new Error(`HTTP: ${httpResponse.status} ${errorText}`);
      }

      if (!httpResponse.body) {
        throw new Error("HTTP Body is missing.");
      }

      const decoder = new TextDecoder("utf-8");
      const reader = httpResponse.body.getReader();
      let buffer = "";
      const deltaContents: Array<string> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));
          if (
            data.type === "content_block_delta" &&
            data.delta.type === "text_delta"
          ) {
            deltaContents.push(data.delta.text);
            process.stdout.write(data.delta.text);
          }
        }
      }

      process.stdout.write("\n");
      return new Message(Role.ASSISTANT, deltaContents.join(""));
    } catch (err) {
      console.log(err);
      throw err;
    }
  };
}

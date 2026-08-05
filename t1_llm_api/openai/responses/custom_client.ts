import OpenAI from "openai";

import { BaseOpenAiClient } from "../base";

import { Message, Role } from "../../../commons";

/**
 * Custom HTTP client for OpenAI Responses API.
 *
 * This implementation uses raw fetch requests instead of the official SDK,
 * demonstrating how to interact with the Responses API directly and handle
 * its event-based Server-Sent Events (SSE) streaming format.
 */
export class CustomOpenAIResponsesClient extends BaseOpenAiClient {
  /**
   * Sends a non-streaming request using a raw HTTP POST to the Responses API.
   *
   * @param messages Conversation history sent to the model.
   * @returns The AI response as a single message.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
    const requestData = {
      model: this.modelName,
      instructions: this.systemPrompt,
      input: messages as OpenAI.Responses.ResponseInput,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.status !== 200) {
        const responseText = await response.text();
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const data = await response.json();
      const content = this._extractOutputText(data as Record<string, unknown>);
      console.log(content);
      return new Message(Role.ASSISTANT, content);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  /**
   * Sends a streaming request using raw HTTP with event-based Server-Sent Events (SSE).
   *
   * The Responses API uses named events (e.g. `response.output_text.delta`) followed
   * by a data payload. Each delta is written to stdout immediately as it arrives.
   *
   * @param messages Conversation history sent to the model.
   * @returns The final aggregated AI message after the stream completes.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };
    const requestData = {
      model: this.modelName,
      instructions: this.systemPrompt,
      input: messages as OpenAI.Responses.ResponseInput,
      stream: true,
      temperature: 0.7,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.status !== 200) {
        const responseText = await response.text();
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const content = await this._extractStreamContent(response);
      process.stdout.write("\n");
      return new Message(Role.ASSISTANT, content);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  /**
   * Extract text content from the Responses API output.
   *
   * @param data The JSON response data from the API.
   * @returns The extracted text content.
   */
  private _extractOutputText = (data: Record<string, unknown>): string => {
    interface ResponseOutput {
      type: string;
      content: { type: string; text?: string }[];
    }
    for (const outputPart of data.output as Array<ResponseOutput>) {
      if (outputPart.type === "message") {
        const content = outputPart.content;
        for (const contentPart of content) {
          if (contentPart.type === "output_text") {
            return contentPart.text ?? "";
          }
        }
      }
    }

    throw new Error("Output text is missing in the response");
  };

  /**
   * Extract text content from a stream response, and print chunks
   *
   * @param stream The stream response from the Responses API output.
   * @returns string The extracted content.
   */
  private async _extractStreamContent(data: Response): Promise<string> {
    if (!data.body) {
      return "";
    }
    const contents = [];
    const decoder = new TextDecoder("utf-8");
    const reader = data.body.getReader();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        if (line === "data: [DONE]") break;

        const deltaPart = JSON.parse(line.slice(6));
        if (deltaPart.type === "response.output_text.delta") {
          contents.push(deltaPart.delta);
          process.stdout.write(deltaPart.delta);
        }
      }
    }
    return contents.join();
  }
}

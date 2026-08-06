import type { Interactions } from "@google/genai";

import AIClient from "../base_client";

import { Message, Role } from "../../commons";

/**
 * Custom HTTP client for Google Gemini API.
 *
 * This implementation uses raw fetch requests instead of the official SDK,
 * demonstrating how to interact with Gemini's API directly and handle its
 * Server-Sent Events (SSE) streaming format.
 */
export class CustomGeminiAIClient extends AIClient {
  /**
   * Sends a non-streaming request using a raw HTTP POST to the Gemini API.
   *
   * The URL is constructed by appending `:generateContent` to the model endpoint.
   * Uses `x-goog-api-key` header for authentication.
   *
   * @param messages Conversation history sent to the model.
   * @returns The AI response as a single message.
   */
  private currentInteractionId: string | undefined = undefined;

  response = async (messages: Array<Message>): Promise<Message> => {
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": this.apiKey,
    };

    const requestData: Interactions.CreateModelInteractionParamsNonStreaming = {
      model: this.modelName,
      system_instruction: this.systemPrompt,
      input: messages.at(-1)?.content ?? "",
      previous_interaction_id: this.currentInteractionId,
      generation_config: {
        temperature: 0,
      },
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (response.status !== 200) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as Interactions.Interaction;

      if (data.id) {
        this.currentInteractionId = data.id;
      }

      let content = "";

      outer: for (const step of data.steps ?? []) {
        if (step.type === "model_output") {
          for (const contentPart of step.content ?? []) {
            if (contentPart.type === "text") {
              content = contentPart.text;
              break outer;
            }
          }
        }
      }

      if (!content) {
        console.warn(
          "Gemini returned an empty interaction step. Check safety settings.",
        );
      }

      console.log(content);
      return new Message("model", content);
    } catch (err) {
      console.error(`Critical Client Network Error: ${err}`);
      throw err;
    }
  };

  /**
   * Sends a streaming request using raw HTTP with Server-Sent Events (SSE).
   *
   * The URL is constructed with the `:streamGenerateContent?alt=sse` endpoint.
   * Each SSE chunk contains candidates with content parts that are written to
   * stdout immediately as they arrive.
   *
   * @param messages Conversation history sent to the model.
   * @returns The final aggregated AI message after the stream completes.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    const headers = {
      "Content-Type": "application/json",
      "x-goog-api-key": this.apiKey,
    };

    const requestData: Interactions.CreateModelInteractionParamsStreaming = {
      model: this.modelName,
      system_instruction: this.systemPrompt,
      input: messages.at(-1)?.content ?? "",
      previous_interaction_id: this.currentInteractionId,
      generation_config: {
        temperature: 0,
      },
      stream: true,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status} ${errorText}`);
      }

      if (!response.body) {
        throw new Error("Response body is missing.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      const contents: Array<string> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          if (line === "data: [DONE]") break;

          const data = JSON.parse(
            line.slice(6),
          ) as Interactions.InteractionSSEEvent;

          if (data.event_type === "interaction.created") {
            this.currentInteractionId = data.interaction.id;
            continue;
          }

          if (data.event_type === "step.delta" && data.delta.type === "text") {
            contents.push(data.delta.text);
            process.stdout.write(data.delta.text);
          }
        }
      }

      process.stdout.write("\n");
      return new Message("model", contents.join(""));
    } catch (err) {
      console.error("Critical Client Network Error: ", err);
      throw err;
    }
  };
}

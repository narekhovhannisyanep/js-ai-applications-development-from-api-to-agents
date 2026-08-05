import { GoogleGenAI, Content } from "@google/genai";

import { inspect } from "util";

import AIClient from "../base_client";

import { Message, Role } from "../../commons";

/**
 * Client for Google Gemini API using the official SDK.
 *
 * This implementation uses the official Google GenAI TypeScript library to interact
 * with Gemini models, providing both synchronous and streaming response capabilities.
 *
 * Inherits all attributes from AIClient.
 */
export class GeminiAICLient extends AIClient {
  client: GoogleGenAI;
  private currentInteractionId: string | undefined = undefined;

  /**
   * Initialize the Gemini client with the official SDK.
   *
   * @param args Constructor parameters inherited from AIClient (endpoint, modelName, apiKey, systemPrompt).
   */
  constructor(...args: ConstructorParameters<typeof AIClient>) {
    super(...args);
    this.client = new GoogleGenAI({ apiKey: this.apiKey });
  }

  /**
   * Get a synchronous response from Google's Gemini API.
   *
   * @param messages The conversation history.
   * @returns The AI's response message.
   *
   * Note: Gemini uses 'systemInstruction' parameter for system-level guidance.
   * The response is printed to stdout before being returned.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    const response = await this.client.interactions.create({
      model: this.modelName,
      input: messages.at(-1)?.content ?? "",
      system_instruction: this.systemPrompt,
      previous_interaction_id: this.currentInteractionId,
      generation_config: {
        temperature: 0.7,
      },
    });

    this.currentInteractionId = response.id;

    for (const step of response.steps || []) {
      if (step.type === "model_output") {
        for (const contentPart of step.content || []) {
          if (contentPart.type === "text") {
            console.log(contentPart.text);
            return new Message("model", contentPart.text);
          }
        }
      }
    }

    return new Message("model", "");
  };

  /**
   * Get a streaming response from Google's Gemini API.
   *
   * The response is streamed chunk-by-chunk, with each text chunk printed
   * immediately as it arrives.
   *
   * @param messages The conversation history.
   * @returns The complete AI response message after all chunks are received.
   *
   * Note: Uses the async streaming interface provided by the Gemini SDK.
   * Each chunk's text is printed to stdout as it arrives.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    //TODO:
    // - Convert messages to Gemini Content format using this.convertToGeminiContent(messages)
    // - Call the SDK client with streaming (use systemInstruction for system prompt)
    // - Iterate over stream chunks and write to stdout
    // - Return the assembled ASSISTANT Message
    throw new Error("Not implemented.");
  };
}

import { Interactions } from "@google/genai";

import AIClient from "./base_client";

import { GEMINI_API_KEY, GEMINI_ENDPOINT, Message, Role } from "../../commons";

const API_KEY_HEADER_NAME = "x-goog-api-key";

/**
 * Client for Google Gemini API using raw HTTP fetch.
 *
 * This implementation uses the native fetch API to send direct HTTP requests
 * to the Gemini generateContent endpoint, giving full control over request parameters.
 *
 * Inherits all attributes from AIClient.
 */
export class GeminiAICLient extends AIClient {
  /**
   * Initialize the Gemini client.
   *
   * @param modelName The specific model identifier to use.
   */
  currentInteractionId: string | undefined;

  constructor(modelName: string) {
    super(GEMINI_ENDPOINT, modelName, GEMINI_API_KEY, API_KEY_HEADER_NAME);
    this.currentInteractionId = undefined;
  }

  /**
   * Convert Message objects to Gemini Content format.
   *
   * @param messages The conversation messages to convert.
   * @returns Messages in Gemini's Content format.
   */
  private _toGeminiContents = (
    messages: Array<Message>,
  ): Array<{ role: string; parts: Array<{ text: string }> }> => {
    return messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.content }],
    }));
  };

  /**
   * Get a synchronous response from Google's Gemini API.
   *
   * @param messages The conversation history.
   * @param printRequest If true, prints the full request (endpoint, headers, body) before sending.
   * @param printOnlyContent If true, prints only the response text; otherwise prints the full response JSON.
   * @param args Optional provider-specific parameters to include in the request body (e.g. `{ generationConfig: { temperature: 0.5 } }`).
   * @returns The AI's response message.
   *
   * Note: Gemini requires a model-specific URL and wraps generation settings in a generationConfig object.
   */
  response = async (
    messages: Array<Message>,
    printRequest: boolean,
    printOnlyContent: boolean,
    args?: any,
  ): Promise<Message> => {
    const headers = {
      "Content-Type": "application/json",
      [API_KEY_HEADER_NAME]: this.apiKey,
    };

    const url = this.endpoint;

    const requestData: Interactions.CreateModelInteractionParamsNonStreaming = {
      model: this.modelName,
      input: messages.at(-1)?.content ?? "",
      ...args,
    };

    if (this.currentInteractionId) {
      requestData.previous_interaction_id = this.currentInteractionId;
    }

    if (!requestData.generation_config) {
      requestData.generation_config = { max_output_tokens: 1024 };
    }

    const response = await fetch(url, {
      headers,
      method: "POST",
      body: JSON.stringify(requestData),
    });

    if (printRequest) {
      this._printRequest(requestData as Record<string, any>, headers);
    }

    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    interface GeminiResponse {
      id: string;
      steps: { type: string; content: { type: string; text: string }[] }[];
    }

    const result = (await response.json()) as GeminiResponse;

    if (result.id) {
      this.currentInteractionId = result.id;
    }

    const textConstents =
      result.steps.find((step) => step.type === "model_output")?.content ?? [];

    const message =
      textConstents.find((textContent) => textContent.type === "text")?.text ??
      "";

    if (printOnlyContent) {
      console.log(message);
    } else {
      this._printResponse(JSON.stringify(result, null, 2));
    }

    return new Message(Role.ASSISTANT, message);
  };
}

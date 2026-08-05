import { BaseOpenAiClient } from "../base";

import { Message, Role } from "../../../commons";

/**
 * Custom HTTP client for OpenAI Chat Completions API.
 *
 * This implementation uses raw fetch requests instead of the official SDK,
 * demonstrating how to interact with the Chat Completions API directly and
 * handle its Server-Sent Events (SSE) streaming format.
 */
export class CustomOpenAIClient extends BaseOpenAiClient {
  /**
   * Sends a non-streaming request using a raw HTTP POST to the Chat Completions API.
   *
   * @param messages Conversation history sent to the model.
   * @returns The AI response as a single message.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    const inputMessages = [
      ...messages,
      { role: Role.ASSISTANT, content: this.systemPrompt },
    ];
    const headers = {
      Authorization: this.apiKey,
      "Content-Type": "application/json",
    };
    const requestData = {
      model: this.modelName,
      messages: inputMessages,
      temperature: 0.8,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      interface ChatCompletionResponse {
        choices: { message: { content: string } }[];
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const message = data?.choices[0]?.message?.content;
      console.log(message);

      return new Message(Role.ASSISTANT, message);
    } catch (err) {
      console.error("HTTP Request failed:", err);
      throw err;
    }
  };

  /**
   * Sends a streaming request using raw HTTP with Server-Sent Events (SSE).
   *
   * The response is streamed token-by-token using OpenAI's SSE format,
   * with each chunk written to stdout immediately as it arrives.
   *
   * @param messages Conversation history sent to the model.
   * @returns The final aggregated AI message after the stream completes.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    //TODO:
    // https://platform.openai.com/docs/api-reference/chat/create (Streaming tab)
    // - Prepare headers with authorization and content type
    // - Prepare message history with the system prompt
    // - Execute POST request with stream: true
    // - Read the SSE stream (each line starts with "data: ", ends with "[DONE]")
    // - Parse chunks and write to stdout using this._getContentSnippet(data)
    // - Return the assembled ASSISTANT Message
    throw new Error("Not implemented.");
  };

  /**
   * Extract content from a streaming data chunk.
   *
   * @param data The JSON string from the SSE data field.
   * @returns The content text from the chunk, or empty string if no content.
   */
  private _getContentSnippet = (data: string): string => {
    //TODO:
    // - Parse data as JSON
    // - Extract choices[0].delta.content
    // - Return it, or '' if not present
    throw new Error("Not implemented.");
  };
}

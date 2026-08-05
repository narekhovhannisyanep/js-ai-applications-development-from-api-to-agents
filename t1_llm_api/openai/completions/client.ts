import { OpenAI } from "openai";

import { BaseOpenAiClient } from "../base";

import { Message, Role } from "../../../commons";
/**
 * Client for OpenAI Chat Completions API using the official SDK.
 *
 * This implementation uses the official OpenAI library to interact with the
 * Chat Completions API, providing both non-streaming and streaming response
 * capabilities.
 *
 * @property client The OpenAI SDK client instance.
 */
export class OpenAIClient extends BaseOpenAiClient {
  client!: OpenAI;

  constructor(...args: ConstructorParameters<typeof BaseOpenAiClient>) {
    super(...args);
    this.client = new OpenAI({
      apiKey: this.apiKey.replace(/^Bearer /, ""),
    });
  }

  /**
   * Sends a non-streaming request to the OpenAI Chat Completions API.
   *
   * @param messages Conversation history sent to the model.
   * @returns The AI response as a single message.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    const inputMessages = [
      ...messages,
      { role: Role.SYSTEM, content: this.systemPrompt },
    ];

    const completion = await this.client.chat.completions.create({
      model: this.modelName,
      messages: inputMessages as OpenAI.ChatCompletionMessageParam[],
    });

    const content = completion.choices[0].message.content ?? "";
    console.log(content);
    return new Message(Role.ASSISTANT, content);
  };

  /**
   * Sends a streaming request to the OpenAI Chat Completions API.
   *
   * The response is streamed token-by-token, with each chunk written to
   * stdout immediately as it arrives.
   *
   * @param messages Conversation history sent to the model.
   * @returns The final aggregated AI message after the stream completes.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    //TODO:
    // - Prepare message history with the system prompt
    // - Call the SDK client with streaming enabled
    // - Iterate over stream chunks and write to stdout
    // - Return the assembled ASSISTANT Message
    throw new Error("Not implemented.");
  };
}

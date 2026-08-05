import { OpenAI } from "openai";
import { Stream } from "openai/streaming";

import { BaseOpenAiClient } from "../base";

import { Message, Role } from "../../../commons";

/**
 * Client for OpenAI Responses API using the official SDK.
 *
 * This implementation uses the official OpenAI library to interact with the
 * Responses API, which uses `instructions` instead of system messages and
 * `input` instead of messages.
 *
 * @property client The OpenAI SDK client instance.
 */
export class OpenAIResponsesClient extends BaseOpenAiClient {
  client!: OpenAI;

  constructor(...args: ConstructorParameters<typeof BaseOpenAiClient>) {
    super(...args);
    this.client = new OpenAI({ apiKey: this.apiKey.replace(/^Bearer /, "") });
  }

  /**
   * Sends a non-streaming request to the OpenAI Responses API.
   *
   * @param messages Conversation history sent to the model.
   * @returns The AI response as a single message.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    const response = await this.client.responses.create({
      model: this.modelName,
      instructions: this.systemPrompt,
      input: messages as OpenAI.Responses.ResponseInput,
    });

    const content = response.output_text ?? "";

    console.log(content);
    return new Message(Role.ASSISTANT, content);
  };

  /**
   * Sends a streaming request to the OpenAI Responses API.
   *
   * The response is streamed using event-based streaming, with each delta
   * written to stdout immediately as it arrives.
   *
   * @param messages Conversation history sent to the model.
   * @returns The final aggregated AI message after the stream completes.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    const stream = await this.client.responses.create({
      model: this.modelName,
      stream: true,
      instructions: this.systemPrompt,
      input: messages as OpenAI.Responses.ResponseInput,
    });

    const deltaContents = [];
    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        const deltaContent = event.delta ?? "";
        process.stdout.write(deltaContent);
        deltaContents.push(deltaContent);
      }
    }

    process.stdout.write("\n");
    return new Message(Role.ASSISTANT, deltaContents.join());
  };
}

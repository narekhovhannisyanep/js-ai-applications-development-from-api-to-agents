import { Message } from "../commons";

/**
 * Abstract base class for AI service clients.
 *
 * This class defines the interface that all AI service implementations must follow.
 * It handles common initialization logic and requires concrete implementations for
 * both synchronous and asynchronous response methods.
 */
class AIClient {
  /**
   * Initialize the AI client with required configuration.
   *
   * @param endpoint The API endpoint URL for the AI service.
   * @param modelName The specific model identifier to use.
   * @param apiKey The API key for authentication.
   * @param systemPrompt The system-level instruction for the AI model.
   *
   * @throws Error if apiKey is null or empty.
   */
  constructor(
    public endpoint: string,
    public modelName: string,
    public apiKey: string,
    public systemPrompt: string,
  ) {
    if (!apiKey) {
      throw new Error("API key is required!");
    }
    this.endpoint = endpoint;
    this.modelName = modelName;
    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Sends a non-streaming request to the AI provider.
   * Override this in provider-specific clients.
   *
   * @param messages Conversation history sent to the model.
   * @returns The AI response as a single message.
   */
  response = async (messages: Array<Message>): Promise<Message> => {
    throw new Error("Method not implemented.");
  };

  /**
   * Sends a streaming request to the AI provider.
   * Override this in provider-specific clients.
   *
   * @param messages Conversation history sent to the model.
   * @returns The final aggregated AI message after the stream completes.
   */
  streamResponse = async (messages: Array<Message>): Promise<Message> => {
    throw new Error("Method not implemented.");
  };
}

export default AIClient;

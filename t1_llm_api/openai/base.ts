import AIClient from "../base_client";

/**
 * Abstract base class for OpenAI API clients.
 *
 * This class extends AIClient and adds OpenAI-specific initialization,
 * particularly formatting the API key as a Bearer token for authorization.
 *
 * Inherits all attributes from AIClient.
 */
export class BaseOpenAiClient extends AIClient {
  /**
   * Initialize the OpenAI client with Bearer token authentication.
   *
   * @param args Constructor parameters inherited from AIClient (endpoint, modelName, systemPrompt, apiKey).
   *             The apiKey will be prefixed with 'Bearer '.
   */
  constructor(...args: ConstructorParameters<typeof AIClient>) {
    super(...args);
    this.apiKey = `Bearer ${this.apiKey}`;
  }
}

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline/promises";

import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { GPT_5_4_NANO, OPENAI_API_KEY } from "../commons";

//TODO:
// Create a system prompt that:
//   - Defines the assistant's role (microwave manual expert)
//   - Describes the structure of the user message:
//       - `RAG CONTEXT`: retrieved document chunks
//       - `USER QUESTION`: the actual user question
//   - Instructs the model to answer ONLY from the RAG context / conversation history
//   - Instructs it to refuse questions not covered by the context
const SYSTEM_PROMPT = `
You are a RAG-powered assistant that assists user with their questions about microwave usage.

## User message structure:
<RAG CONTEXT>: Retrieved document relevant to the query.
<USER QUESTION>: the actual user question.

## Instructions:
- Use <RAG CONTEXT> as context when answering the <USER QUESTION>.
- Anser only based on RAG context or the conversation history.
- If no relevant information exists in <RAG CONTEXT> or conversation history, state that you cannot answer the question.
`;

// Template that injects retrieved context and the user question into a single prompt string
const getUserPrompt = (context: string, query: string) => `
<RAG CONTEXT>:
${context}

<USER QUESTION>: 
${query}`;

class MicrowaveRAG {
  vectorStore!: FaissStore;

  /** Resolves when the vector store is fully initialised and ready for queries. */
  readonly ready: Promise<void>;

  constructor(
    public embeddings: OpenAIEmbeddings,
    public llmClient: ChatOpenAI,
  ) {
    this.ready = this.setupVectorStore();
  }

  //TODO:
  // Check if the FAISS index folder already exists on disk.
  //   - If yes: load it with FaissStore.load()
  //   - If no:  call createNewIndex() to build and save a fresh one
  private async setupVectorStore(): Promise<void> {
    console.log("Setting up the vector store...");
    const faissIndexPath = path.join(__dirname, "microwave_faiss_index");

    if (fs.existsSync(faissIndexPath)) {
      console.log("Loading the FAISS store...");
      this.vectorStore = await FaissStore.load(faissIndexPath, this.embeddings);
    } else {
      console.log("Creating new index...");
      this.vectorStore = await this.createNewIndex();
    }
  }

  //TODO:
  // Build a new FAISS index from the microwave manual:
  //   - Load 'microwave_manual.txt' with TextLoader
  //   - Split into chunks with RecursiveCharacterTextSplitter
  //   - Create the store with FaissStore.fromDocuments()
  //   - Save the index locally for future runs
  private async createNewIndex(): Promise<FaissStore> {
    console.log("Loading the documents...");
    const loader = new TextLoader(path.join(__dirname, "microwave_manual.txt"));
    const documents = await loader.load();

    console.log("Creating chunks from the documents...");
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 50,
      separators: ["\n\n", "\n", "."],
    });
    const chunks = await splitter.splitDocuments(documents);

    console.log("Creating a store using the chunks...");
    const vectorStore = await FaissStore.fromDocuments(chunks, this.embeddings);

    const faissIndexPath = path.join(__dirname, "microwave_faiss_index");
    console.log(`Saving the FAISS store to ${faissIndexPath}...`);
    await vectorStore.save(faissIndexPath);

    return vectorStore;
  }

  //TODO:
  // Search the vector store for chunks most relevant to the query.
  //   - Use similaritySearchWithScore(query, k)
  //   - Print each chunk's L2 distance score and content
  //   - Return all matching chunks joined with "\n\n"
  // ---
  // Hint: try different values of `k` and `scoreThreshold` to see how they
  //       affect retrieval quality and LLM answer accuracy.
  //       Note: scoreThreshold is a maximum L2 distance (lower = more similar).
  //       FAISS does NOT return 0–1 relevance scores — a value of 1.0 may be
  //       too strict for some queries and return no results at all. Try 0.5–2.0.
  async retrieveContext(
    query: string,
    k = 4,
    scoreThreshold: number = 1.0,
  ): Promise<string> {
    console.log("\nSTEP 1: REGRIEVAL");
    const rawResults = await this.vectorStore.similaritySearchWithScore(
      query,
      k,
    );
    const relevantResults = [];

    for (const [document, score] of rawResults) {
      console.log(
        `\n-> Distance Score: ${score.toFixed(4)} | Content: ${document.pageContent.replace(/\n/g, " ")}`,
      );

      if (score <= scoreThreshold) {
        relevantResults.push(document.pageContent);
      }
    }

    if (relevantResults.length === 0) {
      console.log("⚠️ No relevant chunks met the scoreThreshold requirement.");
    }

    return relevantResults.join("\n\n");
  }

  //TODO:
  // Format the user prompt by injecting context and query into getUserPrompt().
  //   - Print the formatted prompt
  //   - Return the formatted string
  augmentPrompt(context: string, query: string): string {
    console.log("\nSTEP 2: AUGMENTATION");
    const augmentedPrompt = getUserPrompt(context, query);
    return augmentedPrompt;
  }

  //TODO:
  // Send the augmented prompt to the LLM and return its answer.
  //   - Build a messages array: [SystemMessage(SYSTEM_PROMPT), HumanMessage(augmentedPrompt)]
  //   - Invoke llmClient and print the response content
  //   - Return the response content as a string
  async generateAnswer(augmentedPrompt: string): Promise<string> {
    console.log("\nSTEP 3: GENERATION");
    const inputMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(augmentedPrompt),
    ];

    const llmMessage = await this.llmClient.invoke(inputMessages);
    const textOutput =
      typeof llmMessage.content === "string"
        ? llmMessage.content
        : llmMessage.content.map((c) => c?.text ?? "").join("");

    console.log(`\n💬LLM Response:\n${textOutput}\n`);
    return textOutput;
  }
}

const main = async (rag: MicrowaveRAG) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🎯 Microwave RAG Assistant");
  console.log("Type your question or 'exit' to quit.");

  while (true) {
    const input = await rl.question("➡️  ");

    if (input.toLowerCase().trim() === "exit") {
      console.log("Exiting the chat. Goodbye!");
      rl.close();
      process.exit(0);
    }

    //TODO:
    // Execute the 3-step RAG pipeline for each user question:
    //   Step 1 (Retrieval):   call rag.retrieveContext()  → context
    //   Step 2 (Augmentation): call rag.augmentPrompt()  → augmentedPrompt
    //   Step 3 (Generation):  call rag.generateAnswer()  → answer
    await rag.ready;

    try {
      const context = await rag.retrieveContext(input, 5, 1.5);
      const augmentedPrompt = rag.augmentPrompt(context, input);
      const llmMessage = await rag.generateAnswer(augmentedPrompt);
    } catch (error) {
      console.error("Pipeline failure handling your input query:", error);
    }
  }
};

//TODO:
// Instantiate MicrowaveRAG and start the chat loop:
//   - Create OpenAIEmbeddings with model "text-embedding-3-small"
//   - Create ChatOpenAI with model "gpt-4o" and temperature 0
//   - Construct MicrowaveRAG, await rag.ready, then call main(rag)
const embeddings = new OpenAIEmbeddings({
  apiKey: OPENAI_API_KEY,
  model: "text-embedding-3-small",
});
const openaiClient = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  model: GPT_5_4_NANO,
  temperature: 0,
});

main(new MicrowaveRAG(embeddings, openaiClient));

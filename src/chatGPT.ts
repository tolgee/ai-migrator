import dotenv from "dotenv";
import { AzureOpenAI, OpenAI } from "openai";
import fsExtra from "fs-extra";
import { extractCreatedKeys } from "./keyExtractor";
import inquirer from "inquirer";

const { promises: fs } = fsExtra;

dotenv.config();

// Load environment variables
const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const openAiApiKey = process.env.OPENAI_API_KEY;

const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = "2023-03-15-preview";

if (!azureEndpoint || !azureApiKey || !deployment) {
  console.error(
    "Azure OpenAI endpoint, API key or deployment ID is missing. Please set it in your .env file.",
  );
}

// Initialize the Azure OpenAI client
const azureClient = new AzureOpenAI({
  apiKey: azureApiKey,
  endpoint: azureEndpoint,
  deployment,
  apiVersion,
});

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: openAiApiKey,
});

// Define a type for the ChatGPT response structure
interface ChatGPTResponse {
  updatedContent: string;
  createdKeys: {
    keyName: string;
    description: string;
    translations: { en: string };
  }[];
}

// Function to send file content to ChatGPT for migration
export const sendFileToChatGPT = async (
  filePath: string,
): Promise<ChatGPTResponse> => {
  try {
    // Ask the user to choose the AI provider
    const { apiProvider } = await inquirer.prompt([
      {
        type: "list",
        name: "apiProvider",
        message: "Which AI provider would you like to use?",
        choices: ["AZURE_OPENAI", "OPENAI"],
      },
    ]);

    // Read the file content from the provided file path
    const fileContent = await fs.readFile(filePath, "utf-8");

    // Ask user for additional instructions
    const { promptAppendix } = await inquirer.prompt([
      {
        type: "input",
        name: "promptAppendix",
        message:
          "Do you want to provide custom instructions to ChatGPT? (Press Enter to skip)",
      },
    ]);

    const systemPrompt = `
                            You are a localization assistant. Your task is to immediately process the file content provided by the user for localization. However, follow these important rules:
                                1. Add the delimiter "---T components---" at the very beginning of the file content.
                                2. At the end of the file content, add the delimiter "---KEYS---" followed by a JSON structure with the key names, descriptions, and translations.
                                3. **Do not process any content that is already wrapped in a <T> component**. Accurately detect and skip existing <T> components to avoid reprocessing them.
                                4. **Do not modify any attributes or strings that use localization functions like useTranslate("key name") or t()**. Leave them unchanged, and do not create new keys for them.
                                5. **Only replace plain text inside simple DOM elements**. Focus on replacing text in elements such as:
                                    - <div>Some Text</div>
                                    - <button>Some Text</button>
                                6. **For attributes or non-component contexts** (like placeholder, title, or window.title), use useTranslate("key name") (and not {useTranslate("key name")}) instead of wrapping the text in a <T> component. For example:
                                    - <input placeholder="New list item" /> should become <input placeholder=useTranslate("add-item-input-placeholder") />.
                                7. **When generating key names**, ensure that each keyName is unique and descriptive, based on the original content. The key name should reflect the purpose or content of the string. **Do not use generic key names like "translations" in JSON files.**. 
                                    - For example, "Share" should map to "share-button", "App title" should map to "app-title", and "Add item" should map to "add-item".
                                8. Do not modify or translate string literals inside any console functions (like console.log, console.error, console.warn). These should remain in English.
                                9. Generate a JSON structure that includes:
                                        1. "name" (with underscores instead of dashes).
                                        2. "description" (based on the text's context).
                                        3. "translations" (with "en" containing the original text).
                        `;

    const userPrompt = `
                            Here is the file content that needs to be processed:
                            ${fileContent}

                            Instructions:
                            1. Add the delimiter "---T components---" at the very beginning of the file content.
                            2. Add the delimiter "---KEYS---" at the very end of the file content.
                            3. **Do not modify any content already wrapped in a <T> component**. Ensure that existing <T> components are accurately detected and skipped.
                            4. **Do not modify strings inside attributes or event handlers that use localization functions like useTranslate("key name") or t()**. Leave them unchanged.
                            5. **Only replace plain text inside DOM elements like <div>Some text</div> or <button>Some text</button> with <T> components**.
                            6. Replace plain text strings with the <T> component, using key names with dashes (-).
                            7. Replace plain text strings inside non-component contexts like attributes (e.g., placeholder, title) with useTranslate("key name") and not {useTranslate("key name")}.
                            8. **Ensure that each key name is unique and descriptive**, based on the original text. For example:
                                - "Share" should become "share-button".
                                - "App title" should become "app-title".
                                - "Add item" should become "add-item".
                                - "Delete item" should become "delete-item".
                            9. Do not modify or translate string literals inside console.log, console.error, or console.warn. These should remain in English.
                            10. Do not include a description in the <T> component.
                            11. Add descriptions in the JSON output, not in the <T> component.
                            12. ${promptAppendix}
                            13. After "---KEYS---" delimiter, generate a JSON list with key names (using underscores), descriptions, and translations (English as "en").
                        `;

    let responseText: string | null | undefined = "";

    if (apiProvider === "AZURE_OPENAI") {
      // Send request to Azure OpenAI
      const response = await azureClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 1024,
      });

      // Extract the file content and keys separately from the response
      responseText = response.choices[0]?.message.content; // Full response text
    } else if (apiProvider === "OPENAI") {
      // Send request to OpenAI
      const response = await openai.chat.completions.create(
        {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${openAiApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      responseText = response.choices[0]?.message.content;
    } else {
      console.error("Unsupported API provider specified in .env file");
    }

    if (!responseText) {
      console.error("No updated content received from OpenAI.");
      return {
        updatedContent: "",
        createdKeys: [],
      };
    }

    console.log(
      "Full response text with delimiters from OpenAI:",
      responseText,
    ); // Log the full response text

    // Extract the content between the delimiters
    const componentsStart =
      responseText.indexOf("---T components---") + "---T components---".length;
    const componentsEnd = responseText.indexOf("---KEYS---");
    const fileContentWithComponents = responseText
      .substring(componentsStart, componentsEnd)
      .trim();

    const responseParts = responseText?.split("---KEYS---"); // Split the response at a marker like `---KEYS---`
    if (!responseParts) {
      console.error("Failed to split the response text.");
      return {
        updatedContent: "",
        createdKeys: [],
      };
    }

    const keyListString = responseParts[1]; // The JSON-like string for the key list
    if (!keyListString) {
      console.error("Failed to access list of keys.");
      return {
        updatedContent: "",
        createdKeys: [],
      };
    }
    console.log("Key list string from ChatGPT:", keyListString); // Log the raw key list string

    // Parse the key list from the response
    let createdKeys: {
      keyName: string;
      description: string;
      translations: { en: string };
    }[] = [];
    try {
      createdKeys = extractCreatedKeys(keyListString); // Parse the list of keys
      console.log("Parsed created keys:", createdKeys); // Log the parsed list of keys
    } catch (error) {
      console.error(
        "Failed to parse the list of keys from ChatGPT response.",
        error,
      );
      createdKeys = [];
    }

    return {
      updatedContent: fileContentWithComponents,
      createdKeys,
    };
  } catch (error) {
    console.error(
      `Error during ChatGPT request processing for ${filePath}: ${error}`,
    );
    return {
      updatedContent: "",
      createdKeys: [],
    };
  }
};

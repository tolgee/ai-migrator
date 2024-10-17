import dotenv from "dotenv"
import {AzureOpenAI} from "openai";
import fsExtra from 'fs-extra';
import {extractCreatedKeys} from "./keyExtractor";

const {promises: fs} = fsExtra;

dotenv.config();

// Load environment variables
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = "2023-03-15-preview";

if (!azureEndpoint || !apiKey || !deployment) {
    console.error("Azure OpenAI endpoint, API key or deployment ID is missing. Please set it in your .env file.");
}

// Initialize the Azure OpenAI client
const client = new AzureOpenAI({
    apiKey: apiKey,
    endpoint: azureEndpoint,
    deployment,
    apiVersion,
});

// Define a type for the createdKeys structure
interface CreatedKey {
    keyName: string;
    description: string;
    translations: { en: string };
}

// Define a type for the ChatGPT response structure
interface ChatGPTResponse {
    updatedContent: string;
    createdKeys: { keyName: string; description: string; translations: { en: string } }[];
}

// Function to send file content to ChatGPT for migration
export const sendFileToChatGPT = async (filePath: string): Promise<ChatGPTResponse> => {
    try {
        // Read the file content from the provided file path
        const fileContent = await fs.readFile(filePath, 'utf-8');
        console.log('File content being sent to ChatGPT:', fileContent);  // Log the file content

        const response = await client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `
                            You are a localization assistant. Your task is to immediately process the file content provided by the user. Specifically:
                                1. Add the delimiter "---T components---" at the very beginning of the file content.
                                2. At the end of the file content, add the delimiter "---KEYS---" followed by a JSON structure with the key names, descriptions, and translations.
                                3. Replace all plain text strings with Tolgee's <T> component for localization.
                                        - In the <T> component, only use the keyName attribute (without descriptions). The keyName should have words separated by dashes (-).
                               
                                4. Generate a JSON structure that includes:
                                        1. "name" (with underscores instead of dashes).
                                        2. "description" (based on the text's context).
                                        3. "translations" (with "en" containing the original text).
                        `,
                    },
                    {
                        role: "user",
                        content: `
                            Here is the file content that needs to be processed:
                            ${fileContent}
                            
                            Instructions:
                            1. Add the delimiter "---T components---" at the very beginning of the file content.
                            2. Add the delimiter "---KEYS---" at the very end of the file content.
                            3. Replace plain text strings with the <T> component, using key names with dashes (-).
                            4. Do not include a description in the <T> component.
                            5. Add descriptions in the JSON output, not in the <T> component.
                            6. After "---KEYS---" delimiter, generate a JSON list with key names (using underscores), descriptions, and translations (English as "en").
                        `,
                    },
                ],
                max_tokens: 1024,
            }
        );

        console.log('Full response from Azure OpenAI:', response); // Log the full response

        // Extract the file content and keys separately from the response
        const responseText = response.choices[0]?.message.content; // Full response text

        if (!responseText) {
            console.error('No updated content received from Azure OpenAI.');
            return {
                updatedContent: "",
                createdKeys: [],
            };
        }

        console.log(
            "Full response text with delimiters from Azure OpenAI:",
            responseText
        ); // Log the full response text

        // Extract the content between the delimiters
        const componentsStart = responseText.indexOf("---T components---") + "---T components---".length;
        const componentsEnd = responseText.indexOf("---KEYS---");
        const fileContentWithComponents = responseText.substring(componentsStart, componentsEnd).trim();

        console.log('Updated content with <T> components:', fileContentWithComponents); // Log the updated content

        const responseParts = responseText?.split('---KEYS---'); // Split the response at a marker like `---KEYS---`
        if (!responseParts) {
            console.error("Failed to split the response text.");
            return {
                updatedContent: "",
                createdKeys: [],
            };
        }

        const keyListString = responseParts[1];  // The JSON-like string for the key list
        if (!keyListString) {
            console.error("Failed to access list of keys.");
            return {
                updatedContent: "",
                createdKeys: [],
            };
        }
        console.log("Key list string from ChatGPT:", keyListString); // Log the raw key list string


        // Parse the key list from the response
        let createdKeys: { keyName: string; description: string; translations: { en: string } }[] = [];
        try {
            createdKeys = extractCreatedKeys(keyListString); // Parse the list of keys
            console.log("Parsed created keys:", createdKeys); // Log the parsed list of keys
        } catch (error) {
            console.error("Failed to parse the list of keys from ChatGPT response.");
            createdKeys = [];
        }

        return {
            updatedContent: fileContentWithComponents,
            createdKeys,
        };
    } catch (error) {
        console.error(`Error during ChatGPT request processing for ${filePath}: ${error}`);
        return {
            updatedContent: "",
            createdKeys: [],
        };
    }
};
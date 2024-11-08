import Handlebars from "handlebars";
import * as fs from "node:fs";
import * as path from "node:path";

export function getPrompts({
  fileContent,
  promptAppendix,
}: {
  fileContent: string;
  promptAppendix: string;
}) {
  const systemPrompt = getSystemPrompt();

  // Append the promptAppendix if provided
  const completeSystemPrompt = promptAppendix
    ? `${systemPrompt}\n\nAdditional Instructions:\n${promptAppendix}`
    : systemPrompt;

  const userPrompt = getUserPrompt({ fileContent });

  return { completeSystemPrompt, userPrompt };
}

function getPromptContents(fileName: string) {
  return fs.readFileSync(
    path.resolve(__dirname, "prompts", "react", fileName),
    "utf8",
  );
}

function getSystemPrompt() {
  const systemTemplateRaw = getPromptContents("system.handlebars");
  const systemTemplate = Handlebars.compile(systemTemplateRaw);
  return systemTemplate({});
}

function getUserPrompt(props: { fileContent: string }) {
  const systemTemplateRaw = getPromptContents("user.handlebars");
  const systemTemplate = Handlebars.compile(systemTemplateRaw);
  return systemTemplate(props);
}

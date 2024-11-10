import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
import { PresetType } from './PresetType';

export function buildNativePreset(name: string): PresetType {
  function getPromptContents(fileName: string) {
    return fs.readFileSync(path.resolve(__dirname, name, fileName), 'utf8');
  }

  function getSystemPrompt() {
    const systemTemplateRaw = getPromptContents('system.handlebars');
    const systemTemplate = Handlebars.compile(systemTemplateRaw);
    return systemTemplate({});
  }

  function getUserPrompt(props: { fileContent: string }) {
    const systemTemplateRaw = getPromptContents('user.handlebars');
    const systemTemplate = Handlebars.compile(systemTemplateRaw);
    return systemTemplate(props);
  }

  return {
    name,
    getUserPrompt,
    getSystemPrompt,
  };
}

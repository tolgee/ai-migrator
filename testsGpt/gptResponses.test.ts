import { FileProcessor } from "../src/FileProcessor";
import * as path from "node:path";
import { buildNativePreset } from "../src/presets/buildNativePreset";

describe("Chat GPT", () => {
  const fileProcessor = FileProcessor(buildNativePreset("react"));

  it(
    "correctly uses T component",
    async () => {
      const result = await fileProcessor.processFile(
        path.resolve(__dirname + "/exampleFiles/simple.tsx.txt"),
      );
      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].name).toBe("welcome-message");
      expect(result.keys[0].description.length).toBeGreaterThan(10);
      expect(result.keys[0].default).toBe("Welcome!");
      expect(result.newFileContents).toBe(
        "import { T } from '@tolgee/react';\n" +
          "\n" +
          "export const WelcomeMessage = () => {\n" +
          '  return <div><T keyName="welcome-message" /></div>;\n' +
          "};\n",
      );
    },
    60 * 1000,
  );

  it(
    "correctly uses useTranslate hook",
    async () => {
      const result = await fileProcessor.processFile(
        path.resolve(__dirname + "/exampleFiles/useTranslate.tsx.txt"),
      );
      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].name).toContain("password");
      expect(result.keys[0].name).toContain("placeholder");
      expect(result.keys[0].description.length).toBeGreaterThan(10);
      expect(result.keys[0].default).toBe("New password");
      expect(result.newFileContents).toContain("const { t } = useTranslate();");
      expect(result.newFileContents).toContain("t('new-password-");
    },
    60 * 1000,
  );
});

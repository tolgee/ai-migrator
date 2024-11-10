import { PresetType } from "../src/presets/PresetType";
import { validatePreset } from "../src/commands/migrate/addMigrationCommand";
import { createProgram } from "../src/program";
import path from "node:path";
import { ZodError } from "zod";
import Mock = jest.Mock;
import {FilesMigrator} from "../src/commands/migrate/FilesMigrator";

jest.mock("fast-glob");
jest.mock("../src/commands/migrate/FilesMigrator");

describe("presets", () => {
  it("preset argument should work", async () => {
    runWithPreset("my-preset.js");
    expect(FilesMigrator).toHaveBeenCalledTimes(1);
    const calls = (FilesMigrator as Mock<any>).mock.calls;
    const preset = calls[0][0].preset as PresetType;
    expect(() => {
      validatePreset(preset);
    }).not.toThrow();
  });

  it("fails on invalid preset", async () => {
    await expect(async () => {
      try {
        await runWithPreset("invalid-preset.js");
      } catch (e) {
        const zodError = e as ZodError;
        const message = zodError.message;
        expect(message).toContain("invalid_type");
        expect(message).toContain("getUserPrompt");
        throw e;
      }
    }).rejects.toThrow(expect.any(ZodError));
  });
});

async function runWithPreset(preset: string) {
  const program = createProgram();
  const presetPath = path.resolve(__dirname, "fixtures", preset);
  await program.parseAsync([
    "npx",
    "tolgee-migrator",
    "migrate",
    "--preset",
    presetPath,
  ]);
}

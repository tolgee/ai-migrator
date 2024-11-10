import { createProgram } from "../src/program";
import logger from "../src/utils/logger";

jest.mock("openai");
jest.mock("fast-glob");
jest.mock("fs-extra");
jest.mock("child_process");
jest.mock("../src/responseProviders/OpenAiResponseProvider");

import * as child_process from "child_process";
import fsExtra from "fs-extra";
import glob from "fast-glob";
import { OpenAiResponseProvider } from "../src/responseProviders/OpenAiResponseProvider";
import { ChatGptResponse } from "../src/responseProviders/responseFormat";
import { ResponseProvider } from "../src/responseProviders/ResponseProvider";

const mockedFilePaths = ["dummyFilepath.tsx", "dummyFilepath2.tsx"];

/**
 * This is integration test for the whole migration process.
 * It mocks only the necessary parts.
 */
describe("migration", () => {
  jest.spyOn(logger, "info");
  it("migrates correctly", async () => {
    const { mockedFs } = initMocks();

    await run();

    expect(mockedFs.writeFile).toHaveBeenCalledWith(
      "dummyFilepath.tsx",
      "newFileContents",
    );
    expect(mockedFs.writeFile).not.toHaveBeenCalledWith(
      "dummyFilepath2.tsx",
      "newFileContents",
    );
    expect(mockedFs.writeFile.mock.calls[2][1]).toEqual(
      JSON.stringify(resultingMigrationStatus, undefined, 2),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Migration completed"),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Processed file: dummyFilepath2.tsx"),
    );

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Processed file: dummyFilepath.tsx"),
    );
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("✅ 2/2"));
  });
});

async function run() {
  const program = createProgram();
  await program.parseAsync([
    "npx",
    "tolgee-migrator",
    "migrate",
    "--preset",
    "react",
    "-k dummy_api_key",
  ]);
}

const dummyOpenAiResponse: ChatGptResponse = {
  newFileContents: "newFileContents",
  keys: [
    {
      name: "key1",
      description: "description1",
      default: "default1",
    },
  ],
};

const emptyOpenAiResponse: ChatGptResponse = {
  newFileContents: "newFileContents",
  keys: [],
};

const resultingMigrationStatus = {
  "dummyFilepath2.tsx": {
    migrated: true,
    keys: [],
  },
  "dummyFilepath.tsx": {
    migrated: true,
    keys: [
      {
        name: "key1",
        description: "description1",
        default: "default1",
      },
    ],
  },
};

function initMocks() {
  jest.mocked(child_process).execSync.mockReturnValue("");
  jest.mocked(glob).mockResolvedValue(mockedFilePaths);

  mockAiResponseProvider();

  const mockedFs = jest.mocked(fsExtra.promises);
  mockReadFile(mockedFs);

  return {
    mockedFs,
  };
}

function mockReadFile(mockedFs: jest.Mocked<typeof fsExtra.promises>) {
  mockedFs.readFile.mockImplementation(async (filePath) => {
    const isString = typeof filePath === "string";
    if (!isString) {
      throw new Error("Unexpected file read, missing mocked implementation");
    }
    if (mockedFilePaths.includes(filePath)) {
      return `${filePath} fileContent`;
    }
    if (isString && filePath.includes("migration-status.json")) {
      return "{}";
    }
    throw new Error("Unexpected file read, missing mocked implementation");
  });
}

function mockAiResponseProvider() {
  const MockedResponseProvider = jest.mocked(OpenAiResponseProvider);
  const getResponseMock: ResponseProvider["getResponse"] = jest.fn(
    async ({ fileContent, promptAppendix }) => {
      if (fileContent.includes("dummyFilepath.tsx")) {
        return JSON.stringify(dummyOpenAiResponse);
      }
      if (fileContent.includes("dummyFilepath2.tsx")) {
        return JSON.stringify(emptyOpenAiResponse);
      }
      throw new Error("Unexpected file content for mock");
    },
  );
  MockedResponseProvider.mockReturnValue({
    getResponse: getResponseMock,
  });
}

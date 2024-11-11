import { uploadKeysToTolgee } from "../src/uploadKeysToTolgee";
import axios, { AxiosResponse } from "axios";
import { TolgeeProjectClient } from "../src/common/client/TolgeeProjectClient";
import fsExtra from "fs-extra";

jest.mock("axios");
jest.mock("fs-extra");

function mockServer() {
  jest.mocked(axios).request.mockImplementation(async (config) => {
    if (config.url?.endsWith("projects/1000") && config.method === "GET") {
      return {
        data: { baseLanguage: { tag: "cs-CZ" } },
      } as AxiosResponse;
    }
  });
}

function mockMigrationStatusFile() {
  jest
    .mocked(fsExtra.promises.readFile)
    .mockImplementation(async (filePath) => {
      if ((filePath as string).includes("migration-status.json")) {
        return JSON.stringify(mockedMigrationStatus);
      }
      throw new Error("Unexpected file read, missing mocked implementation");
    });
}

describe("uploadKeysToTolgee", () => {
  it("should upload keys to the Tolgee API", async () => {
    mockServer();
    mockMigrationStatusFile();

    await uploadKeysToTolgee(client);

    expect(axios.request).toHaveBeenCalledWith(
      // custom argumen matcher
      expect.objectContaining({
        url: "https://dummy.tolgee.io/v2/projects/1000/keys/import",
        method: "POST",
        data: {
          keys: [
            {
              name: "key1",
              description: "description1",
              translations: { "cs-CZ": "default1" },
            },
          ],
        },
      }),
    );
  });
});

const client = TolgeeProjectClient({
  apiKey: "dummy_api_key",
  apiUrl: "https://dummy.tolgee.io",
  projectId: 1000,
});

const mockedMigrationStatus = {
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

import {
  updateMigrationStatus,
  loadMigrationStatus,
  checkMigrationStatus,
} from "../src/migrationStatus";
import fsExtra from "fs-extra";

// Mock fs-extra and fs
jest.mock("fs-extra", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  pathExists: jest.fn(),
}));

describe("migrationStatus", () => {
  const mockStatus = {
    "file1.tsx": {
      migrated: true,
      relevantKeys: ["key1", "key2"],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  it("should load migration status from a JSON file", async () => {
    (fsExtra.pathExists as jest.Mock).mockResolvedValue(true);
    (fsExtra.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockStatus),
    );

    const status = await loadMigrationStatus();

    expect(fsExtra.pathExists).toHaveBeenCalledWith("./migration-status.json"); // Ensure pathExists is called with the correct path
    expect(status).toEqual(mockStatus);
  });

  it("should return an empty object when the file does not exist", async () => {
    // Mock fsExtra.pathExists to return false (file does not exist)
    (fsExtra.pathExists as jest.Mock).mockResolvedValue(false);

    const status = await loadMigrationStatus();

    expect(fsExtra.pathExists).toHaveBeenCalledWith("./migration-status.json");
    expect(status).toEqual({}); // Expect an empty object when the file doesn't exist
  });

  it("should update migration status in the JSON file", async () => {
    // Mock the current status as being empty initially
    (fsExtra.pathExists as jest.Mock).mockResolvedValue(true);
    (fsExtra.promises.readFile as jest.Mock).mockResolvedValue("{}");

    const relevantKeys = ["key1", "key2"];
    await updateMigrationStatus("file1.tsx", relevantKeys, true);

    const expectedStatus = {
      "file1.tsx": {
        migrated: true,
        relevantKeys,
      },
    };

    expect(fsExtra.promises.writeFile).toHaveBeenCalledWith(
      "./migration-status.json",
      JSON.stringify(expectedStatus, null, 2),
      "utf8",
    );
  });

  it("should handle empty files when loading migration status", async () => {
    // Mock fsExtra.pathExists to return true
    (fsExtra.pathExists as jest.Mock).mockResolvedValue(true);
    // Mock fs.readFile to return an empty string (simulating an empty file)
    (fsExtra.promises.readFile as jest.Mock).mockResolvedValue("");

    const status = await loadMigrationStatus();

    expect(status).toEqual({}); // Expect an empty object when the file is empty
  });

  it("should check migration status for a specific file", async () => {
    (fsExtra.pathExists as jest.Mock).mockResolvedValue(true);
    (fsExtra.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockStatus),
    );

    // Call the function to check the migration status
    await checkMigrationStatus("file1.tsx");

    // Assert that the mocked console.log was called with the expected message
    expect(console.log).toHaveBeenCalledWith(
      `Migration status for file1.tsx:`,
      mockStatus["file1.tsx"],
    );
  });

  it("should display a message when a file is not migrated", async () => {
    (fsExtra.pathExists as jest.Mock).mockResolvedValue(true);
    (fsExtra.promises.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify(mockStatus),
    );

    // Call the function with a file that hasn't been migrated
    await checkMigrationStatus("file2.tsx");

    // Assert that the mocked console.log was called with the correct message
    expect(console.log).toHaveBeenCalledWith(
      "file2.tsx has not been migrated yet.",
    );
  });

  it("should handle errors when updating migration status", async () => {
    (fsExtra.promises.writeFile as jest.Mock).mockRejectedValue(
      new Error("Write error"),
    );

    const relevantKeys = ["key1", "key2"];
    await updateMigrationStatus("file1.tsx", relevantKeys, false);

    // Assert that the mocked console.error was called with the correct error message
    expect(console.error).toHaveBeenCalledWith(
      "Error updating migration status:",
      expect.any(Error),
    );
  });
});

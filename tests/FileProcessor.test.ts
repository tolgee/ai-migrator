import { RateLimitError } from "openai";
import { FileProcessor } from "../src/FileProcessor";
import { buildNativePreset } from "../src/presets/buildNativePreset";
import { OpenAiResponseProvider } from "../src/responseProviders/OpenAiResponseProvider";
import { sleep } from "../src/common/sleep";

jest.mock("../src/responseProviders/OpenAiResponseProvider");
jest.mock("fs-extra", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));
jest.mock("../src/common/sleep");

describe("File processor test", () => {
  it("retries on JSON when syntax error", async () => {
    const MockedResponseProvider = jest.mocked(OpenAiResponseProvider);

    const getResponseMock = jest.fn(async () => "res");
    MockedResponseProvider.mockReturnValue({
      getResponse: getResponseMock,
    });

    const fileProcessor = FileProcessor(buildNativePreset("react"), {
      openAiApiKey: "dummy",
    });

    await expect(async () => {
      await fileProcessor.processFile("dummyFilepath", "");
    }).rejects.toThrow(SyntaxError);
    expect(getResponseMock).toHaveBeenCalledTimes(3);
  });

  it("retries on rate limit exceeded", async () => {
    const MockedResponseProvider = jest.mocked(OpenAiResponseProvider);

    const getResponseMock = jest.fn(() => {
      throw new RateLimitError(429, undefined, undefined, undefined);
    });
    MockedResponseProvider.mockReturnValue({
      getResponse: getResponseMock,
    });

    const fileProcessor = FileProcessor(buildNativePreset("react"), {
      openAiApiKey: "dummy",
    });

    const mockedSleep = jest.mocked(sleep);

    let resolve: (() => void) | null = null;

    mockedSleep.mockImplementation(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );

    fileProcessor.processFile("dummyFilepath", "");

    await afterEventLoopCycle();

    expect(getResponseMock).toHaveBeenCalledTimes(1);

    resolve!();

    await afterEventLoopCycle();

    expect(getResponseMock).toHaveBeenCalledTimes(2);
  });
});

function afterEventLoopCycle() {
  return new Promise((resolve) => setImmediate(resolve));
}

import { Key } from "./responseProviders/responseFormat";
import fsExtra from "fs-extra";
import { getFilePaths } from "./FilePaths";
import { AllKeysFile } from "./saveAllKeys";
import { TolgeeProjectClientType } from "./common/client/TolgeeProjectClient";

export const uploadKeysToTolgee = async (client: TolgeeProjectClientType) => {
  const { allKeysFilePath } = getFilePaths();

  const keys = (await fsExtra.readJson(allKeysFilePath)) as AllKeysFile;

  const allKeys = Object.values(keys).flat() as Key[];

  const baseLanguageTag = await client.getBaseLanguageTag();

  const formattedKeys = allKeys.map((key) => ({
    name: key.name,
    description: key.description,
    translations: { [baseLanguageTag]: key.default }, // English as default translation
  }));

  await client.importKeys(formattedKeys);
};

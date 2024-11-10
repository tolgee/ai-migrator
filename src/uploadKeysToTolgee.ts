import { TolgeeProjectClientType } from './common/client/TolgeeProjectClient';
import { loadMigrationStatus } from './migrationStatus';

export const uploadKeysToTolgee = async (client: TolgeeProjectClientType) => {
  const status = await loadMigrationStatus();

  const allKeys = Object.values(status)
    .map((fileStatus) => fileStatus.keys)
    .flat();

  const baseLanguageTag = await client.getBaseLanguageTag();

  const formattedKeys = allKeys.map((key) => ({
    name: key.name,
    description: key.description,
    translations: { [baseLanguageTag]: key.default }, // English as default translation
  }));

  await client.importKeys(formattedKeys);
};

import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getProjectIdFromApiKey } from "./decodeApiKey";

export function TolgeeProjectClient(authProps: AuthProps) {
  const headers = {
    "X-API-Key": authProps.apiKey,
  };

  async function importKeys(keys: any) {
    await request({
      url: getUrl({ ...authProps, projectEndpoint: "keys/import" }),
      method: "POST",
      data: { keys },
      headers,
    });
  }

  async function getBaseLanguageTag() {
    const response = await request({
      url: getUrl({ ...authProps, projectEndpoint: "" }),
      method: "GET",
      headers,
    });

    return response.data["baseLanguage"]["tag"];
  }

  return {
    importKeys,
    getBaseLanguageTag,
  };
}

export type TolgeeProjectClientType = ReturnType<typeof TolgeeProjectClient>;

type AuthProps = {
  apiKey: string;
  apiUrl: string;
  projectId: string | number;
};

function getUrl({
  apiUrl,
  projectId,
  apiKey,
  projectEndpoint,
}: AuthProps & { projectEndpoint: string }) {
  apiUrl = apiUrl || "https://app.tolgee.io";
  const baseUrl = new URL(apiUrl);
  const origin = baseUrl.origin;

  // we can use passed projectId or try to get it from apiKey
  projectId = getProjectId({ apiKey, passedProjectId: projectId });
  const endpointPath = projectEndpoint ? `/${projectEndpoint}` : "";
  return `${origin}/v2/projects/${projectId}${endpointPath}`;
}

function getProjectId(props: { apiKey: string; passedProjectId: string | number }) {
  if (props.passedProjectId) {
    return props.passedProjectId;
  }

  const fromApiKey = getProjectIdFromApiKey(props.apiKey);

  if (fromApiKey) {
    return fromApiKey;
  }

  throw new Error(
    "Cannot determine project ID. Please provide it using projectId or Project API key",
  );
}

async function request(request: AxiosRequestConfig) {
  try {
    return await axios.request(request);
  } catch (e) {
    if (e instanceof AxiosError) {
      throw new ClientError(e);
    }
    throw e;
  }
}

class ClientError extends Error {
  constructor(public error: AxiosError) {
    const message =
      `HTTP request failed with status ${error.status}\n` +
      `Request: ${error.config?.method}: ${error.config?.url}\n` +
      `Response Body: ${JSON.stringify(error.response?.data, null, 2)}`;
    super(message);
  }
}

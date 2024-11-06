import { getResponseProvider } from "./responseProviders/getResponseProvider";
import { GetResponseProps } from "./responseProviders/ResponseProvider";
import { ProviderOptions } from "./responseProviders/getResponseProvider";

export function getOpenAiResponse(
  props: GetResponseProps,
  options: ProviderOptions,
) {
  const responseProvider = getResponseProvider(options);
  return responseProvider.getResponse(props);
}

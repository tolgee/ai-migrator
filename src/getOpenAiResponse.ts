import { getResponseProvider } from "./responseProviders/getResponseProvider";
import { GetResponseProps } from "./responseProviders/ResponseProvider";

export function getOpenAiResponse(props: GetResponseProps) {
  const responseProvider = getResponseProvider();
  return responseProvider.getResponse(props);
}

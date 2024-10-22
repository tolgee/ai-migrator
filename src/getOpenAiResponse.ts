import { getResponseProvider } from "./repsponseProviders/getResponseProvider";
import { GetResponseProps } from "./repsponseProviders/ResponseProvider";

export function getOpenAiResponse(props: GetResponseProps) {
  const responseProvider = getResponseProvider();
  return responseProvider.getResponse(props);
}

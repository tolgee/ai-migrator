export interface ResponseProvider {
  getResponse(props: GetResponseProps): Promise<string | null>;
}

export type GetResponseProps = {
  fileContent: string;
  promptAppendix: string;
};

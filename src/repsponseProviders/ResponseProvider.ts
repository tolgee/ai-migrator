export interface ResponseProvider {
  getResponse(props: GetResponseProps): Promise<string | null | undefined>;
}

export type GetResponseProps = {
  fileContent: string;
  promptAppendix: string;
};

export type ManifestFile = {
  path: string;
  url: string;
  hash?: string;
  size?: number;
  required?: boolean;
};

export type ManifestPayload = {
  version: string;
  files?: ManifestFile[];
  configs?: ManifestFile[];
  kubejs?: ManifestFile[];
};

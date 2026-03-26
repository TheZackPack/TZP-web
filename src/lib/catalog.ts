import type { ManifestFile } from "@/lib/types";

const MOD_FILE_PREFIX = "mods/";

function humanizeSlug(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function deriveModCatalogEntries(
  packVersion: string,
  files: ManifestFile[],
): Array<{
  modId: string;
  displayName: string;
  fileName: string;
  packVersion: string;
}> {
  return files
    .filter((entry) => entry.path.startsWith(MOD_FILE_PREFIX))
    .map((entry) => {
      const fileName = entry.path.slice(MOD_FILE_PREFIX.length);
      const baseName = fileName.replace(/\.jar$/i, "");
      const modId = baseName
        .replace(/-[0-9].*$/, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .toLowerCase();

      return {
        modId,
        displayName: humanizeSlug(baseName.replace(/-[0-9].*$/, "")),
        fileName,
        packVersion,
      };
    });
}

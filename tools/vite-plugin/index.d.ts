import type { Plugin } from "vite";

export interface RoturPermissionsOptions {
  tsConfigFilePath?: string;
  include?: string[];
  extraPermissions?: string[];
  verbose?: boolean;
}

export default function roturPermissions(
  options?: RoturPermissionsOptions,
): Plugin & { getComputedPermissions(): string[] };

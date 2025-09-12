import { KlingImageModelId, KlingImageSettings } from "./kling-image-settings";

import type { FetchFunction } from "@ai-sdk/provider-utils";
import { KlingImageModel } from "./kling-image-model";
import { loadSetting } from "@ai-sdk/provider-utils";

export interface KlingProviderSettings {
  accessKey?: string;
  secretKey?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  fetch?: FetchFunction;
}

export interface KlingProvider {
  image(
    modelId: KlingImageModelId,
    settings?: KlingImageSettings
  ): KlingImageModel;
}

export function createKling(
  options: KlingProviderSettings = {}
): KlingProvider {
  const loadAccessKey = () =>
    loadSetting({
      settingValue: options.accessKey,
      settingName: "accessKey",
      environmentVariableName: "KLING_ACCESS_KEY",
      description: "Kling access key",
    });

  const loadSecretKey = () =>
    loadSetting({
      settingValue: options.secretKey,
      settingName: "secretKey",
      environmentVariableName: "KLING_SECRET_KEY",
      description: "Kling secret key",
    });

  return {
    image: (modelId: KlingImageModelId, settings?: KlingImageSettings) => {
      return new KlingImageModel(modelId, settings ?? {}, {
        accessKey: loadAccessKey(),
        secretKey: loadSecretKey(),
        provider: "kling",
        baseURL: options.baseURL ?? "https://api.klingai.com",
        headers: {
          ...options.headers,
        },
        fetch: options.fetch,
      });
    },
  };
}

export const kling = createKling();

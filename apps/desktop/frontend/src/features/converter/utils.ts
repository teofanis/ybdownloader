import type { ConversionPreset } from "./types";

export function getCategoryLabel(
  category: string,
  t: (key: string) => string
): string {
  const key = `converter.categories.${category}`;
  const translated = t(key);
  return translated === key ? category : translated;
}

export function getPresetName(
  preset: ConversionPreset,
  t: (key: string) => string
): string {
  const key = `converter.presetNames.${preset.id}`;
  const translated = t(key);
  return translated === key ? preset.name : translated;
}

export function getPresetDescription(
  preset: ConversionPreset,
  t: (key: string) => string
): string {
  const key = `converter.presetDescriptions.${preset.id}`;
  const translated = t(key);
  return translated === key ? preset.description : translated;
}

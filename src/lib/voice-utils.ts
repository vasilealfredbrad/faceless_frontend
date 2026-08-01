import { VOICE_LANGUAGES, PickerVoice } from "./voices.gen";

const byId = new Map<string, PickerVoice>();
for (const lang of VOICE_LANGUAGES) {
  for (const v of lang.voices) byId.set(v.id, v);
}

/** Display name for a voice key (id from the picker, or a legacy name). */
export function voiceName(key: string): string {
  return byId.get(key)?.name || key;
}

/** Voices of one language, split into Female/Male groups for the picker. */
export function voiceGroupsFor(code: string): { group: string; voices: PickerVoice[] }[] {
  const lang = VOICE_LANGUAGES.find((l) => l.code === code);
  if (!lang) return [];
  const female = lang.voices.filter((v) => v.gender === "female");
  const male = lang.voices.filter((v) => v.gender === "male");
  const groups = [];
  if (female.length) groups.push({ group: "Female", voices: female });
  if (male.length) groups.push({ group: "Male", voices: male });
  return groups;
}

/** Jameson (en) — the app default. */
export const DEFAULT_VOICE_ID = "a5136bf9-224c-4d76-b823-52bd5efcffcc";

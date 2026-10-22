// Senaryo istemi kişileri `"mill" (AURA-9)` biçiminde tanıtır; Gemini bu biçimi gerçek metnine ve rol
// metinlerine aynen kopyalıyordu ("'mill' (AURA-9)", "Lin Feng ('tavern')"). Üretilen metinlerdeki iç
// kimlikler karakterin adına çevrilir; oyuncu kodun kimliklerini hiç görmez.

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const QUOTE = `['"‘’“”]?`;

export function cleanInternalIds(
  text: string,
  npcNames: Record<string, string>,
): string {
  let result = text;
  for (const [id, name] of Object.entries(npcNames)) {
    const idPart = `${QUOTE}\\b${escape(id)}\\b${QUOTE}`;
    const namePart = escape(name);
    result = result
      // 'mill' (AURA-9) → AURA-9
      .replace(new RegExp(`${idPart}\\s*\\(\\s*${namePart}\\s*\\)`, 'gi'), name)
      // AURA-9 ('mill') → AURA-9
      .replace(new RegExp(`${namePart}\\s*\\(\\s*${idPart}\\s*\\)`, 'gi'), name)
      // Tek başına kalan kimlik: 'mill' kimliğiyle bilinen → AURA-9 kimliğiyle bilinen
      .replace(new RegExp(idPart, 'gi'), name);
  }
  return result
    .replace(new RegExp(`${QUOTE}\\bcrime_scene\\b${QUOTE}`, 'gi'), 'olay yeri')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

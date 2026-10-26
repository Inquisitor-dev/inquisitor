import { isPlanSound } from '../scenarios/case-setup';
import { WEAPONS } from '../scenarios/case-catalog';
import {
  getScenarioConfig,
  normalizeScenarioType,
} from '../scenarios/scenario-config';
import { mentions } from '../npcs/case-statements';
import { StoryPackage, validateV2StoryPackage } from './story-package';

// Havuza girecek hikâye paketinin kod doğrulaması (yapay zekâ çağrılmaz). Üretim komutu her paketi
// hakemden önce buradan geçirir; hatası olan paket reddedilir, uyarısı olan insana gider.
//   1. Eksik alan: Vaka Motoru v2 alanları (story-package.ts validateV2StoryPackage)
//   2. Plana uyum: her şüphelinin rolü, her mekânın ipucu, her masumun mazereti ve bağı yazılmış mı;
//      plan, gerçekler ve metinler aynı katili ve aynı v2 ayrıntılarını mı söylüyor
//   3. Katilin erken sızması: oyunun başında okunan vaka metni (scenario) katili ya da kurbanın adını vermemeli
//   4. Çözücü: plan oyunun kurallarıyla (2 arama izni, en az emek, iki bağımsız yol) hâlâ çözülebilir mi

export interface StoryValidation {
  valid: boolean;
  errors: string[];
  // İnsanın bakması gereken ama paketi tek başına geçersiz kılmayan durumlar
  warnings: string[];
}

const filled = (text: unknown) =>
  typeof text === 'string' && text.trim() !== '';

export function validateStoryPackage(raw: unknown): StoryValidation {
  const fieldCheck = validateV2StoryPackage(raw);
  if (!fieldCheck.valid) {
    return { valid: false, errors: fieldCheck.errors, warnings: [] };
  }
  const pkg = raw as StoryPackage;
  const errors: string[] = [];
  const warnings: string[] = [];
  const { plan, facts, draft } = pkg;

  const config = getScenarioConfig(
    pkg.scenarioType,
    pkg.difficulty,
    plan.crimeSceneId,
  );
  const nameOf = (id: string) =>
    config.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;
  const suspectIds = config.npcDefinitions.map((npc) => npc.id);
  const locationIds = config.locationDefinitions.map((l) => l.id);

  // --- Plana uyum ---
  const cast = [plan.culpritId, ...plan.innocentIds];
  if (
    cast.length !== suspectIds.length ||
    !suspectIds.every((id) => cast.includes(id))
  ) {
    errors.push(
      `Plandaki kadro (${cast.join(', ')}) bu zorluğun şüphelileriyle (${suspectIds.join(', ')}) aynı değil.`,
    );
  }
  if (facts.culpritId !== plan.culpritId)
    errors.push('facts.culpritId plandaki katille aynı değil.');
  if (draft.culpritId && draft.culpritId !== plan.culpritId)
    errors.push('draft.culpritId plandaki katille aynı değil.');
  for (const key of [
    'weaponId',
    'motive',
    'timeOfDeath',
    'murderStyle',
    'crimeSceneId',
  ] as const) {
    if (facts[key] !== plan[key])
      errors.push(`facts.${key} plandakiyle aynı değil.`);
  }
  if (!config.crimeScene)
    errors.push(`Olay yeri bu evrende yok: ${plan.crimeSceneId}.`);
  if (
    !WEAPONS[normalizeScenarioType(pkg.scenarioType)].some(
      (w) => w.id === plan.weaponId,
    )
  ) {
    errors.push(`Silah bu evrenin kataloğunda yok: ${plan.weaponId}.`);
  }

  for (const id of suspectIds) {
    if (!filled(draft.npcPrompts?.[id]))
      errors.push(`${nameOf(id)} için rol metni (npcPrompts.${id}) yok.`);
    if (typeof plan.fearThresholds?.[id] !== 'number')
      errors.push(`${nameOf(id)} için korku eşiği yok.`);
  }
  for (const id of locationIds) {
    if (!filled(draft.locationClues?.[id]))
      errors.push(`Mekân ipucu (locationClues.${id}) yok.`);
  }
  for (const id of plan.innocentIds) {
    if (!filled(facts.alibis?.[id]))
      errors.push(`${nameOf(id)} için mazeret (alibis.${id}) yok.`);
    const links = (plan.involvements ?? []).filter((inv) => inv.npcId === id);
    if (links.length !== 1)
      errors.push(
        `${nameOf(id)} için cinayetle bağ ${links.length === 0 ? 'yok' : 'birden fazla'}.`,
      );
  }
  if ((plan.involvements ?? []).some((inv) => inv.npcId === plan.culpritId))
    errors.push('Katilin cinayetle "masum bağı" olmamalı.');
  if (!filled(facts.verificationText))
    errors.push('Doğrulayan kanıt metni (verificationText) yok.');
  if (!filled(facts.crimeSceneClueText))
    errors.push('Olay yeri izi (crimeSceneClueText) yok.');
  if (
    plan.verification.witnessDescriptionFits?.length &&
    !filled(facts.witnessDescription)
  ) {
    errors.push('Tanığın eşkâli (witnessDescription) yok.');
  }
  if (!filled(facts.victim?.profession)) errors.push('Kurbanın mesleği yok.');
  // Örtü hikâyesi olmayan hikâyede katil kırılmaz; kural sürümü 2 kalır ve oyun onu seçmez
  if (!filled(facts.culpritCover))
    warnings.push(
      'Katilin örtü hikâyesi (culpritCover) yok: katil kırılmaz, oyun bu hikâyeyi havuzdan seçmez.',
    );

  // --- Katilin erken sızması: vaka metni oyunun başında okunur ---
  const scenario = draft.scenario ?? '';
  if (facts.victim?.name && mentions(scenario, facts.victim.name))
    errors.push('Vaka metni (scenario) kurbanın adını veriyor.');
  if (mentions(scenario, nameOf(plan.culpritId))) {
    const named = plan.innocentIds.filter((id) =>
      mentions(scenario, nameOf(id)),
    );
    if (named.length === 0)
      errors.push(
        `Vaka metni (scenario) şüphelilerden yalnızca katili (${nameOf(plan.culpritId)}) anıyor.`,
      );
    else if (named.length < plan.innocentIds.length)
      warnings.push(
        `Vaka metni (scenario) katili (${nameOf(plan.culpritId)}) ve şüphelilerin yalnızca bir kısmını anıyor.`,
      );
  }

  // --- Çözücü ---
  if (errors.length === 0 && !isPlanSound(plan, pkg.difficulty)) {
    errors.push(
      'Çözücü: vaka 2 arama izniyle çözülemiyor, zorluğa yetecek emek istemiyor ya da tek bir kanıta bağlı.',
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

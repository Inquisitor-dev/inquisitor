import {
  INVOLVEMENT_LABELS,
  MOTIVE_LABELS,
  TIME_OF_DEATH_LABELS,
  WEAPONS,
} from '../scenarios/case-catalog';
import {
  getLocalizedLocationLabel,
  getScenarioConfig,
  normalizeScenarioType,
} from '../scenarios/scenario-config';
import type { StoryPackage } from './story-package';
import type { StoryReviewRecord } from './story-generation';

// İnsan onayı (prisma/story-approve.ts) için saf yardımcılar: kaydı okumak, onaylanabilirlik kuralı,
// kararı kayda eklemek ve hikâyeyi okunur hale getirmek.

export type StoryStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

// Story.reviewResults'ı güvenle okur; üretim komutundan geçmemiş eski kayıtlarda null
export function parseReviewRecord(raw: unknown): StoryReviewRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Partial<StoryReviewRecord>;
  if (!record.validation || typeof record.validation.valid !== 'boolean')
    return null;
  return record as StoryReviewRecord;
}

// Onay kuralı: kod doğrulamasından kalan hikâye hiçbir zaman onaylanmaz (oyunu bozar); hakemin
// reddettiği hikâye yalnızca --force ile onaylanır (hakem de yanılabilir); onaylı hikâye yeniden
// onaylanmaz. Doğrulama kaydı olmayan hikâye önce üretim komutundan geçmeli.
export function canApprove(
  status: StoryStatus,
  record: StoryReviewRecord | null,
  force = false,
): { ok: true } | { ok: false; reason: string } {
  if (status === 'APPROVED')
    return { ok: false, reason: 'Hikâye zaten onaylı.' };
  if (!record)
    return {
      ok: false,
      reason:
        'Hikâyenin doğrulama ve hakem kaydı yok; önce stories:generate ile denetlenmeli.',
    };
  if (!record.validation.valid)
    return {
      ok: false,
      reason: `Kod doğrulamasından kaldı: ${record.validation.errors.join(' ')}`,
    };
  if (status === 'REJECTED' && !force)
    return {
      ok: false,
      reason:
        'Hakem bu hikâyeyi reddetti. Bulgular yanlışsa --force ile onaylayabilirsin.',
    };
  return { ok: true };
}

export function withDecision(
  record: StoryReviewRecord | null,
  decision: NonNullable<StoryReviewRecord['decision']>,
): StoryReviewRecord | { decision: StoryReviewRecord['decision'] } {
  return record ? { ...record, decision } : { decision };
}

// Kısa kimlik: listede ilk 8 karakter gösterilir; komutlarda bu önek yeter
export function resolveStoryId(
  prefix: string,
  ids: string[],
): { id: string } | { error: string } {
  const matches = ids.filter((id) => id.startsWith(prefix));
  if (matches.length === 1) return { id: matches[0] };
  return {
    error:
      matches.length === 0
        ? `"${prefix}" ile başlayan hikâye yok.`
        : `"${prefix}" birden fazla hikâyeye uyuyor; daha uzun yaz.`,
  };
}

// Onaylayanın okuyacağı özet: vaka gerçekleri, oyuncunun göreceği metinler, kodun ve hakemin notları
export function storySummary(
  pkg: StoryPackage,
  record: StoryReviewRecord | null,
): string {
  const { plan, facts, draft } = pkg;
  const config = getScenarioConfig(
    pkg.scenarioType,
    pkg.difficulty,
    plan.crimeSceneId,
  );
  const nameOf = (id: string) =>
    config.npcDefinitions.find((npc) => npc.id === id)?.name ?? id;
  const placeOf = (id: string) =>
    id === 'crime_scene'
      ? `Olay yeri (${config.crimeScene?.label ?? plan.crimeSceneId})`
      : getLocalizedLocationLabel(pkg.scenarioType, id);
  const weapon = WEAPONS[normalizeScenarioType(pkg.scenarioType)].find(
    (w) => w.id === plan.weaponId,
  );
  const roleOf = (id: string) => {
    if (id === plan.culpritId) return 'KATİL';
    const inv = plan.involvements?.find((i) => i.npcId === id);
    if (!inv) return 'masum';
    return `masum · ${INVOLVEMENT_LABELS[inv.kind]}${inv.aboutNpcId ? ` (${nameOf(inv.aboutNpcId)})` : ''}`;
  };
  const section = (title: string, body: string[]) =>
    `\n== ${title} ==\n${body.join('\n')}`;

  const out: string[] = [];
  out.push(
    section('Vaka', [
      `Evren: ${pkg.scenarioType} · Zorluk: ${pkg.difficulty}`,
      `Katil: ${nameOf(plan.culpritId)}`,
      `Kurban: ${facts.victim?.name ?? '-'} (${facts.victim?.profession ?? '-'})`,
      `Silah: ${weapon?.label ?? plan.weaponId ?? '-'} · Motif: ${plan.motive ? MOTIVE_LABELS[plan.motive] : '-'} · Ölüm saati: ${plan.timeOfDeath ? TIME_OF_DEATH_LABELS[plan.timeOfDeath] : '-'}`,
      `Cinayet: ${plan.murderStyle === 'HURRIED' ? 'aceleyle (iz gerçek)' : 'planlı (iz tuzak)'} · Olay yeri: ${config.crimeScene?.label ?? plan.crimeSceneId} (${plan.sceneState === 'MESSY' ? 'dağınık' : 'düzenli'})`,
    ]),
  );
  out.push(section('Vaka metni (oyuncu başta okur)', [draft.scenario]));
  out.push(section('Gerçek (oyun sonunda)', [draft.truthReveal]));
  out.push(
    section(
      'Karakterler',
      config.npcDefinitions.map(
        (npc) =>
          `- ${npc.name} [${roleOf(npc.id)}]${facts.alibis?.[npc.id] ? `\n  Mazeret: ${facts.alibis[npc.id]}` : ''}\n  Rol: ${draft.npcPrompts?.[npc.id] ?? '-'}`,
      ),
    ),
  );
  out.push(
    section(
      'Mekân ipuçları',
      config.locationDefinitions.map(
        (l) => `- ${placeOf(l.id)}: ${draft.locationClues?.[l.id] ?? '-'}`,
      ),
    ),
  );
  out.push(
    section('Doğrulayan kanıt', [
      facts.verificationText,
      ...(facts.witnessDescription
        ? [`Tanığın eşkâli: ${facts.witnessDescription}`]
        : []),
    ]),
  );

  if (record) {
    const { validation, review, tokens, decision } = record;
    out.push(
      section('Kod doğrulaması', [
        validation.valid ? 'Geçti.' : 'Kaldı.',
        ...validation.errors.map((e) => `- HATA ${e}`),
        ...validation.warnings.map((w) => `- UYARI ${w}`),
      ]),
    );
    out.push(
      section('Hakem', [
        review
          ? `Karar: ${review.verdict}${review.judged ? '' : ' (yapay zekâ hakemi çalışmadı)'}`
          : 'Hakeme gönderilmedi.',
        ...(review?.issues ?? []).map(
          (i) =>
            `- ${i.severity} ${i.category} [${i.field}] “${i.quote}” — ${i.note}`,
        ),
      ]),
    );
    out.push(
      section('Maliyet', [
        `Üretim ${tokens.generation} + hakem ${tokens.review} token`,
      ]),
    );
    if (decision)
      out.push(
        section('Karar', [
          `${decision.status} · ${decision.by} · ${decision.at}${decision.note ? `\nNot: ${decision.note}` : ''}`,
        ]),
      );
  }
  return out.join('\n');
}

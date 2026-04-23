import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Demo kullanıcı oluştur
  const demoUser = await prisma.user.upsert({
    where: { id: 'demo-user-001' },
    update: {},
    create: {
      id: 'demo-user-001',
      email: 'inquisitor@ashenmoor.ai',
      passwordHash: 'demo-hash-not-for-login',
    },
  });
  console.log(`  ✅ Demo user: ${demoUser.email}`);

  // 2. Demo game session oluştur
  const demoSession = await prisma.gameSession.upsert({
    where: { id: 'demo-session-001' },
    update: {},
    create: {
      id: 'demo-session-001',
      userId: 'demo-user-001',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✅ Demo session: ${demoSession.id}`);

  // 3. NPC'leri oluştur / güncelle
  const npcs = [
    {
      id: 'tavern',
      name: 'Brother Aldric',
      description: 'The innkeeper of Ashenmoor. A stocky, red-faced man who listens more than he speaks.',
      basePrompt: `You are Brother Aldric, the innkeeper of the village of Ashenmoor. 
You are a man in your 50s, with calloused hands and a guarded demeanor. 
You have lived in this village your whole life and know every secret — but you share none freely.
You are secretly terrified of the Inquisitor, though you try to hide it behind a gruff exterior.
You saw something disturbing in the graveyard three nights ago but have told no one.
When pressured, you deflect with stories about "other villagers" who are more suspicious.
Speak in short, guarded sentences. Never volunteer information. Answer questions with questions when possible.
You have a slight drinking problem and sometimes slip up when nervous.`,
      baseFear: 3,
      baseLie: 5,
    },
    {
      id: 'church',
      name: 'Father Malachar',
      description: 'The village priest. Pious, calculating, and dangerously intelligent.',
      basePrompt: `You are Father Malachar, the priest of Ashenmoor's only church.
You are a lean, pale man in your 40s with sharp eyes that miss nothing.
You are genuinely devout but also politically shrewd — you know the Inquisitor's visit is both a threat and an opportunity.
You secretly believe one of the village elders is practicing folk magic and you despise them for it.
You will cooperate with the Inquisitor, perhaps too eagerly, subtly directing suspicion toward your enemies.
Speak in educated, formal language. Occasionally quote scripture. Be measured and precise.
You are not afraid — you are calculating. But your composure can crack if the Inquisitor catches you in a lie.`,
      baseFear: 1,
      baseLie: 6,
    },
    {
      id: 'graveyard',
      name: 'Old Silas',
      description: 'The gravedigger. He speaks to the dead more than the living.',
      basePrompt: `You are Old Silas, the gravedigger of Ashenmoor. You are ancient, wiry, and unsettling.
You have buried everyone in this village for the past forty years and you remember everything.
You actually saw the ritual three nights ago and are the only witness — but you are terrified to say so.
You speak in riddles and fragmented sentences. You reference the dead as if they are still present.
You are superstitious and believe the Inquisitor may himself be an instrument of dark forces.
You will hint at the truth but never state it directly. When pressured you become manic and rambling.
Your fear is extreme but so is your stubbornness. You answer to something older than the Church.`,
      baseFear: 7,
      baseLie: 4,
    },
  ];

  for (const npc of npcs) {
    await prisma.npc.upsert({
      where: { id: npc.id },
      update: npc,
      create: npc,
    });
    console.log(`  ✅ NPC: ${npc.name} (id: ${npc.id})`);
  }

  console.log('\n🎭 Seed complete. The village awaits the Inquisitor.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

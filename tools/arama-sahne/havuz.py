# Arama sahnesi havuzunu doldurur: bir alan için farklı tohumlarla sahneler dizer ve oyuna yazar.
# Kullanım: python havuz.py <evren>/<mekân>/<alan> [--adet 3]      yeni varyantlar üretir
#           python havuz.py --dizin                                 yalnızca sahne listesini yeniler
# Alanın ayarları (kanıtın yer ifadesi, yüzey görseli, yüzeyin genişliği, lamba) alanlar.json'dadır.
# Sahneler DRAFT başlar; oynanıp beğenilince dosyasında status 'READY' yapılır.
import json
import os
import re
import subprocess
import sys
from pathlib import Path

KOK = Path(__file__).parent
DEPO = KOK.parents[1]
URETILEN = DEPO / "backend/src/search/scenes/generated"


def dizin():
    """generated/index.ts: üretilmiş bütün sahne dosyalarını listeler."""
    dosyalar = sorted(p.stem for p in URETILEN.glob("*.ts") if p.stem != "index")
    ad = lambda i: f"SCENE_{i}"
    satirlar = [f"import {{ SCENE as {ad(i)} }} from './{d}';" for i, d in enumerate(dosyalar)]
    (URETILEN / "index.ts").write_text(
        "import type { SearchSceneDef } from '../../search-scene';\n"
        + "".join(s + "\n" for s in satirlar)
        + "\n// tools/arama-sahne/havuz.py üretir; elle düzenleme\n"
        + "export const GENERATED_SCENES: SearchSceneDef[] = ["
        + ", ".join(ad(i) for i in range(len(dosyalar)))
        + "];\n",
        encoding="utf-8",
    )
    print(f"havuzda {len(dosyalar)} üretilmiş sahne")


if "--dizin" in sys.argv:
    dizin()
    sys.exit()

alan = sys.argv[1]
ayarlar = json.loads((KOK / "alanlar.json").read_text(encoding="utf-8"))
if alan not in ayarlar:
    sys.exit(f"alanlar.json içinde yok: {alan}")
ayar = ayarlar[alan]
adet = int(sys.argv[sys.argv.index("--adet") + 1]) if "--adet" in sys.argv else 3

# Var olan varyantların tohumları atlanır; böylece komut tekrar çalışınca eskilerin üstüne yazmaz
on_ek = alan.replace("/", "-") + "-v"
var = [int(m.group(1)) for p in URETILEN.glob("*.ts") if (m := re.fullmatch(re.escape(on_ek) + r"(\d+)", p.stem))]
tohum = max(var, default=0)
ortam = {**os.environ, "PYTHONIOENCODING": "utf-8"}
for _ in range(adet):
    tohum += 1
    print(f"--- {alan} v{tohum}", flush=True)
    subprocess.run(
        [sys.executable, str(KOK / "diz.py"), str(tohum), str(ayar["cm"]), "--masa", ayar["masa"], "--oyun", alan, "--varyant", f"v{tohum}", "--yer", ayar["clueSpot"], *(["--lamba", ayar["lamba"]] if "lamba" in ayar else [])],
        check=True,
        env=ortam,
    )
dizin()

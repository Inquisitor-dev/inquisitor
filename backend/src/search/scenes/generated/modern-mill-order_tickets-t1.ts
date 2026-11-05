import type { SearchSceneDef } from '../../search-scene';

// Görsel Gemini'nin tek parça çizimi; kutular elle, maske SAM ile (tools/arama-sahne/maske.py, lokanta_tezgah.json); elle düzenleme
export const SCENE: SearchSceneDef = {
  universe: "modern",
  locationId: "mill",
  areaId: "order_tickets",
  variant: "t1",
  clueSpot: "lokanta tezgâhındaki yığında, eşyaların arasında",
  image: "/search-scenes/modern/mill/order_tickets/t1.webp",
  status: 'DRAFT',
  objects: [
    { id: "huni", label: "Huni", box: [22.5, 4.9, 9.5, 12.5] },
    { id: "sari_telefon", label: "Sarı telefon", box: [0, 74, 10.8, 21.5] },
    { id: "gri_telefon", label: "Gri telefon", box: [74.5, 17.5, 8, 17.5] },
    { id: "kirmizi_yoyo", label: "Kırmızı yo-yo", box: [35.7, 87.9, 4.6, 9.4] },
    { id: "yesil_yoyo", label: "Yeşil yo-yo", box: [62, 17, 3.5, 5.8] },
    { id: "araba", label: "Kırmızı araba", box: [41.2, 77.1, 8.3, 8.9] },
    { id: "cuzdan", label: "Deri cüzdan", box: [23.7, 62.8, 10.8, 15.6] },
    { id: "caydanlik", label: "Çaydanlık", box: [78.2, 55.2, 12.3, 22.4] },
    { id: "yesil_zimba", label: "Yeşil zımba", box: [80.5, 39.9, 9, 12.1] },
    { id: "krem_zimba", label: "Krem zımba", box: [16, 74, 11, 12.5] },
    { id: "cirpici", label: "Tel çırpıcı", box: [76.7, 76.7, 9.5, 23.3] },
    { id: "bere", label: "Yün bere", box: [33.7, 49.8, 8.8, 9.9] },
    { id: "semsiye", label: "Şemsiye", box: [13.2, 10, 22, 53] },
    { id: "cep_saati", label: "Cep saati", box: [23.5, 55.2, 5.3, 8.5] },
    { id: "tuzluk_standi", label: "Tuzluk standı", box: [69.7, 45.3, 10.6, 16] },
    { id: "yesil_top", label: "Yeşil top", box: [39.7, 59.6, 3.3, 5.4] },
    { id: "tepsi", label: "Bölmeli tepsi", box: [61.7, 22.9, 11.5, 13.4] },
    { id: "tabak", label: "Tabak", box: [0, 22, 3.8, 12.4] },
  ],
  finalSpots: [
    { id: "tahta_sandik", box: [37.2, 63.2, 13, 13.4], prompt: "Kanıt ortadaki tahta sandıkta olabilir." },
    { id: "renkli_teneke", box: [55, 24.2, 7.5, 16], prompt: "Kanıt ortadaki kırmızı yeşil teneke kutuda olabilir." },
    { id: "alt_kutu", box: [50.5, 90, 11.5, 10], prompt: "Kanıt en alttaki açık tahta kutuda olabilir." },
  ],
  mask: {
    width: 688,
    height: 384,
    ids: ["huni", "sari_telefon", "gri_telefon", "kirmizi_yoyo", "yesil_yoyo", "araba", "cuzdan", "caydanlik", "yesil_zimba", "krem_zimba", "cirpici", "bere", "semsiye", "cep_saati", "tuzluk_standi", "yesil_top", "tepsi", "tabak", "tahta_sandik", "renkli_teneke", "alt_kutu"],
    data: 'H4sIAAAAAAAC/+3d13oivRKG0RoYA5tgbGPu/1b3/I6kBmVVqd7vYBIg2tJ6aqrVBBFCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQggh5H7+fIR5IGawfof5IGawIpZYogpYYooqYIkxrIAlxrjilVjiildiiSteiSGteCWWtOKVmOKKV2KJK16JJa54JXAlpApXvBJLXPFKLHHFKzGkFa7EEle8Ektc8UrgShxk952GXPFK8rCmi4Ur6cM1SewfvJJOWhPA/sEr6cc1FuwfvJKuXndwJYa44pWY8rqr7pW5J+W44pXo9nrxD7QDRLHXq3/BK7HgVRp5Ze5JEa9C+0oseY0NXgleCbm3P9AaLHNPOoHFK2nvddfUKzNPehVYvJLRCywTT7qBxSsZGyyzTgp4bQWWSSd9wfKZ2sQWWL4RhhgDGwDXy4w+gaqR1yJib8t1g/U32KoPtujIDhuBpyfA2gX7RVZ8cgWsjRb2QqxbrcXBzv8FrVLmwix5eqoMdn4ZwAK2KNenOk4xi9cqXIuA/ZGJWcDq93oCkjJ7AfbzN/AV45oP9gwjncGZ168/oU+P13OI8zliT8TCTqPXYK7OxMJVn9dzgvOQsBakY/96c6sAsFP7BUg053XuVyubXLq8UmCDtII2HSz1tRdXxCZ4Fbz244rZaLDOvL59RJVXyEZ4lQ5epbvXlmZ3gQFoAFjx67WR2F1EIPrAq7j22kTsbofYQmYrDG/MawOxO8CWQFtpZHNe35R5BWzLzO15fcMrXrXvZzUEuwPsw7x/5PZtr6fpw1WZV2Vg/UH9yR2pNdAa4IpXrVavwL5Ox7lXXWB9Sr0C+3o3Lbni1a/X9wcJ5FoErF2vb3jVgPUU7Gt1sHO8FgHr2+t7qNfXZlzV7Q9QYPVw/QL7+hoNNg7xHK8U2CJe30O9vt7e/XLh9Q2vo3gNEjvHK14LeQ0FKzK5XXt5U6bXuT6vgNXj9T2lgb17UyZXvOL1AdhYr/duxGtdsHiNb2Dv3HrdIMznZsBa8Lpz7zUU7Os9r69TG11zvFJgy3oNBvt6x+vXjZde53jFa2mv76FeH2O+8DrHK16Lcw0vsI/AvuKVBra+10Jgr0/NBvHKCZcyr2XBGuWKV19ef8bAa0WueC11ynXVv87xile9Xq/6AbzitZbXkmCNtgN4xSte8WrF6xyveK3FVYtXwSte8YpXvOK1i9cdXst6zbpcoNKr4FUd1wpeTb1Y247XHV5Ler04GLxSYW20A0lmNXpt8NSuwSaVV6nHNYKsKPTa5skdg03iKlW5hppV6LXd8wO27Ke+5Xp9TFb0eW16BHgN/lDNQmQfHpsxr62PwSXYNK1FxAYcHV4Bm+j15qMrc70DVtR57XMggA3Xmmc29ABNeO17NJ7A5nJNNRtzjOq4iiKsYWo9eQ0ZpqpXUexV12oCNoxrvNjIo9TFVXRqdQG2ENdIsZLjVbR4Vbic4/cEhbRGiY0/Sk1av7yqXM2dZ7DRQ1Xj+g1WyZSp5eoBbDGtcvcDNH9vtj9lern6BZs21uNiOgBXeVN8bDufYFPHqvQt86QM2N2gXtMHA6tqr2OCzRoNqhTYxmBZdAqsJbAsOl7xSjR4HbCDZc0BawksSz601x1eCWD7gWXFB/c6GFhWfHSvO7wSCmwfr6w3BdYSWNYbr5bEst6AtUN2oFX732cA6+b75m1D/QlgAWvFKmABa8oqYPFqyipgAWsLK2DxagoruwSAtYTVK1gBrEWqgAWsNa14xaslrYAFrCmteAWsJa2AxasprU69AtaoVrwC1hRXwAIWr3gllbg69QpYvA7lFbC0AxTY8bLf71t6dTzTgC2idR8nFq50BJ21RomFKwVWgdcWYN3PN2CLcQ0HC1fAWvIqaKWFteRV0EqB7e+1IlimGrDFue7v3zdDLFMdDpYJCuVa67IBMw3Y1uX14/5JYJlnwPYpr/uECss047WW131xr0wyYOtx3ccOgdY6YENH2X4FryVOuFBZFez2dmgHKK7NwSZrHZdsbnlFa0WwOVoHFZvpFa0dC+z2cXx6nUKM1o4FdhsUB173oV7RWhtsNtfRwO73sQ3BPoArBquD3br0ur+XiUegtT/YbUS8cE31Cr/qXrf+vO4fZvJxd72CrzrYbWQ8YE31Cr3SYLO5bn1wfdQPCFp7eN0mxAfXqb3Yqf0B0DUAu8VrsldBawuw2VzxeiUWbk3AbrcOwe4LeiUNwOZ73Xrhur93wkUag93iNdrrHq/NwWZztQx2nwc28S0zJB+sS6/7fRbY5Pd4kQyw2Vztgt3ngcVrN7B4jUWb8x5akgM226s485r9nm+SCZbyildLYPGKV0NgaQfw6qfA0r4GZHUaFPYssHgNDV4LgfV5OZZ2wC5YXj6AV0Nifb48S+BqFuyW17/itVOen6PBJhdY63MF145MTxIN1qlXgWt/rO3ADjF3aO2uNUBskY5gkPmDa3+ukWCTvI4zhWjtzjWuJZAUsCPNIlp7e32u7XWweYRrX65RBVZOwX7e7O4LDAStPblGgT0jenKX21Jf/otbsaCrwzUC7AXPsztdan35iU+xoOvm9VvsFc5JsCdaBwUrcO3mNRSsXPi8vNMEV4diEVeT63PQIMFfzilXXAcFO0kWcXW9Ppd9upcXN2ClqFbeW9DD64snr9dis6QiNsjrc22ubsCWwOpeLF4biS2F1bnYll5fHHr9Ehul9JFWz2Lx2itT7FZhwSte23tdJXt1KhavXbmu0rn6BPscDHb5kTpeD//i0+sqwytgp7kuf5L0LJ8g73F1J/amulVc8Hrb6/I0iVz/eZzwejh4BHsL3So6eL3SurxKGtfD4ZHXw53HHhyAXa0Amwf2ltZosL8eH3C9wfJwGBbsFbnVCrBZYCe0RoI9RHm9oPnfXwYVi9fCapf3ksL1FthbXE9o3qu9g4FdrQCbAVaWyyJgD/fBHia8/vB04HWVwxWxdzuBWLCXEIOq61cTcDnCsF5z4xyshHANBHtNMUTr1Bh4xeul10CtYWAPKXGyq4XXMlkGpw7Xw89Dbw6CV8CmYA0BGw/159eo+otXuBYAm9wHHDyAXQG2qdXHYFP7gANe8VpD6wOw0Y1r+hkZXuGaC/ZQLXh1DnaZE7zi1RBXvCrwuoJrNtgDYCmw+rROgsUrXlVybQ8Wr169Lpf1wOKVHS2lXpc0BHg1xPUmWLy2A4tX6qslsHjFK15dta94bQgWr2zAWgKLV7waAst2FhdkLYEVwGp+wQte8YpXvLoAK3jFqyGweMWrIbCC1+5eRQBb4B2HeMWrNq/Sw+tQ04/XhmAFr3i1A1a6eB1s9vHayqt08Trc9OO1DVjBK14bZ/2RNLF9vA64CHa5zk7SCmsq2Mfj47UJ2O5S24Bdn0XKc60DVgDb2+tsKs20xoMNfR641harRms9sOtbkRpci4Md91TChNfZgzTTGgU27vngWhOsIqw1wK7vRGpoLQt27N0a1V5nYWnHdS1VtJYEO/r2olaus/C0whoENuPJ4VpDrDKsJcGuH+fuNmyRg0BrUbH6tBbzug7yKnW55pgVP7HMddZM64dXqc41zexAGjffySSrUmsRr+t1uFdpwfXH7C3B166HKp6b06STVaq1hNcorjfBtlnJT5iLs4z2X/3mMtH9ga7tq/Je1+tIr9LL6xXW8cRubkTlgc5mncCu471KJ62L2xndq0axs05e1+sUrydiG87RYnyvm6lY03rvPrlaJcFrhyzG97rZmAA7y/LaprbitStXRWLD/s8vXV7XCdHJ1YvXjRGuUqF9Xa+teV2M73VjwOssP8244rWv1412roFnYo209vS6WIzvdbNRD7ZHdV1nRB1VvMJVldhFSNx43WjlWqkTyNXaGuxi4cfrRrnXDqdZBbi2BLsIDl77ea1VWstobSZ2ERM3XjfqvEo1r+u1HbALuNrwennTf3+5eeehufqrrqFeNwq9nvzp95dcr+tRvfrZzVLq9dLjRItAefV1cUur10uOsyJeKa+DeN0o83reyH7cbeLeeHX02iytXsNeoR0PFq94reu17CWDQb2KP68bvKq7WuCPq/4CO2sKdj3ixS3BqyKvUhCsLa7iT6ttr6LNa+vJ8cdVfQObW1pbge0yOf64qi+wWVtZDbz2XTx3WkX7Ja4yXmdVvGpYPXdcxUM/UNyrovVzxlU52EJeZyW96ltCT1ztei2/CWvR6oRYEe9gPXs1spIetOoGm3h+lQjWslVPwesEWGjgtZPX2AKLCsDmeM3uZlllb2B7ei1w9sUqOwPb0WuJ7QIWmQLbxmuh/S1WmQLbwqvglaSA7X+Qrrz+PQ9EY8Ua9zqzrBWx8WDFOFjjXFuCPf4LYPGaxbUd2KMNr4JX1VwbgT1a4Wrg2+Oce/3bCKsVrwODlRG4/m2l1YrYMb3a3slqB/Z4HAusWARrb6Oml9fjVYyDFXtgZSyuNcEeb4YC29Kr4DVLqwGxQxVYvGZzVS92IK/jcf3bXqt+s6OAlQG9/u3DVT1axV4Fr3242quyprwKXgtztSfWEFjBa3muusnidXivx7RYEavluMZ9+0tbr8cjYBV4FcFrVa6K2Rr0KjIuWE1aDYDF6yhej8cyXo+AzfMqgtdWXI+iscZaKrAieG3HVWdPYKjAigwOVh9XCmwyWBG84tUMWJHhwWrjKvo3CUQpWBG84tUKWBG84tUIWBkrdnYHPscSwEaJFby29yq/XgHrPOovbslvYcUrEeUvHfge5GcowAJW8QuzfgfR/fFwgO0Ctvzo2S9yOZ4PIoAlvT5vINCrsbfI4MlwSvQD1t7nzaq79XrWDaj+QfGK15N9AUsfCMeqe/V6MoSBnxWvXr2eIDX4EbGsujuvFj/RGK94tfmZ8Sy72/0BS98ig1fAmvQKWedejfysgMUrXq/zf4S9tosACAQA',
  },
};

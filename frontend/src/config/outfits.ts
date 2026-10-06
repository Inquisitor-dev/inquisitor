// Gardıroptaki tam kıyafetler. Her kıyafet baştan sona tek bir görsel setidir (parça parça giydirme yok).
// Görseller art/tools/ ile üretilir ve `public/characters/<id>/` altına manifest.json + sprite sheet olarak konur.

export type Outfit = {
  id: string;
  name: string;
  price: number;
};

export const DEFAULT_OUTFIT_ID = 'default';

export const OUTFITS: Outfit[] = [{ id: DEFAULT_OUTFIT_ID, name: 'Engizitör', price: 0 }];

export const outfitBasePath = (id: string) => `/characters/${id}`;

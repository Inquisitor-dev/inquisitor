export interface AvatarOption {
  id: string;
  name: string;
  role: string;
  src: string;
}

export const DEFAULT_AVATARS: AvatarOption[] = [
  { id: 'avatar_1', name: 'Engizitör', role: 'Sorgulayıcı', src: '/avatars/avatar_1.svg' },
  { id: 'avatar_2', name: 'Kardinal', role: 'Kıdemli Yargıç', src: '/avatars/avatar_2.svg' },
  { id: 'avatar_3', name: 'Veba Doktoru', role: 'Gölge Hekim', src: '/avatars/avatar_3.svg' },
  { id: 'avatar_4', name: 'Bilgin', role: 'Manastır Arşivcisi', src: '/avatars/avatar_4.svg' },
  { id: 'avatar_5', name: 'Gözcü', role: 'Kasaba Dedektifi', src: '/avatars/avatar_5.svg' },
];

export function getAvatarSrc(avatarId?: string | null): string {
  const found = DEFAULT_AVATARS.find((a) => a.id === avatarId);
  return found ? found.src : '/avatars/avatar_1.svg';
}

export function getAvatarInfo(avatarId?: string | null): AvatarOption {
  const found = DEFAULT_AVATARS.find((a) => a.id === avatarId);
  return found || DEFAULT_AVATARS[0];
}

// Karakter bir pencerenin (aria-modal) arkasında kalıyorsa görünmez; o sırada her karede çizmek ekran
// kartını boşa yorar. En üstteki pencerenin içindeki karakter (ör. Detaylı Bak'taki büyük karakter) çizilir.
export function isCoveredByModal(element: HTMLElement): boolean {
  const modals = document.querySelectorAll('[aria-modal="true"]');
  if (modals.length === 0) return false;
  return !modals[modals.length - 1].contains(element);
}

// Yapay zekasız test modu: oyun akışını (oturum açma, harita, mekanlar) API kotası harcamadan denemek için.
// Sadece ALLOW_TEST_MODE=true ayarlı sunucularda açılır; canlı ortamda kapalı kalmalı.
export const isTestModeEnabled = () => process.env.ALLOW_TEST_MODE === 'true';

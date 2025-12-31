/**
 * Device Fingerprinting Utility
 * Generates unique device identifier for security checks
 */

export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.platform,
    canvas.toDataURL()
  ].join('|');
  
  return btoa(fingerprint).slice(0, 32);
}

export function getStoredDeviceId(): string | null {
  return localStorage.getItem('ovo-device-id');
}

export function setStoredDeviceId(deviceId: string): void {
  localStorage.setItem('ovo-device-id', deviceId);
}

export function getCurrentDeviceFingerprint(): string {
  let deviceId = getStoredDeviceId();
  if (!deviceId) {
    deviceId = generateDeviceFingerprint();
    setStoredDeviceId(deviceId);
  }
  return deviceId;
}
export interface DeviceInfo {
  deviceType: "Mobile" | "Tablet" | "Desktop";
  browserName: string;
  browserVersion: string;
  osName: string;
  isTouch: boolean;
  isSecureContext: boolean;
  protocol: string;
}

export function detectBrowserAndDevice(): DeviceInfo {
  const ua = navigator.userAgent;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // OS Detection
  let osName = "Unknown OS";
  if (/windows phone/i.test(ua)) osName = "Windows Phone";
  else if (/win(dows|16|32|64|95|98|nt)/i.test(ua)) osName = "Windows";
  else if (/android/i.test(ua)) osName = "Android";
  else if (/ipad|iphone|ipod/i.test(ua)) osName = "iOS";
  else if (/mac/i.test(ua)) osName = "macOS";
  else if (/linux/i.test(ua)) osName = "Linux";

  // Device Type Detection
  let deviceType: "Mobile" | "Tablet" | "Desktop" = "Desktop";
  if (/ipad/i.test(ua) || (osName === "macOS" && isTouch)) {
    deviceType = "Tablet";
  } else if (/tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    deviceType = "Tablet";
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    deviceType = "Mobile";
  } else if (window.innerWidth <= 768 && isTouch) {
    deviceType = "Mobile";
  }

  // Browser Detection
  let browserName = "Browser";
  let browserVersion = "";

  if (/edg/i.test(ua)) {
    browserName = "Microsoft Edge";
    browserVersion = ua.match(/edg\/([\d.]+)/i)?.[1] || "";
  } else if (/opr|opera/i.test(ua)) {
    browserName = "Opera";
    browserVersion = ua.match(/(?:opr|opera)\/([\d.]+)/i)?.[1] || "";
  } else if (/chrome|crios/i.test(ua)) {
    browserName = "Google Chrome";
    browserVersion = ua.match(/(?:chrome|crios)\/([\d.]+)/i)?.[1] || "";
  } else if (/firefox|fxios/i.test(ua)) {
    browserName = "Mozilla Firefox";
    browserVersion = ua.match(/(?:firefox|fxios)\/([\d.]+)/i)?.[1] || "";
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browserName = "Apple Safari";
    browserVersion = ua.match(/version\/([\d.]+)/i)?.[1] || "";
  }

  return {
    deviceType,
    browserName,
    browserVersion,
    osName,
    isTouch,
    isSecureContext: !!window.isSecureContext,
    protocol: window.location.protocol,
  };
}

export async function checkMediaPermissions(): Promise<{
  camera: PermissionState | "unknown";
  microphone: PermissionState | "unknown";
  hasDevices: boolean;
}> {
  let camera: PermissionState | "unknown" = "unknown";
  let microphone: PermissionState | "unknown" = "unknown";
  let hasDevices = false;

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      hasDevices = devices.some((d) => d.kind === "videoinput" || d.kind === "audioinput");
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const camRes = await navigator.permissions.query({ name: "camera" as any });
        camera = camRes.state;
      } catch (e) {}

      try {
        const micRes = await navigator.permissions.query({ name: "microphone" as any });
        microphone = micRes.state;
      } catch (e) {}
    }
  } catch (e) {
    console.warn("Permissions query error", e);
  }

  return { camera, microphone, hasDevices };
}

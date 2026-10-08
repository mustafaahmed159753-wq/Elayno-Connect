import { soundManager } from "./sound";
import { sendPushNotification, dismissCallNotification } from "./notifications";

class CallAlertManager {
  private vibrateInterval: NodeJS.Timeout | null = null;
  private titleInterval: NodeJS.Timeout | null = null;
  private wakeLock: any = null;
  private isAlerting: boolean = false;

  public startIncomingCallAlerts(fromUser: string, callType: "voice" | "video", avatar?: string) {
    // If already alerting, reset previous intervals first
    this.stopAllAlerts();
    this.isAlerting = true;

    // 1. Play ringing sound repeatedly
    soundManager.startRingtone();

    // 2. Physical phone vibration pattern for mobile browsers
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
      } catch (_) {}

      this.vibrateInterval = setInterval(() => {
        try {
          navigator.vibrate([1000, 500, 1000, 500, 1000]);
        } catch (_) {}
      }, 3000);
    }

    // 3. Screen Wake Lock to prevent display from sleeping during incoming call
    if (typeof navigator !== "undefined" && "wakeLock" in navigator && (navigator as any).wakeLock?.request) {
      (navigator as any).wakeLock.request("screen").then((lock: any) => {
        this.wakeLock = lock;
      }).catch(() => {});
    }

    // 4. Tab title animation for inactive background tabs
    let toggle = false;
    this.titleInterval = setInterval(() => {
      toggle = !toggle;
      document.title = toggle
        ? `📞 INCOMING CALL: ${fromUser}!`
        : `🔔 Ringing (${callType})...`;
    }, 700);

    // 5. System web push notification
    sendPushNotification(
      `📞 Incoming ${callType.toUpperCase()} Call from ${fromUser}`,
      `${fromUser} is calling you. Tap to open and answer.`,
      avatar || undefined,
      "call-notification"
    );
  }

  public stopAllAlerts() {
    this.isAlerting = false;

    // 1. Immediately cut all ringtones, outgoing rings and audio synthesis
    soundManager.stopAll();

    // 2. Immediately cancel phone vibration interval and stop physical vibration
    if (this.vibrateInterval) {
      clearInterval(this.vibrateInterval);
      this.vibrateInterval = null;
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(0);
      } catch (_) {}
    }

    // 3. Dismiss system push notification
    dismissCallNotification();

    // 4. Reset browser tab title immediately
    if (this.titleInterval) {
      clearInterval(this.titleInterval);
      this.titleInterval = null;
      document.title = "Elyano Connect";
    }

    // 5. Release screen wake lock
    if (this.wakeLock) {
      try {
        this.wakeLock.release().catch(() => {});
      } catch (_) {}
      this.wakeLock = null;
    }
  }

  public getIsAlerting(): boolean {
    return this.isAlerting;
  }
}

export const callAlertManager = new CallAlertManager();

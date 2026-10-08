// Browser Web Push Notification Manager for PC & Mobile Browser

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.log("Web Notifications API not supported in this browser environment.");
    return Promise.resolve("denied");
  }

  if (Notification.permission === "granted") {
    return Promise.resolve("granted");
  }

  return Notification.requestPermission().then((permission) => {
    console.log("Notification permission response:", permission);
    return permission;
  });
}

let activeCallNotification: Notification | null = null;

export function dismissCallNotification() {
  if (activeCallNotification) {
    try {
      activeCallNotification.close();
    } catch (_) {}
    activeCallNotification = null;
  }

  // Also query and close any persistent notifications on Service Worker if supported
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator && navigator.serviceWorker.getRegistrations) {
    try {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
          reg.getNotifications({ tag: "call-notification" }).then((notifs) => {
            notifs.forEach((n) => {
              try {
                n.close();
              } catch (_) {}
            });
          }).catch(() => {});
        });
      }).catch(() => {});
    } catch (_) {}
  }
}

export function sendPushNotification(
  title: string,
  body: string,
  icon: string = "/uploads/notification_icon.png",
  tag: string = "elyno-chat-notif"
): Notification | undefined {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      const isCall = tag === "call-notification";

      // If an existing call notification is open, dismiss it first
      if (isCall && activeCallNotification) {
        try {
          activeCallNotification.close();
        } catch (_) {}
        activeCallNotification = null;
      }

      const notif = new Notification(title, {
        body,
        icon,
        tag,
        requireInteraction: isCall,
      });

      if (isCall) {
        activeCallNotification = notif;
      }

      notif.onclick = () => {
        try {
          window.focus();
        } catch (_) {}
        notif.close();
        if (isCall && activeCallNotification === notif) {
          activeCallNotification = null;
        }
      };

      notif.onclose = () => {
        if (isCall && activeCallNotification === notif) {
          activeCallNotification = null;
        }
      };

      // Auto close message notifications after 5s; call notifications remain until answered/rejected
      if (!isCall) {
        setTimeout(() => {
          try {
            notif.close();
          } catch (_) {}
        }, 5000);
      }

      return notif;
    } catch (err) {
      console.warn("Could not display Web Push Notification:", err);
    }
  }
}

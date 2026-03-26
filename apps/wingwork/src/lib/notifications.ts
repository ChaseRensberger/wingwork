let hasPermission = false

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false
  if (Notification.permission === "granted") {
    hasPermission = true
    return true
  }
  if (Notification.permission === "denied") return false
  const result = await Notification.requestPermission()
  hasPermission = result === "granted"
  return hasPermission
}

export function showNotification(title: string, body: string): void {
  if (!hasPermission || document.hasFocus()) return
  new Notification(title, { body, icon: "/favicon.svg" })
}

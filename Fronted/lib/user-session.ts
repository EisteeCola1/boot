"use client"

const USER_ID_KEY = "learning_platform_user_id"

export function getUserId(): string {
  if (typeof window === "undefined") {
    return ""
  }

  let userId = localStorage.getItem(USER_ID_KEY)

  if (!userId) {
    // Generiere eine neue UUID für den Benutzer
    userId = crypto.randomUUID()
    localStorage.setItem(USER_ID_KEY, userId)
  }

  return userId
}

export function clearUserId(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_ID_KEY)
  }
}

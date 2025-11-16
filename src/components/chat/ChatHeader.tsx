"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export function ChatHeader({
  email,
  mode,
  userRole,
  toggleMode,
  signOut,
  router,
}: {
  email: string | null
  mode: "xai" | "baseline"
  userRole: "admin" | "user"
  toggleMode: () => void
  signOut: () => void
  router: any
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
      {/* LEFT SIDE — Title + Mode */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-gray-900">TrustAI Chatbot</h2>

        {/* Mode pill */}
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-md text-xs font-medium text-white",
            mode === "xai" ? "bg-emerald-600" : "bg-gray-500"
          )}
        >
          {mode === "xai" ? "Explainable Mode" : "Baseline Mode"}
        </span>
      </div>

      {/* RIGHT SIDE — User info */}
      <div className="flex items-center gap-5">
        {/* Avatar */}
        <Avatar className={cn(
          "h-9 w-9 border",
          mode === "xai" ? "border-emerald-600" : "border-transparent"
        )}>
          <AvatarFallback className="bg-gray-300 text-gray-700 font-bold">
            {email ? email.charAt(0).toUpperCase() : "?"}
          </AvatarFallback>
        </Avatar>

        {/* Admin controls */}
        {userRole === "admin" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              className="text-sm"
            >
              Toggle Mode
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin")}
            >
              Admin
            </Button>
          </div>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* Sign Out */}
        <Button
          variant="destructive"
          size="sm"
          onClick={signOut}
        >
          Sign out
        </Button>
      </div>
    </header>
  )
}

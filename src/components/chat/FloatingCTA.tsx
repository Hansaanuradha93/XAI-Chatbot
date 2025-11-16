"use client"

import { Button } from "@/components/ui/button"

export function FloatingCTA({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="
        fixed bottom-20 right-5 z-50
        rounded-full px-7 py-3
        bg-emerald-600 text-white font-medium
        shadow-[0_0_25px_rgba(16,185,129,0.45)]
        animate-glow
        hover:bg-emerald-700
        hover:shadow-[0_0_35px_rgba(16,185,129,0.6)]
        active:scale-95
        transition-all duration-200
      "
    >
      Apply for a Loan
    </Button>
  )
}

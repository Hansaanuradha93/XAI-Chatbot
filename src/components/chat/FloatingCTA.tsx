"use client"

import { Button } from "@/components/ui/button"

export function FloatingCTA({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="
        fixed bottom-20 right-5 z-50
        rounded-full px-6 py-3
        bg-emerald-600 text-white
        shadow-[0_8px_22px_rgba(16,185,129,0.35)]
        hover:shadow-[0_8px_28px_rgba(16,185,129,0.45)]
        hover:bg-emerald-700
        active:scale-95
        transition-all duration-200
      "
    >
      Apply for a Loan
    </Button>
  )
}

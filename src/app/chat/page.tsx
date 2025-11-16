'use client'

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/apiClient"

import { ChatHeader } from "@/components/chat/ChatHeader"
import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { FloatingCTA } from "@/components/chat/FloatingCTA"

import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  sender: "user" | "bot"
  text: string
}

type LoanResult = {
  prediction: string
  explanation?: Record<string, number> | { error?: string } | null
}

type ChatContext = "loan" | "faq" | null

export default function ChatPage() {
  const router = useRouter()
  const { email, loading } = useSession(true)

  const initialGreeting: Message[] = [
    { sender: "bot", text: "Hello! I’m TrustAI — your personal AI loan advisor." },
    { sender: "bot", text: "You can check your loan eligibility or ask me financial FAQs." },
  ]

  const [messages, setMessages] = useState<Message[]>(initialGreeting)
  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)
  const [context, setContext] = useState<ChatContext>(null)
  const [lastResult, setLastResult] = useState<LoanResult | null>(null)

  const [ratingPending, setRatingPending] = useState(false)
  const [ratingSubmitting, setRatingSubmitting] = useState(false)

  const [feedbackPending, setFeedbackPending] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [ratingGiven, setRatingGiven] = useState<number | null>(null)

  const [mode, setMode] = useState<"xai" | "baseline">(
    (typeof window !== "undefined" && (localStorage.getItem("chat_mode") as "xai" | "baseline")) || "xai"
  )

  const [userRole, setUserRole] = useState<"admin" | "user">("user")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const toggleMode = () => {
    const newMode = mode === "xai" ? "baseline" : "xai"
    setMode(newMode)
    localStorage.setItem("chat_mode", newMode)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace("/")
  }

  // Scroll on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, ratingPending, feedbackPending, thinking])

  // Load history
  useEffect(() => {
    const load = async () => {
      if (!email) return
      const { data } = await supabase
        .from("chat_history")
        .select("sender, message")
        .eq("user_email", email)
        .order("timestamp", { ascending: true })

      if (!data || data.length === 0) {
        setMessages(initialGreeting)
        return
      }

      const past = data.map((m) => ({
        sender: m.sender as "user" | "bot",
        text: m.message,
      }))

      setMessages([...initialGreeting, ...past])

      const last = past[past.length - 1]
      if (last?.text.startsWith("Loan Decision")) {
        setContext("loan")
        setRatingPending(true)
      }
    }
    load()
  }, [email])

  // Fetch mode / role
  useEffect(() => {
    const fetch = async () => {
      if (!email) return
      try {
        const data = await apiFetch(`/api/v1/users/mode`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })

        if (data.mode) {
          setMode(data.mode)
          localStorage.setItem("chat_mode", data.mode)
        }
        if (data.role) {
          setUserRole(data.role)
        }
      } catch {}
    }
    fetch()
  }, [email])

  const saveMessage = async (sender: "user" | "bot", text: string) => {
    if (!email) return
    await supabase.from("chat_history").insert({
      user_email: email,
      sender,
      message: text,
      variant: mode,
    })
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((p) => [...p, { sender: "user", text: trimmed }])
    saveMessage("user", trimmed)
    setInput("")
    setThinking(true)

    try {
      const data = await apiFetch(`/api/v1/faq/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, user_email: email }),
      })

      setThinking(false)

      if (data.answer) {
        const botMsg = data.answer
        setMessages((p) => [...p, { sender: "bot", text: botMsg }])
        saveMessage("bot", botMsg)
        setContext("faq")
        setRatingPending(true)
      } else {
        const msg = "Sorry, I couldn’t find an answer for that question."
        setMessages((p) => [...p, { sender: "bot", text: msg }])
        saveMessage("bot", msg)
      }
    } catch {
      setThinking(false)
      const msg = "Error contacting the backend service."
      setMessages((p) => [...p, { sender: "bot", text: msg }])
      saveMessage("bot", msg)
    }
  }

  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading…</div>
      </main>
    )
  }

  return (
    <main className="flex flex-col h-screen bg-white">
      <ChatHeader
        email={email}
        mode={mode}
        userRole={userRole}
        toggleMode={toggleMode}
        signOut={signOut}
        router={router}
      />

      <ScrollArea className="flex-1 px-4 py-4">
        <ChatMessages
          messages={messages}
          ratingPending={ratingPending}
          feedbackPending={feedbackPending}
          feedback={feedback}
          feedbackSubmitting={feedbackSubmitting}
          ratingSubmitting={ratingSubmitting}
          handleRating={() => {}}
          submitFeedback={() => {}}
          setFeedback={() => {}}
        />

        <div ref={messagesEndRef} />
      </ScrollArea>

      <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} />

      {email && <FloatingCTA router={router} />}
    </main>
  )
}

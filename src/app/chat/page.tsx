"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useSession } from "@/hooks/useSession"
import { apiFetch } from "@/lib/apiClient"

import { ChatHeader } from "@/components/chat/ChatHeader"
import { ChatMessages } from "@/components/chat/ChatMessages"
import { ChatInput } from "@/components/chat/ChatInput"
import { FloatingCTA } from "@/components/chat/FloatingCTA"

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
  const [ratingGiven, setRatingGiven] = useState<number | null>(null)

  const [feedbackPending, setFeedbackPending] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedback, setFeedback] = useState("")

  const [mode, setMode] = useState<"xai" | "baseline">(
    (typeof window !== "undefined" &&
      (localStorage.getItem("chat_mode") as "xai" | "baseline")) || "xai"
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

  // Scroll handler
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

  // Fetch mode + role
  useEffect(() => {
    const fetchMode = async () => {
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

      } catch (err) {
        console.error("Failed to fetch mode:", err)
      }
    }

    fetchMode()
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
      const msg = "Error contacting backend service."
      setMessages((p) => [...p, { sender: "bot", text: msg }])
      saveMessage("bot", msg)
    }
  }

  // ----- Rating Handler -----
  const handleRating = async (score: number) => {
    if (!email || ratingSubmitting) return

    setRatingSubmitting(true)

    const variant = context === "loan" ? mode : "faq"

    const { data, error } = await supabase
      .from("trust_ratings")
      .insert({
        user_email: email,
        variant,
        prediction: lastResult?.prediction ?? null,
        explanation_json: lastResult?.explanation ?? null,
        trust_score: score,
        comment: null,
      })
      .select("id")
      .single()

    setRatingSubmitting(false)

    if (error || !data) return

    setRatingGiven(score)
    setRatingPending(false)
    setFeedbackPending(true)

    const msg1 = `Thanks! Your trust rating (${score}/5) was recorded.`
    const msg2 = "Would you like to explain your rating?"

    setMessages((p) => [...p, { sender: "bot", text: msg1 }, { sender: "bot", text: msg2 }])
    saveMessage("bot", msg1)
    saveMessage("bot", msg2)
  }

  // ----- Feedback Handler -----
  const submitFeedback = async () => {
    if (!feedback.trim()) return
    setFeedbackSubmitting(true)

    const { data: latest } = await supabase
      .from("trust_ratings")
      .select("id")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!latest) return

    await supabase
      .from("trust_ratings")
      .update({ comment: feedback })
      .eq("id", latest.id)

    setFeedbackSubmitting(false)
    setFeedbackPending(false)

    const thank = "Thank you for your feedback!"
    setMessages((p) => [...p, { sender: "user", text: feedback }, { sender: "bot", text: thank }])
    saveMessage("user", feedback)
    saveMessage("bot", thank)

    setFeedback("")
  }

  const skipFeedback = () => {
    setFeedbackPending(false)
    const msg = "Feedback skipped."
    setMessages((p) => [...p, { sender: "bot", text: msg }])
    saveMessage("bot", msg)
  }

  // ----- RENDER -----
  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen text-lg">
        Loading…
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

      <ChatMessages
        messages={messages}
        ratingPending={ratingPending}
        ratingSubmitting={ratingSubmitting}
        onRate={handleRating}
        feedback={feedback}
        setFeedback={setFeedback}
        feedbackPending={feedbackPending}
        feedbackSubmitting={feedbackSubmitting}
        onSubmitFeedback={submitFeedback}
        onSkipFeedback={skipFeedback}
      />

      <div ref={messagesEndRef} />

      <ChatInput input={input} setInput={setInput} sendMessage={sendMessage} />

      {email && <FloatingCTA onClick={() => router.push("/loan-form")} />}
    </main>
  )
}

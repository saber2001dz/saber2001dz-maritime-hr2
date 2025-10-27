// components/login-form.tsx
"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import React from "react"

interface LoginFormProps extends React.HTMLAttributes<HTMLFormElement> {}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (signInError) {
      if (signInError.message === "Invalid login credentials") {
        setError("L'adresse e-mail ou le mot de passe est incorrect.")
      } else {
        setError(signInError.message)
      }
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <form onSubmit={handleSignIn} className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-4xl font-extrabold text-[#0E6681]  tracking-tight sm:text-4xl">Welcome Back</h1>
        <p className="text-muted-foreground text-sm max-w-[90%] sm:max-w-full">
          Enter your email and password below to login to your account.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button
          type="submit"
          className="w-full bg-[#0E6681] hover:bg-[#247C95] cursor-pointer h-10"
          disabled={isLoading}
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </Button>
      </div>
      {/* Séparateur horizontal */}
      <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>{" "}
      <div className="text-center text-sm text-muted-foreground">
        Si vous ne parvenez pas à vous connecter avec les identifiants fournis, veuillez contacter votre administrateur.
      </div>
    </form>
  )
}

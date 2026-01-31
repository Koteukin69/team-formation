"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { requestCodeSchema, verifyCodeSchema } from "@/lib/validator";

type FormState = "email" | "code";

interface FormError {
  field?: string;
  message: string;
}

export function LoginForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<FormError | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = requestCodeSchema.safeParse({ email });
    if (!validation.success) {
      setError({ field: "email", message: "Введите корректный email" });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/request-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError({ message: data.error || "Ошибка отправки кода" });
          return;
        }

        setFormState("code");
      } catch {
        setError({ message: "Ошибка соединения с сервером" });
      }
    });
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = verifyCodeSchema.safeParse({ email, code });
    if (!validation.success) {
      setError({ field: "code", message: "Введите 6-значный код" });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError({ message: data.error || "Неверный код" });
          return;
        }

        router.push("/");
        router.refresh();
      } catch {
        setError({ message: "Ошибка соединения с сервером" });
      }
    });
  };

  const handleBackToEmail = () => {
    setFormState("email");
    setCode("");
    setError(null);
  };

  if (formState === "code") {
    return (
      <div className="flex flex-col gap-6 w-[340px]">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Введите код подтверждения
          </h1>
          <p className="text-sm text-muted-foreground">
            Мы отправили код подтверждения на{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Код подтверждения</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-lg tracking-[0.5em] font-mono"
              disabled={isPending}
              autoFocus
              aria-invalid={error?.field === "code"}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">
              {error.message}
            </p>
          )}

          <Button type="submit" disabled={isPending || code.length !== 6}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Проверка...
              </>
            ) : (
              "Подтвердить"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleBackToEmail}
            disabled={isPending}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Изменить email
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-[340px]">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Вход в систему
        </h1>
        <p className="text-sm text-muted-foreground">
          Введите email для входа в аккаунт
        </p>
      </div>

      <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isPending}
            autoFocus
            aria-invalid={error?.field === "email"}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">
            {error.message}
          </p>
        )}

        <Button type="submit" disabled={isPending || !email}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Mail className="size-4" />
              Войти по Email
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

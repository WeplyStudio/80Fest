
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  password: z.string().min(1, "Password tidak boleh kosong."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const JUDGE_PASSWORDS: Record<string, string> = {
  "80fest01": "Jason",
  "80fest02": "Iqbal",
  "80fest03": "Kyora",
};
const AUTH_COOKIE_NAME = "judge-name";

export default function JudgeLoginPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        password: "",
    },
  });

  function onSubmit(data: LoginFormValues) {
    const judgeName = JUDGE_PASSWORDS[data.password];
    
    if (judgeName) {
      toast({ title: "Login Berhasil", description: `Selamat datang, Juri ${judgeName}!` });
      // Set a cookie that expires in 7 days
      document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(judgeName)}; path=/; max-age=604800`;
      router.push("/"); // Redirect to home page after login
    } else {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Password yang Anda masukkan salah.",
      });
      form.reset();
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline mt-4">Login Panel Juri</CardTitle>
          <CardDescription>Masukkan kata sandi khusus juri untuk menilai.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Juri</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Masuk sebagai Juri
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

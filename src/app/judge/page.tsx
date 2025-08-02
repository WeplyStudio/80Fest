
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { getArtworks } from "@/lib/actions";
import { Artwork } from "@/lib/types";
import { JudgePanel } from "@/components/judge-panel";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function JudgePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [judgeName, setJudgeName] = useState<string | null>(null);
  const [artworks, setArtworks] = useState<Artwork[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        password: "",
    },
  });

  // Check for auth cookie on initial load
  useEffect(() => {
    const cookie = document.cookie.split('; ').find(row => row.startsWith(`${AUTH_COOKIE_NAME}=`));
    const name = cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
    if (name) {
      setIsAuthenticated(true);
      setJudgeName(name);
    } else {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      getArtworks()
        .then(artworksData => {
            setArtworks(artworksData);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Gagal memuat data karya' });
            setLoading(false);
        });
    }
  }, [isAuthenticated, toast]);


  function onSubmit(data: LoginFormValues) {
    const name = JUDGE_PASSWORDS[data.password];
    
    if (name) {
      toast({ title: "Login Berhasil", description: `Selamat datang, Juri ${name}!` });
      document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(name)}; path=/; max-age=604800`;
      setJudgeName(name);
      setIsAuthenticated(true);
    } else {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Password yang Anda masukkan salah.",
      });
      form.reset();
    }
  }
  
  function handleLogout() {
    toast({ title: "Logout Berhasil" });
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
    setIsAuthenticated(false);
    setJudgeName(null);
    setArtworks(null);
    setLoading(false);
  }

  if (isAuthenticated) {
     if (loading || !artworks || !judgeName) {
      return (
        <div className="space-y-4">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      );
    }
    return <JudgePanel 
        initialArtworks={artworks} 
        judgeName={judgeName}
        onLogout={handleLogout}
    />;
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

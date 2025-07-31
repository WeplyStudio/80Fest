"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminPanel } from "@/components/admin-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { getArtworks } from "@/lib/actions";
import { Artwork } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const loginSchema = z.object({
  password: z.string().min(1, "Password tidak boleh kosong."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// In a real app, this would be a secure token or proper auth flow.
const ADMIN_PASSWORD = "osis-keren-2024";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        password: "",
    },
  });
  
  useEffect(() => {
    if (isAuthenticated) {
      getArtworks()
        .then(data => {
            setArtworks(data);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Gagal memuat data' });
            setLoading(false);
        });
    }
  }, [isAuthenticated, toast]);


  function onSubmit(data: LoginFormValues) {
    if (data.password === ADMIN_PASSWORD) {
      toast({ title: "Login Berhasil", description: "Selamat datang, Admin!" });
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

  if (isAuthenticated) {
     if (loading || !artworks) {
      return (
        <div className="space-y-4">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="border rounded-lg p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      );
    }
    return <AdminPanel initialArtworks={artworks} />;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline mt-4">Admin Panel Login</CardTitle>
          <CardDescription>Masukkan password untuk mengakses dasbor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

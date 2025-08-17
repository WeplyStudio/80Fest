
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
import { getArtworks, getSubmissionStatus, getLeaderboardStatus, getContestInfo, getAnnouncementBanner, getFormFields, getGalleryStatus } from "@/lib/actions";
import { Artwork, ContestInfoData, AnnouncementBannerData, FormFieldDefinition } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const loginSchema = z.object({
  password: z.string().min(1, "Password tidak boleh kosong."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// In a real app, this would be a secure token or proper auth flow.
const ADMIN_PASSWORD = "osis-keren-2024";
const AUTH_COOKIE_NAME = "admin-authenticated";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [artworks, setArtworks] = useState<Artwork[] | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<boolean | null>(null);
  const [leaderboardStatus, setLeaderboardStatus] = useState<boolean | null>(null);
  const [galleryStatus, setGalleryStatus] = useState<boolean | null>(null);
  const [contestInfo, setContestInfo] = useState<ContestInfoData | null>(null);
  const [bannerInfo, setBannerInfo] = useState<AnnouncementBannerData | null>(null);
  const [formFields, setFormFields] = useState<FormFieldDefinition[] | null>(null);
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
    if (cookie?.split('=')[1] === 'true') {
      setIsAuthenticated(true);
    } else {
      setLoading(false); // If not authenticated, stop loading
    }
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      Promise.all([
        getArtworks(),
        getSubmissionStatus(),
        getLeaderboardStatus(),
        getContestInfo(),
        getAnnouncementBanner(),
        getFormFields(),
        getGalleryStatus(),
      ]).then(([artworksData, submissionStatusData, leaderboardStatusData, contestInfoData, bannerData, formFieldsData, galleryStatusData]) => {
            setArtworks(artworksData);
            setSubmissionStatus(submissionStatusData);
            setLeaderboardStatus(leaderboardStatusData);
            setContestInfo(contestInfoData);
            setBannerInfo(bannerData);
            setFormFields(formFieldsData);
            setGalleryStatus(galleryStatusData);
            setLoading(false);
      }).catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Gagal memuat data' });
            setLoading(false);
      });
    }
  }, [isAuthenticated, toast]);


  function onSubmit(data: LoginFormValues) {
    if (data.password === ADMIN_PASSWORD) {
      toast({ title: "Login Berhasil", description: "Selamat datang, Admin!" });
      // Set a cookie that expires in 7 days
      document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; max-age=604800`;
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
    setArtworks(null);
    setSubmissionStatus(null);
    setLeaderboardStatus(null);
    setGalleryStatus(null);
    setFormFields(null);
    setLoading(false);
  }

  if (isAuthenticated) {
     if (loading || !artworks || submissionStatus === null || leaderboardStatus === null || galleryStatus === null || !contestInfo || !bannerInfo || !formFields) {
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
    return <AdminPanel 
        initialArtworks={artworks} 
        initialSubmissionStatus={submissionStatus} 
        initialLeaderboardStatus={leaderboardStatus}
        initialGalleryStatus={galleryStatus}
        initialContestInfo={contestInfo}
        initialBannerInfo={bannerInfo}
        initialFormFields={formFields}
        onLogout={handleLogout}
    />;
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="font-headline mt-4">Login Panel Admin</CardTitle>
          <CardDescription>Masukkan kata sandi untuk mengakses dasbor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Masuk
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

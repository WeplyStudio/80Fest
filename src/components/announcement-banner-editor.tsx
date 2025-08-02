
"use client";

import { useState } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { updateAnnouncementBanner } from '@/lib/actions';
import type { AnnouncementBannerData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';


const bannerSchema = z.object({
  text: z.string(),
  isEnabled: z.boolean(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface AnnouncementBannerEditorProps {
    initialData: AnnouncementBannerData;
}

export function AnnouncementBannerEditor({ initialData }: AnnouncementBannerEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            text: initialData.text || "",
            isEnabled: initialData.isEnabled || false,
        }
    });

    const onSubmit = async (data: BannerFormValues) => {
        setIsSubmitting(true);
        const result = await updateAnnouncementBanner(data);

        if (result.success) {
            toast({
                title: 'Banner Pengumuman Diperbarui',
                description: 'Perubahan telah berhasil disimpan.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Gagal Menyimpan',
                description: result.message || 'Terjadi kesalahan pada server.',
            });
        }
        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Banner Pengumuman</CardTitle>
                <CardDescription>
                    Atur teks dan visibilitas banner di bagian atas situs.
                </CardDescription>
            </CardHeader>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="text"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Teks Banner</FormLabel>
                                <FormControl>
                                    <Textarea rows={3} {...field} placeholder="Contoh: Pendaftaran akan ditutup dalam 24 jam!"/>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="isEnabled"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isEnabled" className="text-base">
                                            Aktifkan Banner
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Jika aktif, banner akan muncul di situs publik.
                                        </p>
                                    </div>
                                    <FormControl>
                                         <Switch
                                            id="isEnabled"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                            ) : (
                            "Simpan Pengaturan Banner"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    )
}

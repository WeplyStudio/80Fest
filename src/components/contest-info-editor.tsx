
"use client";

import { useState } from 'react';
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { updateContestInfo } from '@/lib/actions';
import type { ContestInfoData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


const contestInfoSchema = z.object({
  theme: z.string().min(1, "Tema tidak boleh kosong."),
  dates: z.string().min(1, "Tanggal penting tidak boleh kosong."),
  rules: z.string().min(1, "Ketentuan tidak boleh kosong."),
  criteria: z.string().min(1, "Kriteria tidak boleh kosong."),
});

type ContestInfoFormValues = z.infer<typeof contestInfoSchema>;

interface ContestInfoEditorProps {
    initialData: ContestInfoData;
}

export function ContestInfoEditor({ initialData }: ContestInfoEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<ContestInfoFormValues>({
        resolver: zodResolver(contestInfoSchema),
        defaultValues: {
            theme: initialData.theme || "",
            dates: initialData.dates || "",
            rules: initialData.rules || "",
            criteria: initialData.criteria || "",
        }
    });

    const onSubmit = async (data: ContestInfoFormValues) => {
        setIsSubmitting(true);
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });

        const result = await updateContestInfo(formData);

        if (result.success) {
            toast({
                title: 'Informasi Lomba Diperbarui',
                description: 'Perubahan telah berhasil disimpan dan ditampilkan di halaman utama.',
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
                <CardTitle className="font-headline">Editor Informasi Lomba</CardTitle>
                <CardDescription>
                    Ubah konten yang tampil di bagian "Informasi Lomba" pada halaman utama.
                    Anda bisa menggunakan format Markdown sederhana (misalnya: `*teks miring*`, `**teks tebal**`, dan `- daftar poin`).
                </CardDescription>
            </CardHeader>
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="theme"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tema Poster</FormLabel>
                                <FormControl>
                                    <Textarea rows={2} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dates"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Tanggal Penting</FormLabel>
                                <FormControl>
                                    <Textarea rows={4} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="rules"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Ketentuan Umum</FormLabel>
                                <FormControl>
                                    <Textarea rows={5} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="criteria"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Kriteria Penilaian</FormLabel>
                                <FormControl>
                                    <Textarea rows={5} {...field} />
                                </FormControl>
                                <FormMessage />
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
                            "Simpan Perubahan Informasi"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </FormProvider>
        </Card>
    )
}

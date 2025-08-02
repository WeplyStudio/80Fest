
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, ArrowLeft, Eye, Image as ImageIcon } from "lucide-react";
import { submitArtwork, getSubmissionStatus } from "@/lib/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import imageCompression from 'browser-image-compression';

const classes = ["VII", "VIII", "IX"] as const;
const MAX_FILE_SIZE_MB = 32;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const submissionSchema = z.object({
  name: z.string().min(3, "Nama harus diisi, minimal 3 karakter."),
  class: z.enum(classes, { required_error: "Kelas harus dipilih." }),
  title: z.string().min(5, "Judul karya harus diisi, minimal 5 karakter."),
  description: z.string().min(10, "Deskripsi harus diisi, minimal 10 karakter.").max(300, "Deskripsi maksimal 300 karakter."),
  artworkFile: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "File poster harus diupload.")
    .refine(
      (files) => ["image/png", "image/jpeg"].includes(files?.[0]?.type),
      "Format file harus PNG atau JPG."
    ),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

type Step = "form" | "preview" | "submitting" | "closed";

export default function SubmitPage() {
  const [step, setStep] = useState<Step>("form");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [submissionStatus, setSubmissionStatus] = useState<boolean | null>(null);


  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      name: "",
      class: undefined,
      title: "",
      description: "",
      artworkFile: undefined,
    },
    mode: "onChange"
  });

  useEffect(() => {
      getSubmissionStatus().then(status => {
          setSubmissionStatus(status);
          if (!status) setStep("closed");
      })
  }, []);

  const handlePreview = (data: SubmissionFormValues) => {
    if (data.artworkFile && data.artworkFile[0]) {
      const url = URL.createObjectURL(data.artworkFile[0]);
      setPreviewUrl(url);
      setStep("preview");
    }
  };
  
  const handleBackToForm = () => {
    setStep("form");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  async function onFinalSubmit() {
    setStep("submitting");
    const data = form.getValues();
    const formData = new FormData();

    let finalFile = data.artworkFile?.[0];

    if (!finalFile) {
      toast({
        variant: "destructive",
        title: "File Tidak Ditemukan",
        description: "Silakan pilih file karya untuk diunggah.",
      });
      setStep("form");
      return;
    }

    // Compress image if it's larger than MAX_FILE_SIZE_MB
    if (finalFile.size > MAX_FILE_SIZE_BYTES) {
        toast({
            title: 'Ukuran file besar terdeteksi',
            description: `File Anda sedang dikompres menjadi di bawah ${MAX_FILE_SIZE_MB}MB. Mohon tunggu...`
        });
        try {
            const options = {
                maxSizeMB: MAX_FILE_SIZE_MB,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            };
            const compressedFile = await imageCompression(finalFile, options);
            finalFile = new File([compressedFile], finalFile.name, { type: finalFile.type });
        } catch (error) {
            console.error("Image compression error: ", error);
            toast({
                variant: "destructive",
                title: "Gagal Kompres Gambar",
                description: "Terjadi kesalahan saat mengompres gambar. Silakan coba unggah file yang lebih kecil.",
            });
            setStep("preview");
            return;
        }
    }
    
    formData.append('name', data.name);
    formData.append('class', data.class);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('artworkFile', finalFile, finalFile.name);

    const result = await submitArtwork(formData);

    if (result.success) {
      toast({
        title: "Karya Berhasil Diunggah!",
        description: "Terima kasih atas partisipasimu. Karyamu akan segera ditinjau oleh admin.",
      });
      router.push("/submit/thank-you");
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Mengunggah Karya",
        description: result.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
      setStep("preview"); // Return to preview on error
    }
  }
  
  if (submissionStatus === null) {
      return <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Card className="bg-card/50">
            <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-10 w-1/4 ml-auto" />
            </CardContent>
        </Card>
      </div>
  }
  
  if (step === "closed") {
       return (
        <div className="text-center py-20">
            <h1 className="text-4xl font-bold font-headline">Pendaftaran Ditutup</h1>
            <p className="text-muted-foreground mt-4">Maaf, waktu untuk mengunggah karya telah berakhir.</p>
            <Button asChild className="mt-8">
                <Link href="/">Kembali ke Beranda</Link>
            </Button>
        </div>
        );
  }

  const formData = form.watch();

  return (
    <div className="max-w-4xl mx-auto">
      {step !== "preview" ? (
         <>
            <h1 className="text-4xl font-bold font-headline">Kirim Karya Anda</h1>
            <p className="text-muted-foreground mt-2">
                Isi detail Anda dan unggah poster infografis terbaik Anda.
            </p>
         </>
      ) : (
         <>
            <h1 className="text-4xl font-bold font-headline">Pratinjau Pengiriman Anda</h1>
            <p className="text-muted-foreground mt-2">
                Periksa kembali semua detail dengan teliti sebelum mengirimkan karya Anda.
            </p>
         </>
      )}

      <Card className="mt-10 bg-card/50 border-border/50">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handlePreview)}>
            <div className={step === "form" ? "block" : "hidden"}>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                            <Input placeholder="contoh: Budi Sanjaya" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Kelas</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kelas Anda" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Judul Karya</FormLabel>
                    <FormControl>
                        <Input placeholder="contoh: Inovasi Masa Depan" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Deskripsi Singkat</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Ceritakan sedikit tentang karya Anda..."
                        className="resize-none"
                        {...field}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="artworkFile"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                    <FormLabel>File Poster (PNG/JPG, maks {MAX_FILE_SIZE_MB}MB)</FormLabel>
                    <FormControl>
                        <Input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => onChange(e.target.files)}
                        {...rest}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
              </CardContent>
              <CardContent className="flex justify-end pt-2">
                <Button type="submit">
                  <Eye className="mr-2" />
                  Tinjau Pengiriman
                </Button>
              </CardContent>
            </div>
          </form>
        </FormProvider>
        
        {step !== "form" && (
             <CardContent className="pt-6 space-y-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {previewUrl ? (
                         <div className="aspect-[3/4] w-full relative rounded-lg overflow-hidden bg-muted/30 border border-dashed">
                            <Image
                                src={previewUrl}
                                alt="Pratinjau Karya"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ): (
                        <div className="aspect-[3/4] w-full bg-muted/30 rounded-lg flex items-center justify-center border-dashed">
                            <p className="text-muted-foreground">Gagal memuat pratinjau</p>
                        </div>
                    )}
                   
                    <div className="space-y-6">
                         <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Judul Karya</h3>
                            <p className="font-semibold text-lg">{formData.title}</p>
                        </div>
                         <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Peserta</h3>
                            <p className="font-semibold">{formData.name} (Kelas {formData.class})</p>
                        </div>
                         <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Deskripsi</h3>
                            <p className="text-sm leading-relaxed">{formData.description}</p>
                        </div>
                         <div>
                            <h3 className="text-sm font-medium text-muted-foreground">Nama File</h3>
                            <p className="text-sm text-muted-foreground">{formData.artworkFile?.[0]?.name}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col-reverse sm:flex-row-reverse sm:justify-between items-center gap-4">
                    <Button onClick={onFinalSubmit} disabled={step === 'submitting'} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto shadow-lg shadow-primary/20">
                        {step === 'submitting' ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mengirim...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2" />
                                Konfirmasi & Kirim
                            </>
                        )}
                    </Button>
                    <Button variant="outline" onClick={handleBackToForm} disabled={step === 'submitting'} className="w-full sm:w-auto">
                        <ArrowLeft className="mr-2" />
                        Kembali & Edit
                    </Button>
                </div>
            </CardContent>
        )}
      </Card>
    </div>
  );
}

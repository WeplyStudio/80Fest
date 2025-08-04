
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Send, ArrowLeft, Eye, XCircle } from "lucide-react";
import { submitArtwork, getSubmissionStatus, getFormFields } from "@/lib/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import imageCompression from 'browser-image-compression';
import type { FormFieldDefinition } from "@/lib/types";

const classes = ["VII", "VIII", "IX"] as const;
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const baseSchema = z.object({
  name: z.string().min(3, "Nama harus diisi, minimal 3 karakter."),
  class: z.enum(classes, { required_error: "Kelas harus dipilih." }),
  title: z.string().min(5, "Judul karya harus diisi, minimal 5 karakter."),
  description: z.string().min(10, "Deskripsi harus diisi, minimal 10 karakter.").max(300, "Deskripsi maksimal 300 karakter."),
  artworkFile: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "File poster harus diupload.")
});


type Step = "form" | "preview" | "submitting" | "closed";

const buildSchemaAndDefaults = (fields: FormFieldDefinition[]) => {
    const customFieldsShape: Record<string, z.ZodType<any, any>> = {};
    const customDefaults: Record<string, any> = {};

    fields.forEach(field => {
        const fieldName = `custom_${field.name}`;
        if (field.type === 'file') {
            let fileSchema = z.custom<FileList>().optional();
            if (field.required) {
                fileSchema = fileSchema.refine(files => files && files.length > 0, `${field.label} harus diupload.`);
            }
            customFieldsShape[fieldName] = fileSchema;
            customDefaults[fieldName] = undefined;
        } else {
            let fieldSchema: z.ZodType<any, any> = z.string();
            if (field.type === 'select' && field.options) {
                const options = field.options as [string, ...string[]];
                if(options.length > 0) {
                   fieldSchema = z.enum(options);
                }
            }
            if (field.required) {
                fieldSchema = fieldSchema.min(1, `${field.label} tidak boleh kosong.`);
            } else {
                fieldSchema = fieldSchema.optional();
            }
            customFieldsShape[fieldName] = fieldSchema;
            customDefaults[fieldName] = field.type === 'select' ? undefined : "";
        }
    });

    const fullSchema = baseSchema.extend(customFieldsShape);
    const defaultValues = {
        name: "",
        class: undefined,
        title: "",
        description: "",
        artworkFile: undefined,
        ...customDefaults,
    };
    
    return { schema: fullSchema, defaults: defaultValues };
};


export default function SubmitPage() {
  const [step, setStep] = useState<Step>("form");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [customFilePreviews, setCustomFilePreviews] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();
  const [submissionStatus, setSubmissionStatus] = useState<boolean | null>(null);
  const [formFields, setFormFields] = useState<FormFieldDefinition[] | null>(null);
  
  const { schema, defaults } = useMemo(() => buildSchemaAndDefaults(formFields || []), [formFields]);

  const form = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: defaults,
  });
  
  useEffect(() => {
     form.reset(defaults);
  }, [form, defaults]);

  useEffect(() => {
    Promise.all([getSubmissionStatus(), getFormFields()])
      .then(([status, fields]) => {
        setSubmissionStatus(status);
        if (!status) {
          setStep("closed");
        } else {
          setFormFields(fields);
        }
      })
      .catch(err => {
        toast({ variant: 'destructive', title: 'Gagal memuat konfigurasi formulir.' });
        setStep("closed");
      });
  }, [toast]);
  

  const handlePreview = (data: z.infer<typeof schema>) => {
    if (data.artworkFile && data.artworkFile[0]) {
      const url = URL.createObjectURL(data.artworkFile[0]);
      setPreviewUrl(url);
    }

    const filePreviews: Record<string, string> = {};
    formFields?.forEach(field => {
        if (field.type === 'file') {
            const fileList = data[`custom_${field.name}`] as FileList | undefined;
            if (fileList && fileList[0]) {
                filePreviews[field.name] = fileList[0].name;
            }
        }
    });
    setCustomFilePreviews(filePreviews);
    setStep("preview");
  };
  
  const handleBackToForm = () => {
    setStep("form");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCustomFilePreviews({});
  };

  async function onFinalSubmit() {
    setStep("submitting");
    const data = form.getValues();
    const formData = new FormData();

    let artworkFile = data.artworkFile?.[0];

    if (!artworkFile) {
      toast({
        variant: "destructive",
        title: "File Poster Tidak Ditemukan",
        description: "Silakan pilih file poster utama untuk diunggah.",
      });
      setStep("form");
      return;
    }

    // Compress image if it's larger than MAX_FILE_SIZE_MB
    if (artworkFile.size > MAX_FILE_SIZE_BYTES) {
        toast({
            title: 'Ukuran file besar terdeteksi',
            description: `File Anda (${artworkFile.name}) sedang dikompres. Mohon tunggu...`
        });
        try {
            const compressedFile = await imageCompression(artworkFile, {
                maxSizeMB: MAX_FILE_SIZE_MB,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            artworkFile = new File([compressedFile], artworkFile.name, { type: artworkFile.type });
        } catch (error) {
            console.error("Image compression error: ", error);
            toast({
                variant: "destructive",
                title: "Gagal Kompres Gambar",
                description: "Silakan coba unggah file yang lebih kecil.",
            });
            setStep("preview");
            return;
        }
    }
    
    // Append standard fields
    formData.append('name', data.name);
    formData.append('class', data.class);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('artworkFile', artworkFile, artworkFile.name);

    // Append custom fields
    formFields?.forEach(field => {
        const fieldName = `custom_${field.name}`;
        if (field.type === 'file') {
            const fileList = data[fieldName] as FileList | undefined;
            if (fileList && fileList[0]) {
                formData.append(fieldName, fileList[0], fileList[0].name);
            }
        } else {
             const value = data[fieldName];
            if (value !== undefined && value !== null && value !== '') {
                formData.append(fieldName, String(value));
            }
        }
    });
    
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
             <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold font-headline">Pendaftaran Ditutup</h1>
            <p className="text-muted-foreground mt-4">Maaf, waktu untuk mengunggah karya telah berakhir atau situs sedang dalam pemeliharaan.</p>
            <Button asChild className="mt-8">
                <Link href="/">Kembali ke Beranda</Link>
            </Button>
        </div>
        );
  }

  const formData = form.watch();

  const renderCustomField = (field: FormFieldDefinition) => {
    const fieldName = `custom_${field.name}` as const;
    
    if (field.type === 'file') {
        return (
             <FormField
                key={field.name}
                control={form.control}
                name={fieldName}
                render={({ field: { onChange, value, ...rest } }) => (
                     <FormItem>
                        <FormLabel>{field.label} {field.required ? '' : <span className="text-muted-foreground text-xs">(Opsional)</span>}</FormLabel>
                        <FormControl>
                            <Input
                                type="file"
                                onChange={(e) => onChange(e.target.files)}
                                {...rest}
                                />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
             />
        )
    }

    if (field.type === 'select' && field.options) {
        return (
             <FormField
                key={field.name}
                control={form.control}
                name={fieldName}
                render={({ field: fieldProps }) => (
                    <FormItem>
                        <FormLabel>{field.label} {field.required ? '' : <span className="text-muted-foreground text-xs">(Opsional)</span>}</FormLabel>
                        <Select onValueChange={fieldProps.onChange} defaultValue={fieldProps.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Pilih ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )
    }

    // Default to text input
    return (
         <FormField
            key={field.name}
            control={form.control}
            name={fieldName}
            render={({ field: fieldProps }) => (
                <FormItem>
                    <FormLabel>{field.label} {field.required ? '' : <span className="text-muted-foreground text-xs">(Opsional)</span>}</FormLabel>
                    <FormControl>
                        <Input placeholder={`Masukkan ${field.label.toLowerCase()}...`} {...fieldProps} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )
  }

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
                 <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl font-headline">Informasi Dasar</CardTitle>
                </CardHeader>
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
                    <FormLabel>File Poster Utama (PNG/JPG, maks {MAX_FILE_SIZE_MB}MB)</FormLabel>
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

                {/* Dynamic Custom Fields */}
                 {formFields && formFields.length > 0 && (
                    <CardHeader className="p-0 mt-8 mb-4">
                        <CardTitle className="text-xl font-headline">Informasi Tambahan</CardTitle>
                    </CardHeader>
                 )}
                {formFields?.map(customField => renderCustomField(customField))}

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
                            <h3 className="text-sm font-medium text-muted-foreground">File Poster Utama</h3>
                            <p className="text-sm text-muted-foreground">{formData.artworkFile?.[0]?.name}</p>
                        </div>
                        {formFields?.map(field => {
                            const value = formData[`custom_${field.name}`];
                            if (!value) return null;

                            let displayValue: string;
                             if (field.type === 'file' && value instanceof FileList) {
                                displayValue = value[0]?.name || 'Tidak ada file';
                            } else {
                                displayValue = String(value);
                            }
                            
                            if (displayValue && displayValue !== 'Tidak ada file') {
                                return (
                                    <div key={field.name}>
                                        <h3 className="text-sm font-medium text-muted-foreground">{field.label}</h3>
                                        <p className="text-sm leading-relaxed">{displayValue}</p>
                                    </div>
                                )
                            }
                            return null;
                        })}
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

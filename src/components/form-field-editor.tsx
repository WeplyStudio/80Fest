
"use client";

import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { updateFormFields } from "@/lib/actions";
import { FormFieldDefinition } from "@/lib/types";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

const formFieldSchema = z.object({
    name: z.string().min(1, "Nama kolom harus diisi.").regex(/^[a-z0-9_]+$/, "Nama kolom hanya boleh berisi huruf kecil, angka, dan garis bawah (_)."),
    label: z.string().min(1, "Label harus diisi."),
    type: z.literal('text'),
    required: z.boolean(),
});

const editorSchema = z.object({
    fields: z.array(formFieldSchema),
});

type EditorFormValues = z.infer<typeof editorSchema>;

interface FormFieldEditorProps {
    initialFields: FormFieldDefinition[];
}

export function FormFieldEditor({ initialFields }: FormFieldEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<EditorFormValues>({
        resolver: zodResolver(editorSchema),
        defaultValues: {
            fields: initialFields || [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "fields",
    });

    const onSubmit = async (data: EditorFormValues) => {
        setIsSubmitting(true);
        const result = await updateFormFields(data.fields);

        if (result.success) {
            toast({
                title: "Formulir Pendaftaran Diperbarui",
                description: "Perubahan telah disimpan dan akan tampil untuk pendaftar baru.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Gagal Menyimpan",
                description: result.message || "Terjadi kesalahan pada server.",
            });
        }
        setIsSubmitting(false);
    };
    
    const handleAddClick = () => {
         append({
            name: `kolom_baru_${fields.length + 1}`,
            label: "",
            type: "text",
            required: false,
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Editor Formulir Pendaftaran</CardTitle>
                <CardDescription>
                    Tambah atau hapus kolom tambahan pada formulir pengiriman karya. Saat ini hanya mendukung kolom teks.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {fields.length > 0 ? fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-end p-3 border rounded-lg bg-muted/30">
                                <div className="grid grid-cols-2 gap-2 flex-grow">
                                    <div className="space-y-1">
                                        <Label>Nama Kolom (ID unik)</Label>
                                        <Input
                                            {...form.register(`fields.${index}.name`)}
                                            placeholder="misal: asal_sekolah"
                                        />
                                        {form.formState.errors.fields?.[index]?.name && <p className="text-xs text-destructive">{form.formState.errors.fields[index]?.name?.message}</p>}
                                    </div>
                                    <div className="space-y-1">
                                         <Label>Label Tampilan</Label>
                                        <Input
                                            {...form.register(`fields.${index}.label`)}
                                            placeholder="misal: Asal Sekolah"
                                        />
                                         {form.formState.errors.fields?.[index]?.label && <p className="text-xs text-destructive">{form.formState.errors.fields[index]?.label?.message}</p>}
                                    </div>
                                </div>
                                 <div className="flex flex-col items-center gap-2 px-2">
                                     <Label htmlFor={`required-switch-${index}`}>Wajib?</Label>
                                    <Switch
                                        id={`required-switch-${index}`}
                                        checked={field.required}
                                        onCheckedChange={(checked) => form.setValue(`fields.${index}.required`, checked)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-4">Belum ada kolom tambahan.</p>
                        )}
                         <Button type="button" variant="outline" onClick={handleAddClick}>
                            <PlusCircle className="mr-2" />
                            Tambah Kolom
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan Struktur Formulir"
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}


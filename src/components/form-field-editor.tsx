
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
import { Loader2, PlusCircle, Trash2, GripVertical, File, ChevronDown, Type } from "lucide-react";
import { updateFormFields } from "@/lib/actions";
import { FormFieldDefinition } from "@/lib/types";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formFieldSchema = z.object({
    name: z.string().min(1, "Nama kolom wajib diisi.").regex(/^[a-z0-9_]+$/, "Gunakan huruf kecil, angka, dan _."),
    label: z.string().min(1, "Label wajib diisi."),
    type: z.enum(['text', 'select', 'file']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
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

    const { fields, append, remove, update } = useFieldArray({
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
            options: [],
        });
    }

    const handleAddOption = (fieldIndex: number) => {
        const currentOptions = form.getValues(`fields.${fieldIndex}.options`) || [];
        form.setValue(`fields.${fieldIndex}.options`, [...currentOptions, ""]);
    };

    const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
        const currentOptions = form.getValues(`fields.${fieldIndex}.options`) || [];
        currentOptions.splice(optionIndex, 1);
        form.setValue(`fields.${fieldIndex}.options`, currentOptions);
    };

    const fieldIcons = {
        text: <Type />,
        select: <ChevronDown />,
        file: <File />,
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Editor Formulir Pendaftaran</CardTitle>
                <CardDescription>
                    Tambah, edit, atau hapus kolom tambahan pada formulir pengiriman karya.
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        {fields.length > 0 ? fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 p-4 border rounded-lg bg-muted/30 relative">
                                <GripVertical className="absolute top-4 left-2 h-5 w-5 text-muted-foreground" />
                                <div className="pl-6 w-full space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div className="flex items-center justify-between border-t pt-4">
                                         <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`required-switch-${index}`}>Wajib?</Label>
                                                <Switch
                                                    id={`required-switch-${index}`}
                                                    checked={field.required}
                                                    onCheckedChange={(checked) => form.setValue(`fields.${index}.required`, checked)}
                                                />
                                            </div>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="sm" className="capitalize">
                                                        {fieldIcons[field.type]}
                                                        {field.type}
                                                        <ChevronDown className="ml-2 h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => form.setValue(`fields.${index}.type`, 'text')}>
                                                        <Type className="mr-2" /> Teks
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem onSelect={() => form.setValue(`fields.${index}.type`, 'select')}>
                                                        <ChevronDown className="mr-2" /> Dropdown
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem onSelect={() => form.setValue(`fields.${index}.type`, 'file')}>
                                                        <File className="mr-2" /> Upload File
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                         </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="mr-2" /> Hapus
                                        </Button>
                                    </div>

                                    {form.watch(`fields.${index}.type`) === 'select' && (
                                        <div className="space-y-2 p-3 bg-background/50 rounded-md border">
                                            <Label>Pilihan Dropdown</Label>
                                            {form.watch(`fields.${index}.options`)?.map((_, optionIndex) => (
                                                <div key={optionIndex} className="flex items-center gap-2">
                                                    <Input
                                                        {...form.register(`fields.${index}.options.${optionIndex}`)}
                                                        placeholder={`Pilihan ${optionIndex + 1}`}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive h-8 w-8"
                                                        onClick={() => handleRemoveOption(index, optionIndex)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddOption(index)}
                                            >
                                                <PlusCircle className="mr-2" /> Tambah Pilihan
                                            </Button>
                                        </div>
                                    )}
                                </div>
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

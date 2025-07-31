
"use server";

import { z } from "zod";
import { getArtworksCollection } from "./mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import type { Artwork } from "./types";

const submissionSchema = z.object({
  name: z.string().min(1),
  class: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  artworkFile: z.any(),
});

// Helper function to convert a file to a Data URI
async function fileToDataUri(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function getArtworks(): Promise<Artwork[]> {
    const collection = await getArtworksCollection();
    const artworksFromDb = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Convert ObjectId to string for client-side usage and remove the original _id
    return artworksFromDb.map(art => {
        const { _id, ...rest } = art;
        return {
            ...rest,
            id: _id.toString(),
        } as Artwork;
    });
}

export async function submitArtwork(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());
  
  // The 'artworkFile' from FormData will be a File object
  const file = formData.get('artworkFile') as File | null;

  // Basic validation for the file
  if (!file || file.size === 0) {
      return { success: false, message: 'File poster tidak valid atau kosong.' };
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { success: false, message: 'Ukuran file maksimal 5MB.' };
  }
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return { success: false, message: 'Format file harus PNG atau JPG.' };
  }

  const parsed = submissionSchema.safeParse(rawFormData);
  if (!parsed.success) {
      return { success: false, message: 'Data tidak valid.' };
  }

  try {
    const artworks = await getArtworksCollection();
    const imageUrl = await fileToDataUri(file);

    await artworks.insertOne({
      ...parsed.data,
      imageUrl: imageUrl,
      imageHint: "poster design", // This can be improved with AI later
      status_juara: 0,
      createdAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/gallery");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan karya:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

export async function setWinnerStatus(artworkId: string, rank: number) {
    try {
        const artworks = await getArtworksCollection();

        // Remove the rank from any current holder of that rank
        await artworks.updateOne({ status_juara: rank }, { $set: { status_juara: 0 } });

        // Assign the new rank
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: { status_juara: rank } }
        );

        revalidatePath('/admin');
        revalidatePath('/leaderboard');
        return { success: true };
    } catch (error) {
        console.error("Gagal mengatur pemenang:", error);
        return { success: false, message: 'Gagal memperbarui status juara.' };
    }
}

export async function removeWinnerStatus(artworkId: string) {
    try {
        const artworks = await getArtworksCollection();
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: { status_juara: 0 } }
        );
        revalidatePath('/admin');
        revalidatePath('/leaderboard');
        return { success: true };
    } catch (error) {
        console.error("Gagal menghapus status pemenang:", error);
        return { success: false, message: 'Gagal menghapus status juara.' };
    }
}

export async function deleteArtwork(artworkId: string) {
    try {
        const artworks = await getArtworksCollection();
        await artworks.deleteOne({ _id: new ObjectId(artworkId) });
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Gagal menghapus karya:", error);
        return { success: false, message: 'Gagal menghapus karya.' };
    }
}

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
  // We'll just validate that a file is present on the client side for now.
  // In a real app, this would handle the file upload to a storage service.
  artworkFile: z.any(),
});

export async function getArtworks(): Promise<Artwork[]> {
    const collection = await getArtworksCollection();
    const artworks = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Convert ObjectId to string for client-side usage
    return artworks.map(art => ({
        ...art,
        id: art._id.toString(),
    })) as unknown as Artwork[];
}

export async function submitArtwork(formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());

  const parsed = submissionSchema.safeParse(rawFormData);
  if (!parsed.success) {
      return { success: false, message: 'Data tidak valid.' };
  }

  try {
    const artworks = await getArtworksCollection();
    await artworks.insertOne({
      ...parsed.data,
      // In a real app, you would upload the file to a cloud storage
      // and save the URL here. For now, we use a placeholder.
      imageUrl: "https://placehold.co/600x800.png",
      imageHint: "poster design",
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

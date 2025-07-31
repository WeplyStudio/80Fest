
"use server";

import { z } from "zod";
import { getArtworksCollection, getSettingsCollection } from "./mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import type { Artwork } from "./types";

const submissionSchema = z.object({
  name: z.string().min(1),
  class: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  // artworkFile is not part of the base schema as it's handled separately
});

const editSchema = submissionSchema.omit({ artworkFile: true });

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
            votes: art.votes ?? 0, // Ensure votes is not undefined
        } as Artwork;
    });
}

export async function submitArtwork(formData: FormData) {
  const isSubmissionOpen = await getSubmissionStatus();
  if (!isSubmissionOpen) {
    return { success: false, message: 'Pendaftaran sudah ditutup.' };
  }
  
  const rawFormData = Object.fromEntries(formData.entries());
  
  const file = formData.get('artworkFile') as File | null;

  if (!file || file.size === 0) {
      return { success: false, message: 'File poster tidak valid atau kosong.' };
  }
  if (file.size > 25 * 1024 * 1024) {
      return { success: false, message: 'Ukuran file maksimal 25MB.' };
  }
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
      return { success: false, message: 'Format file harus PNG atau JPG.' };
  }

  // We only parse the text fields, file is handled separately
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
      imageHint: "poster design",
      status_juara: 0,
      isInGallery: false, // Default to not being in the gallery
      votes: 0, // Initialize votes to 0
      createdAt: new Date(),
    });

    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan karya:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

export async function updateArtwork(artworkId: string, formData: FormData) {
    const rawFormData = Object.fromEntries(formData.entries());
    const parsed = editSchema.safeParse(rawFormData);

    if (!parsed.success) {
        return { success: false, message: 'Data tidak valid.' };
    }

    try {
        const artworks = await getArtworksCollection();
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: parsed.data }
        );

        revalidatePath('/admin');
        revalidatePath('/');
        revalidatePath('/leaderboard');
        return { success: true };
    } catch (error) {
        console.error("Gagal memperbarui data:", error);
        return { success: false, message: "Gagal memperbarui data karya." };
    }
}


export async function setWinnerStatus(artworkId: string, rank: number) {
    try {
        const artworks = await getArtworksCollection();

        // Remove the rank from any current holder of that rank
        await artworks.updateOne({ status_juara: rank }, { $set: { status_juara: 0 } });

        // Assign the new rank and add to gallery
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: { status_juara: rank, isInGallery: true } }
        );

        revalidatePath('/admin');
        revalidatePath('/leaderboard');
        revalidatePath('/');
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

export async function toggleGalleryStatus(artworkId: string, currentStatus: boolean) {
    try {
        const artworks = await getArtworksCollection();
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: { isInGallery: !currentStatus } }
        );
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Gagal mengubah status galeri:", error);
        return { success: false, message: 'Gagal mengubah status galeri.' };
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

// --- Submission Status Actions ---

export async function getSubmissionStatus(): Promise<boolean> {
    try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key: "submission" });
        // If not set, default to open (true)
        return config ? config.isOpen : true;
    } catch (error) {
        console.error("Gagal mengambil status pendaftaran:", error);
        // Default to true in case of error to be safe
        return true;
    }
}

export async function setSubmissionStatus(isOpen: boolean) {
    try {
        const settings = await getSettingsCollection();
        await settings.updateOne(
            { key: "submission" },
            { $set: { isOpen: isOpen } },
            { upsert: true }
        );
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true, newState: isOpen };
    } catch (error) {
        console.error("Gagal mengubah status pendaftaran:", error);
        return { success: false, message: "Gagal mengubah status pendaftaran." };
    }
}

// --- Voting Actions ---
export async function addVote(artworkId: string) {
    try {
        const artworks = await getArtworksCollection();
        const result = await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $inc: { votes: 1 } }
        );

        if (result.modifiedCount === 0) {
            return { success: false, message: "Karya tidak ditemukan." };
        }
        
        revalidatePath('/');
        revalidatePath('/leaderboard');
        return { success: true };
    } catch (error) {
        console.error("Gagal menambahkan suara:", error);
        return { success: false, message: "Gagal memberikan suara." };
    }
}

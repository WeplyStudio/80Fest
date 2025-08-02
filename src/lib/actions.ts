
"use server";

import { z } from "zod";
import { getArtworksCollection, getSettingsCollection } from "./mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import type { Artwork, JudgeScore, Comment, ScoreCriteria } from "./types";

// Helper to revalidate all important paths
function revalidateAll() {
    revalidatePath("/", "layout");
}

const classes = ["VII", "VIII", "IX"] as const;

const submissionSchema = z.object({
  name: z.string().min(1),
  class: z.enum(classes),
  title: z.string().min(1),
  description: z.string().min(1),
});

const editSchema = submissionSchema;

// Helper function to convert a file to a Data URI
async function fileToDataUri(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

// Helper to convert DB doc to Artwork type
function docToArtwork(doc: any): Artwork {
    if (!doc) return doc;
    const { _id, ...rest } = doc;
    
    // Process comments to ensure IDs are strings
    const processedComments = (doc.comments || []).map((c: any) => ({
        ...c,
        id: c.id.toString(),
        parentId: c.parentId ? c.parentId.toString() : null,
        replies: [] // Replies are constructed on the client
    }));

    return {
        ...rest,
        id: _id.toString(),
        scores: doc.scores || [],
        totalPoints: doc.totalPoints || 0,
        comments: processedComments,
        createdAt: doc.createdAt,
    } as Artwork;
}


export async function getArtworks(): Promise<Artwork[]> {
    const collection = await getArtworksCollection();
    const artworksFromDb = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return artworksFromDb.map(docToArtwork);
}

export async function getArtworkById(id: string): Promise<Artwork | null> {
    try {
        if (!ObjectId.isValid(id)) {
            return null;
        }
        const collection = await getArtworksCollection();
        const artwork = await collection.findOne({ _id: new ObjectId(id) });
        if (!artwork) {
            return null;
        }
        return docToArtwork(artwork);
    } catch (error) {
        console.error("Error fetching artwork by ID:", error);
        return null;
    }
}

export async function getSuggestedArtworks(currentId: string, limit: number = 4): Promise<Artwork[]> {
     try {
        if (!ObjectId.isValid(currentId)) {
            return [];
        }
        const collection = await getArtworksCollection();
        const suggestions = await collection.aggregate([
            { $match: { _id: { $ne: new ObjectId(currentId) }, isInGallery: true } },
            { $sample: { size: limit } }
        ]).toArray();
        return suggestions.map(docToArtwork);
    } catch (error) {
        console.error("Error fetching suggested artworks:", error);
        return [];
    }
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
  if (file.size > 10 * 1024 * 1024) { // 10MB limit on server
      return { success: false, message: 'Ukuran file maksimal 10MB.' };
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
      scores: [],
      totalPoints: 0,
      isDisqualified: false,
      disqualificationReason: null,
      isInGallery: false,
      comments: [],
      createdAt: new Date(),
    });

    revalidateAll();
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

        revalidatePath(`/karya/${artworkId}`);
        revalidatePath(`/admin`);
        revalidatePath(`/judge`);
        return { success: true };
    } catch (error) {
        console.error("Gagal memperbarui data:", error);
        return { success: false, message: "Gagal memperbarui data karya." };
    }
}


export async function toggleGalleryStatus(artworkId: string, currentStatus: boolean) {
    try {
        const artworks = await getArtworksCollection();
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: { isInGallery: !currentStatus } }
        );
        revalidateAll();
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
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal menghapus karya:", error);
        return { success: false, message: 'Gagal menghapus karya.' };
    }
}

export async function disqualifyArtwork(artworkId: string, reason: string, isDisqualified: boolean) {
    try {
        const artworks = await getArtworksCollection();
        const updateData: any = {
            isDisqualified: isDisqualified,
            disqualificationReason: isDisqualified ? reason : null,
        };
        if (isDisqualified) {
            updateData.totalPoints = 0;
            updateData.scores = [];
        }

        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: updateData }
        );
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal mengubah status diskualifikasi:", error);
        return { success: false, message: 'Gagal mengubah status diskualifikasi.' };
    }
}


const criteriaSchema = z.object({
  theme_match: z.number().min(1).max(10),
  layout: z.number().min(1).max(10),
  typography_color: z.number().min(1).max(10),
  content_clarity: z.number().min(1).max(10),
});

export async function givePoints(artworkId: string, judgeName: string, criteria: ScoreCriteria) {
    const parsedCriteria = criteriaSchema.safeParse(criteria);
    if (!parsedCriteria.success) {
        return { success: false, message: 'Data kriteria tidak valid.' };
    }

    try {
        const artworks = await getArtworksCollection();
        const artwork = await artworks.findOne({ _id: new ObjectId(artworkId) });

        if (!artwork) {
            return { success: false, message: "Karya tidak ditemukan." };
        }
        
        if (artwork.isDisqualified) {
            return { success: false, message: "Tidak dapat menilai karya yang telah didiskualifikasi." };
        }

        // Filter out the old score from this judge, if it exists
        const otherScores: JudgeScore[] = (artwork.scores || []).filter(s => s.judgeName !== judgeName);
        
        const newScore: JudgeScore = {
            judgeName: judgeName,
            criteria: parsedCriteria.data,
            totalScore: Object.values(parsedCriteria.data).reduce((sum, val) => sum + val, 0)
        }

        const newScores = [...otherScores, newScore];
        const totalPoints = newScores.reduce((acc, curr) => acc + curr.totalScore, 0);

        const result = await artworks.findOneAndUpdate(
            { _id: new ObjectId(artworkId) },
            { $set: { scores: newScores, totalPoints: totalPoints } },
            { returnDocument: 'after' }
        );

        revalidatePath(`/judge`);
        
        return { success: true, updatedArtwork: docToArtwork(result) };

    } catch (error) {
        console.error("Gagal memberikan poin:", error);
        return { success: false, message: "Terjadi kesalahan pada server." };
    }
}

const commentSchema = z.object({
  commentText: z.string().min(1, "Komentar tidak boleh kosong.").max(500, "Komentar maksimal 500 karakter."),
});

export async function addComment(artworkId: string, formData: FormData, parentId: string | null) {
    const rawFormData = Object.fromEntries(formData.entries());
    const parsed = commentSchema.safeParse(rawFormData);
    
    if (!parsed.success) {
        return { success: false, message: parsed.error.errors[0].message };
    }

    try {
        const artworks = await getArtworksCollection();
        const newComment = {
            id: new ObjectId(),
            text: parsed.data.commentText,
            createdAt: new Date(),
            parentId: parentId ? new ObjectId(parentId) : null,
        };

        const result = await artworks.findOneAndUpdate(
            { _id: new ObjectId(artworkId) },
            { $push: { comments: newComment } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return { success: false, message: "Karya tidak ditemukan." };
        }
        
        revalidatePath(`/karya/${artworkId}`);

        return { success: true, updatedArtwork: docToArtwork(result) };

    } catch (error) {
        console.error("Gagal menambahkan komentar:", error);
        return { success: false, message: "Terjadi kesalahan pada server." };
    }
}


// --- Submission Status Actions ---

export async function getSubmissionStatus(): Promise<boolean> {
    try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key: "submission" });
        return config ? config.isOpen : true;
    } catch (error) {
        console.error("Gagal mengambil status pendaftaran:", error);
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
        revalidateAll();
        return { success: true, newState: isOpen };
    } catch (error) {
        console.error("Gagal mengubah status pendaftaran:", error);
        return { success: false, message: "Gagal mengubah status pendaftaran." };
    }
}


// --- Leaderboard Status Actions ---

export async function getLeaderboardStatus(): Promise<boolean> {
    try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key: "leaderboard" });
        return config ? config.showResults : false;
    } catch (error) {
        console.error("Gagal mengambil status leaderboard:", error);
        return false;
    }
}

export async function setLeaderboardStatus(showResults: boolean) {
    try {
        const settings = await getSettingsCollection();
        await settings.updateOne(
            { key: "leaderboard" },
            { $set: { showResults } },
            { upsert: true }
        );
        revalidateAll();
        return { success: true, newState: showResults };
    } catch (error) {
        console.error("Gagal mengubah status leaderboard:", error);
        return { success: false, message: "Gagal mengubah status leaderboard." };
    }
}


"use server";

import { z } from "zod";
import { getArtworksCollection, getSettingsCollection } from "./mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import type { Artwork, JudgeScore, Comment, ScoreCriteria, ContestInfoData, AnnouncementBannerData, FormFieldDefinition } from "./types";
import { moderateComment } from "@/ai/flows/moderate-comment-flow";

// Helper to revalidate all important paths
function revalidateAll() {
    revalidatePath("/", "layout");
    revalidatePath("/submit");
    revalidatePath("/admin");
}

const classes = ["VII", "VIII", "IX"] as const;

const baseSubmissionSchema = z.object({
  name: z.string().min(1),
  class: z.enum(classes),
  title: z.string().min(1),
  description: z.string().min(1),
});

const editSchema = baseSubmissionSchema;

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
        customData: doc.customData || {},
    } as Artwork;
}


export async function getArtworks(): Promise<Artwork[]> {
    const collection = await getArtworksCollection();
    const artworksFromDb = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return artworksFromDb.map(docToArtwork);
}

export async function getPendingComments(): Promise<Comment[]> {
    const collection = await getArtworksCollection();
    const artworksWithPendingComments = await collection.find({ "comments.isPendingModeration": true }).toArray();
    
    const pendingComments: Comment[] = [];
    artworksWithPendingComments.forEach(artwork => {
        artwork.comments.forEach((comment: any) => {
            if (comment.isPendingModeration) {
                pendingComments.push({
                    ...comment,
                    id: comment.id.toString(),
                    parentId: comment.parentId ? comment.parentId.toString() : null,
                    artworkId: artwork._id.toString(),
                    artworkTitle: artwork.title,
                });
            }
        });
    });

    return pendingComments.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            { $match: { _id: { $ne: new ObjectId(currentId) }, isInGallery: true, isDisqualified: false } },
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
  
  // Handle file
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

  // Handle custom data
  const customDataString = formData.get('customData') as string | null;
  let customData: Record<string, string> = {};
  if (customDataString) {
    try {
        customData = JSON.parse(customDataString);
    } catch (e) {
        return { success: false, message: 'Data tambahan tidak valid.' };
    }
  }

  // Dynamically build validation schema
  const formFields = await getFormFields();
  const customFieldsShape: Record<string, z.ZodType<any, any>> = {};
  formFields.forEach(field => {
    let fieldSchema: z.ZodType<any, any> = z.string();
    if (field.required) {
      fieldSchema = fieldSchema.min(1, `${field.label} tidak boleh kosong.`);
    } else {
      fieldSchema = fieldSchema.optional().or(z.literal(''));
    }
    customFieldsShape[field.name] = fieldSchema;
  });
  
  const dynamicSubmissionSchema = baseSubmissionSchema.extend({
      customData: z.object(customFieldsShape).optional()
  });

  const parsed = dynamicSubmissionSchema.safeParse({
      name: rawFormData.name,
      class: rawFormData.class,
      title: rawFormData.title,
      description: rawFormData.description,
      customData: customData
  });

  if (!parsed.success) {
      console.log(parsed.error.flatten());
      return { success: false, message: 'Data tidak valid. Periksa kembali semua kolom.' };
  }

  try {
    const artworks = await getArtworksCollection();
    const imageUrl = await fileToDataUri(file);

    await artworks.insertOne({
      ...parsed.data,
      customData: parsed.data.customData || {},
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
        revalidatePath(`/admin`);
        
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
        const artwork = await artworks.findOne({ _id: new ObjectId(artworkId) });

        if (!artwork) {
            return { success: false, message: "Karya tidak ditemukan." };
        }
        
        let finalParentId = null;
        if (parentId) {
            // Find the comment being replied to
            const parentComment = artwork.comments.find((c: any) => c.id.toString() === parentId);
            
            // If the parent comment is itself a reply (it has a parentId), use that parentId.
            // Otherwise, it's a root comment, so use its own id.
            // This ensures all replies are direct children of a root comment.
            if (parentComment) {
                 finalParentId = parentComment.parentId ? parentComment.parentId : parentComment.id;
            } else {
                 finalParentId = new ObjectId(parentId)
            }
        }
        
        // Moderate comment with AI
        const moderationResult = await moderateComment({ commentText: parsed.data.commentText });

        const newComment: Omit<Comment, 'replies'> = {
            id: new ObjectId().toString(),
            text: parsed.data.commentText,
            createdAt: new Date(),
            parentId: finalParentId ? finalParentId.toString() : null,
            isPendingModeration: !moderationResult.isAppropriate,
            moderationReason: moderationResult.reason || null,
        };

        const result = await artworks.findOneAndUpdate(
            { _id: new ObjectId(artworkId) },
            { $push: { comments: { ...newComment, id: new ObjectId(newComment.id), parentId: finalParentId } } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return { success: false, message: "Karya tidak ditemukan." };
        }
        
        revalidatePath(`/karya/${artworkId}`);
        revalidatePath(`/admin`);

        return { success: true, updatedArtwork: docToArtwork(result) };

    } catch (error) {
        console.error("Gagal menambahkan komentar:", error);
        return { success: false, message: "Terjadi kesalahan pada server." };
    }
}

export async function approveComment(artworkId: string, commentId: string) {
    try {
        const artworks = await getArtworksCollection();
        await artworks.updateOne(
            { _id: new ObjectId(artworkId), "comments.id": new ObjectId(commentId) },
            { $set: { "comments.$.isPendingModeration": false, "comments.$.moderationReason": null } }
        );
        revalidatePath(`/karya/${artworkId}`);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Gagal menyetujui komentar:", error);
        return { success: false, message: "Gagal menyetujui komentar." };
    }
}

export async function deleteCommentById(artworkId: string, commentId: string) {
    try {
        const artworks = await getArtworksCollection();
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $pull: { comments: { id: new ObjectId(commentId) } } }
        );
        revalidatePath(`/karya/${artworkId}`);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Gagal menghapus komentar:", error);
        return { success: false, message: "Gagal menghapus komentar." };
    }
}


// --- Global Settings Actions ---

async function getSetting(key: string, defaultValue: any) {
    try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key });
        return config ? config.value : defaultValue;
    } catch (error) {
        console.error(`Gagal mengambil pengaturan ${key}:`, error);
        return defaultValue;
    }
}

async function setSetting(key: string, value: any) {
    try {
        const settings = await getSettingsCollection();
        await settings.updateOne(
            { key },
            { $set: { value } },
            { upsert: true }
        );
        revalidateAll();
        return { success: true, newState: value };
    } catch (error) {
        console.error(`Gagal mengubah pengaturan ${key}:`, error);
        return { success: false, message: `Gagal mengubah pengaturan ${key}.` };
    }
}

export async function getSubmissionStatus(): Promise<boolean> {
    const isMaintenance = await getMaintenanceStatus();
    if (isMaintenance) return false;
    return getSetting("submissionOpen", true);
}

export async function setSubmissionStatus(isOpen: boolean) {
    return setSetting("submissionOpen", isOpen);
}

export async function getLeaderboardStatus(): Promise<boolean> {
    return getSetting("leaderboardVisible", false);
}

export async function setLeaderboardStatus(showResults: boolean) {
    return setSetting("leaderboardVisible", showResults);
}

export async function getMaintenanceStatus(): Promise<boolean> {
    return getSetting("maintenanceActive", false);
}

export async function setMaintenanceStatus(isActive: boolean) {
    return setSetting("maintenanceActive", isActive);
}

// --- Contest Info Actions ---

const contestInfoSchema = z.object({
  theme: z.string().min(1),
  dates: z.string().min(1),
  rules: z.string().min(1),
  criteria: z.string().min(1),
});

const defaultContestInfo: ContestInfoData = {
    theme: "Dirgahayu Republik Indonesia ke-80: Bersatu Berdaulat Rakyat Sejahtera Indonesia Maju",
    dates: "• **Pengumpulan:** 6 - 8 Agustus 2025\n• **Periode Penjurian:** 8 Agustus 2025\n• **Pengumuman Pemenang:** 9 Agustus 2025",
    rules: "• Karya harus 100% orisinal dan belum pernah dipublikasikan sebelumnya.\n• Juri dapat mendiskualifikasi karya karena plagiarisme atau pelanggaran hak cipta.\n• Format yang diterima adalah PNG atau JPG, ukuran maksimal 32MB.\n• Keputusan juri bersifat final dan tidak dapat diganggu gugat.",
    criteria: "• Kesesuaian dengan tema\n• Tata letak dan komposisi\n• Penggunaan tipografi dan warna\n• Kejelasan dan dampak konten"
};


export async function getContestInfo(): Promise<ContestInfoData> {
    try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key: "contestInfo" });
        if (config && config.data) {
            return config.data;
        }
        return defaultContestInfo;
    } catch (error) {
        console.error("Gagal mengambil info kontes:", error);
        return defaultContestInfo;
    }
}

export async function updateContestInfo(formData: FormData) {
    const rawData = {
        theme: formData.get('theme'),
        dates: formData.get('dates'),
        rules: formData.get('rules'),
        criteria: formData.get('criteria'),
    };
    const parsed = contestInfoSchema.safeParse(rawData);
     if (!parsed.success) {
        return { success: false, message: 'Semua kolom harus diisi.' };
    }

    try {
        const settings = await getSettingsCollection();
        await settings.updateOne(
            { key: "contestInfo" },
            { $set: { data: parsed.data } },
            { upsert: true }
        );
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal memperbarui info kontes:", error);
        return { success: false, message: "Gagal memperbarui info kontes." };
    }
}

// --- Announcement Banner Actions ---

const bannerSchema = z.object({
  text: z.string(),
  isEnabled: z.boolean(),
});

export async function getAnnouncementBanner(): Promise<AnnouncementBannerData> {
    try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key: "announcementBanner" });
        return {
            text: config?.text || "",
            isEnabled: config?.isEnabled || false,
        };
    } catch (error) {
        console.error("Gagal mengambil data banner:", error);
        return { text: "", isEnabled: false };
    }
}

export async function updateAnnouncementBanner(data: { text: string; isEnabled: boolean }) {
    const parsed = bannerSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, message: 'Data banner tidak valid.' };
    }
    
    try {
        const settings = await getSettingsCollection();
        await settings.updateOne(
            { key: "announcementBanner" },
            { $set: parsed.data },
            { upsert: true }
        );
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal memperbarui banner:", error);
        return { success: false, message: "Gagal memperbarui banner pengumuman." };
    }
}


// --- Form Field Actions ---

export async function getFormFields(): Promise<FormFieldDefinition[]> {
     try {
        const settings = await getSettingsCollection();
        const config = await settings.findOne({ key: "formFields" });
        return config ? config.fields : [];
    } catch (error) {
        console.error("Gagal mengambil kolom formulir:", error);
        return [];
    }
}

export async function updateFormFields(fields: FormFieldDefinition[]) {
    // Basic validation on server
    const fieldSchema = z.array(z.object({
        name: z.string().min(1).regex(/^[a-z0-9_]+$/, "Nama kolom hanya boleh berisi huruf kecil, angka, dan garis bawah."),
        label: z.string().min(1),
        type: z.literal('text'), // For now only text is supported
        required: z.boolean()
    }));

    const parsed = fieldSchema.safeParse(fields);
    if (!parsed.success) {
        return { success: false, message: parsed.error.errors[0].message };
    }
    
    try {
        const settings = await getSettingsCollection();
        await settings.updateOne(
            { key: "formFields" },
            { $set: { fields: parsed.data } },
            { upsert: true }
        );
        revalidateAll();
        return { success: true };
    } catch (error) {
        console.error("Gagal memperbarui kolom formulir:", error);
        return { success: false, message: "Gagal memperbarui kolom formulir." };
    }
}

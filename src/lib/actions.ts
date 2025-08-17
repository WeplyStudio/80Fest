
"use server";

import { z } from "zod";
import { getArtworksCollection, getSettingsCollection } from "./mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import type { Artwork, JudgeScore, ScoreCriteria, ContestInfoData, AnnouncementBannerData, FormFieldDefinition } from "./types";

// Helper to revalidate all important paths
function revalidateAll() {
    revalidatePath("/", "layout");
    revalidatePath("/submit");
    revalidatePath("/admin");
    revalidatePath("/judge", "layout");
    revalidatePath("/leaderboard");
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
    
    return {
        ...rest,
        id: _id.toString(),
        scores: doc.scores || [],
        totalPoints: doc.totalPoints || 0,
        likes: doc.likes || 0,
        createdAt: doc.createdAt,
        isOnLeaderboard: doc.isOnLeaderboard || false,
        customData: doc.customData || {},
    } as Artwork;
}


export async function getArtworks(): Promise<Artwork[]> {
    const collection = await getArtworksCollection();
    const artworksFromDb = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return artworksFromDb.map(docToArtwork);
}

export async function getGalleryArtworks(): Promise<Artwork[]> {
    const collection = await getArtworksCollection();
    const artworksFromDb = await collection.find({ isDisqualified: false }, {
        projection: {
            _id: 1,
            title: 1,
            name: 1,
            class: 1,
            imageUrl: 1, 
            likes: 1,
        }
    }).sort({ createdAt: -1 }).toArray();

    return artworksFromDb.map(doc => ({
        id: doc._id.toString(),
        title: doc.title,
        name: doc.name,
        class: doc.class,
        imageUrl: doc.imageUrl,
        likes: doc.likes || 0,
        // Provide default empty values for fields not projected
        description: "",
        scores: [],
        totalPoints: 0,
        isDisqualified: false,
        disqualificationReason: null,
        isOnLeaderboard: false,
        createdAt: new Date(),
        customData: {},
    }));
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
        const isGalleryVisible = await getGalleryStatus();
        if (!isGalleryVisible) return [];

        const collection = await getArtworksCollection();
        const suggestions = await collection.aggregate([
            { $match: { _id: { $ne: new ObjectId(currentId) }, isDisqualified: false } },
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
  
  const formFields = await getFormFields();
  const rawFormData = Object.fromEntries(formData.entries());

  // --- Base fields validation ---
  const parsedBase = baseSubmissionSchema.safeParse(rawFormData);
  if (!parsedBase.success) {
      return { success: false, message: 'Data dasar tidak valid. Periksa nama, kelas, judul, dan deskripsi.' };
  }
  
  const artworkFile = formData.get('artworkFile') as File | null;
  if (!artworkFile || artworkFile.size === 0) {
      return { success: false, message: 'File poster utama harus diunggah.' };
  }
  if (artworkFile.size > 10 * 1024 * 1024) { // 10MB limit on server
      return { success: false, message: 'Ukuran file poster utama maksimal 10MB.' };
  }
  if (!['image/png', 'image/jpeg'].includes(artworkFile.type)) {
      return { success: false, message: 'Format file poster utama harus PNG atau JPG.' };
  }
  
  const customData: Record<string, string> = {};
  const customFiles: Record<string, File> = {};

  // --- Custom fields validation and data preparation ---
  for (const field of formFields) {
      const fieldName = `custom_${field.name}`;
      const value = formData.get(fieldName);

      if (field.type === 'file') {
          if (value instanceof File && value.size > 0) {
              if(value.size > 10 * 1024 * 1024) { // 10MB limit
                  return { success: false, message: `Ukuran file untuk ${field.label} maksimal 10MB.` };
              }
              customFiles[field.name] = value;
          } else if (field.required) {
              return { success: false, message: `${field.label} harus diunggah.` };
          }
      } else {
          const stringValue = typeof value === 'string' ? value : '';
          if (field.required && !stringValue) {
              return { success: false, message: `${field.label} harus diisi.` };
          }
          if (field.type === 'select' && field.required && !field.options?.includes(stringValue)) {
              return { success: false, message: `Pilihan tidak valid untuk ${field.label}.`};
          }
          if (stringValue) {
              customData[field.name] = stringValue;
          }
      }
  }

  try {
    const artworks = await getArtworksCollection();
    
    // Upload custom files and get their data URIs
    for (const fieldName in customFiles) {
        const file = customFiles[fieldName];
        const dataUri = await fileToDataUri(file);
        // Store the data URI along with the original filename for context
        customData[fieldName] = JSON.stringify({ url: dataUri, name: file.name });
    }

    const mainImageUrl = await fileToDataUri(artworkFile);

    await artworks.insertOne({
      ...parsedBase.data,
      customData: customData,
      imageUrl: mainImageUrl,
      scores: [],
      totalPoints: 0,
      likes: 0,
      isDisqualified: false,
      disqualificationReason: null,
      isOnLeaderboard: false,
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
            updateData.likes = 0;
            updateData.isOnLeaderboard = false;
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

export async function toggleLike(artworkId: string, liked: boolean) {
    if (!ObjectId.isValid(artworkId)) {
        return { success: false, message: "ID Karya tidak valid." };
    }
    
    try {
        const artworks = await getArtworksCollection();
        const update = { $inc: { likes: liked ? 1 : -1 } };
        const result = await artworks.findOneAndUpdate(
            { _id: new ObjectId(artworkId) },
            update,
            { returnDocument: 'after' }
        );
        
        if (!result) {
            return { success: false, message: "Karya tidak ditemukan." };
        }
        
        revalidatePath(`/karya/${artworkId}`);
        revalidatePath(`/`);
        
        return { success: true, newLikes: result.likes };

    } catch (error) {
        console.error("Gagal mengubah status 'like':", error);
        return { success: false, message: "Terjadi kesalahan pada server." };
    }
}

export async function setArtworkLeaderboardStatus(artworkId: string, isOnLeaderboard: boolean) {
    try {
        const artworks = await getArtworksCollection();
        await artworks.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: { isOnLeaderboard } }
        );
        revalidatePath('/admin');
        revalidatePath('/leaderboard');
        return { success: true };
    } catch (error) {
        console.error("Gagal mengubah status leaderboard karya:", error);
        return { success: false, message: 'Gagal memperbarui status.' };
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

export async function getGalleryStatus(): Promise<boolean> {
    return getSetting("galleryVisible", true);
}

export async function setGalleryStatus(isVisible: boolean) {
    return setSetting("galleryVisible", isVisible);
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
        name: z.string().min(1, "Nama kolom harus diisi.").regex(/^[a-z0-9_]+$/, "Nama kolom hanya boleh berisi huruf kecil, angka, dan garis bawah."),
        label: z.string().min(1, "Label harus diisi."),
        type: z.enum(['text', 'select', 'file']),
        required: z.boolean(),
        options: z.array(z.string()).optional(),
    }).refine(data => {
        if (data.type === 'select') {
            return Array.isArray(data.options) && data.options.length > 0 && data.options.every(opt => typeof opt === 'string' && opt.length > 0);
        }
        return true;
    }, {
        message: 'Pilihan harus tersedia untuk tipe select.',
        path: ['options'],
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

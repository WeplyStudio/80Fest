"use server";

import { z } from "zod";

const submissionSchema = z.object({
  name: z.string(),
  class: z.string(),
  title: z.string(),
  description: z.string(),
  artworkFile: z.any(),
});

export async function submitArtwork(formData: FormData) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const rawFormData = Object.fromEntries(formData.entries());

  // In a real application, you would do the following:
  // 1. Validate the form data using Zod or another library.
  const parsed = submissionSchema.safeParse(rawFormData);
  if (!parsed.success) {
      return { success: false, message: 'Invalid data provided.' };
  }

  console.log("Received submission:");
  console.log(parsed.data);

  // 2. Upload the file (parsed.data.artworkFile) to a cloud storage service like Cloudinary.
  //    You would get a URL back from the service.
  //    e.g., const imageUrl = await uploadToCloudinary(parsed.data.artworkFile);
  
  // 3. Save the submission data, including the image URL, to a database (e.g., MongoDB).
  //    e.g., await db.collection('artworks').insertOne({ ...parsed.data, imageUrl });

  // For this mock, we'll just log it and return success.
  return { success: true };
}

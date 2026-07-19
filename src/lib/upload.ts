import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Uploads a File to Firebase Storage under the given folder and returns its
 * public download URL. Used for ID photos, selfies, license photos, store
 * logos, product photos and payment screenshots.
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

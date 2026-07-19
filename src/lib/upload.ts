import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

/**
 * Uploads a File to Firebase Storage under the given folder and returns its
 * public download URL. Used for ID photos, selfies, license photos, store
 * logos, product photos and payment screenshots.
 *
 * Throws with a human-readable message if the upload times out or Firebase
 * Storage rejects the request (bucket not configured, rules deny, CORS, etc.)
 */
export async function uploadFile(file: File, folder: string): Promise<string> {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const storageRef = ref(storage, `${folder}/${safeName}`);

  const TIMEOUT_MS = 30_000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            "File upload timed out. Please check that Firebase Storage is enabled in your Firebase project and that Storage rules are published."
          )
        ),
      TIMEOUT_MS
    )
  );

  const snapshot = await Promise.race([uploadBytes(storageRef, file), timeoutPromise]);
  return getDownloadURL(snapshot.ref);
}

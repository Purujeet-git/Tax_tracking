import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

// Must be exactly 32 bytes (64 hex chars)
const SECRET_KEY = process.env.ENCRYPTION_KEY; 

if (!SECRET_KEY) {
    throw new Error("CRITICAL: Missing ENCRYPTION_KEY in environment variables.");
}

/**
 * Secures a raw API Secret using AES-256-GCM
 */
export function encryptText(text) {
    const iv = crypto.randomBytes(16); // 16 bytes for GCM
    const key = Buffer.from(SECRET_KEY, "hex");

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');

    // We store the authTag appended to the encrypted string, separating with a colon
    return {
        encryptedSecret: `${encrypted}:${authTag}`,
        iv: iv.toString('hex')
    };
}

/**
 * Reverts an encrypted API Secret back into memory ONLY safely during Sync execution
 */
export function decryptText(encryptedPayload, ivHex) {
    const key = Buffer.from(SECRET_KEY, "hex");
    const iv = Buffer.from(ivHex, "hex");

    const parts = encryptedPayload.split(":");
    const encryptedText = parts[0];
    const authTag = Buffer.from(parts[1], "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

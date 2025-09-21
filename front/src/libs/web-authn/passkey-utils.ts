import { Hex, toHex } from "viem";
import { PasskeyPlugin } from "capacitor-passkey-plugin";
import cbor from "cbor";
import { CreateCredential, P256Credential, P256Signature } from "./types";
import { fromBase64ToHex } from "@/utils/fromBase64ToHex";
import { concatUint8Arrays } from "@/utils/arrayConcat";
import { shouldRemoveLeadingZero } from "@/utils/removeLeadingZero";

/**
 * Get a safe rpId for the current environment
 */
function getRpId(): string {
  // Check if we have a configured ngrok domain in environment
  const ngrokDomain = process.env.NEXT_PUBLIC_NGROK_DOMAIN;
  return ngrokDomain || '';
}

/**
 * Create a new passkey credential
 */
export async function createPasskey(username: string): Promise<CreateCredential | null> {
  try {
    const challenge = generateRandomChallenge();
    
    const credential = await PasskeyPlugin.createPasskey({
      publicKey: {
        challenge,
        rp: {
          name: "passkeys-4337/smart-wallet",
          id: getRpId(),
        },
        user: {
          id: generateRandomUserId(),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct",
      },
    });

    // Extract public key from attestation object
    const attestationObjectBuffer = base64URLToArrayBuffer(credential.response.attestationObject);
    const decodedAttestationObj = cbor.decode(attestationObjectBuffer);
    console.log("Decoded attestation object:", decodedAttestationObj);
    
    const authData = parseAuthenticatorDataManual(decodedAttestationObj.authData);
    
    if (!authData?.credentialPublicKey) {
      throw new Error("Failed to extract public key from credential");
    }
    
    console.log("Auth data credential public key buffer:", authData.credentialPublicKey);
    
    const publicKeyBuffer = authData.credentialPublicKey;
    const publicKey = cbor.decode(publicKeyBuffer as any);
    console.log("Decoded public key:", publicKey, "Type:", typeof publicKey);
    
    // Handle both Map and Object formats
    let x, y;
    if (publicKey instanceof Map) {
      x = publicKey.get(-2);
      y = publicKey.get(-3);
    } else if (publicKey && typeof publicKey === 'object') {
      // Handle object format - CBOR keys are numeric
      x = publicKey['-2'] || publicKey[-2];
      y = publicKey['-3'] || publicKey[-3];
    } else {
      throw new Error("Unexpected public key format: " + typeof publicKey);
    }
    
    if (!x || !y) {
      console.error("Missing x or y coordinates:", { x, y, publicKey });
      throw new Error("Failed to extract x,y coordinates from public key");
    }
    
    // Convert to hex if they're Uint8Array
    const xHex = x instanceof Uint8Array ? toHex(x) : toHex(new Uint8Array(x));
    const yHex = y instanceof Uint8Array ? toHex(y) : toHex(new Uint8Array(y));

    return {
      rawId: fromBase64ToHex(credential.rawId),
      pubKey: { x: xHex, y: yHex },
    };
  } catch (error) {
    console.error("Failed to create passkey:", error);
    return null;
  }
}

/**
 * Authenticate with an existing passkey
 */
export async function authenticatePasskey(challenge?: Hex): Promise<P256Credential | null> {
  try {
    const challengeToUse = challenge ? hexToBase64URL(challenge) : generateRandomChallenge();
    
    const credential = await PasskeyPlugin.authenticate({
      publicKey: {
        challenge: challengeToUse,
        rpId: getRpId(),
        timeout: 60000,
        userVerification: "preferred",
      },
    });

    // Parse client data
    const clientDataBuffer = base64URLToArrayBuffer(credential.response.clientDataJSON);
    const clientDataString = new TextDecoder().decode(clientDataBuffer);
    const clientDataObj = JSON.parse(clientDataString);

    // Convert signature from base64url to the format we need
    const signature = parseSignatureFromPasskey(credential.response.signature);

    return {
      rawId: fromBase64ToHex(credential.rawId),
      clientData: {
        type: clientDataObj.type,
        challenge: clientDataObj.challenge,
        origin: clientDataObj.origin,
        crossOrigin: clientDataObj.crossOrigin || false,
      },
      authenticatorData: fromBase64ToHex(credential.response.authenticatorData),
      signature,
    };
  } catch (error) {
    console.error("Failed to authenticate with passkey:", error);
    return null;
  }
}

// Manual implementation to avoid SimpleWebAuthn dependency
function parseAuthenticatorDataManual(authData: Uint8Array): {
  credentialPublicKey?: Uint8Array;
} | null {
  try {
    if (authData.length < 37) {
      return null;
    }

    // Skip RP ID hash (32 bytes) + flags (1 byte) + sign count (4 bytes) = 37 bytes
    let offset = 37;
    
    // Check if credential data is present (AT flag bit)
    const flags = authData[32];
    const hasCredentialData = (flags & 0x40) !== 0;
    
    if (!hasCredentialData) {
      return null;
    }

    // Skip AAGUID (16 bytes)
    offset += 16;
    
    // Read credential ID length (2 bytes, big endian)
    const credentialIdLength = (authData[offset] << 8) | authData[offset + 1];
    offset += 2;
    
    // Skip credential ID
    offset += credentialIdLength;
    
    // The rest is the credential public key
    const credentialPublicKey = authData.slice(offset);
    
    return { credentialPublicKey };
  } catch (error) {
    console.error("Failed to parse authenticator data:", error);
    return null;
  }
}

// Parse signature returned by PasskeyPlugin (already in the correct format)
function parseSignatureFromPasskey(signatureBase64Url: string): P256Signature {
  try {
    // Convert base64url to hex
    const signatureHex = fromBase64ToHex(signatureBase64Url);
    
    // The signature from native platforms is already in the correct format
    // but it's a DER-encoded ECDSA signature, so we need to parse it
    const signatureBytes = hexToBytes(signatureHex);
    return parseSignatureManual(signatureBytes);
  } catch (error) {
    console.error("Failed to parse passkey signature:", error);
    throw error;
  }
}

// Helper function to convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const result = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    result[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return result;
}

// Manual signature parsing to avoid SimpleWebAuthn dependency
function parseSignatureManual(signature: Uint8Array): P256Signature {
  try {
    // Parse ASN.1 DER ECDSA signature manually
    // ECDSA signature format: SEQUENCE { r INTEGER, s INTEGER }
    
    let offset = 0;
    
    // Check SEQUENCE tag (0x30)
    if (signature[offset] !== 0x30) {
      throw new Error("Invalid ASN.1 signature: missing SEQUENCE tag");
    }
    offset++; // Skip SEQUENCE tag
    
    // Skip sequence length
    const seqLength = signature[offset];
    offset++; // Skip length byte
    
    // Parse r value
    if (signature[offset] !== 0x02) {
      throw new Error("Invalid ASN.1 signature: missing INTEGER tag for r");
    }
    offset++; // Skip INTEGER tag
    
    const rLength = signature[offset];
    offset++; // Skip length byte
    
    let rBytes = signature.slice(offset, offset + rLength);
    offset += rLength;
    
    // Parse s value
    if (signature[offset] !== 0x02) {
      throw new Error("Invalid ASN.1 signature: missing INTEGER tag for s");
    }
    offset++; // Skip INTEGER tag
    
    const sLength = signature[offset];
    offset++; // Skip length byte
    
    let sBytes = signature.slice(offset, offset + sLength);
    
    // Remove leading zeros if present
    if (shouldRemoveLeadingZero(rBytes)) {
      rBytes = rBytes.slice(1);
    }
    if (shouldRemoveLeadingZero(sBytes)) {
      sBytes = sBytes.slice(1);
    }
    
    // Ensure r and s are exactly 32 bytes each, pad if necessary
    if (rBytes.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(rBytes, 32 - rBytes.length);
      rBytes = padded;
    }
    if (sBytes.length < 32) {
      const padded = new Uint8Array(32);
      padded.set(sBytes, 32 - sBytes.length);
      sBytes = padded;
    }
    
    return {
      r: toHex(rBytes.slice(-32)), // Take last 32 bytes
      s: toHex(sBytes.slice(-32)), // Take last 32 bytes
    };
  } catch (error) {
    console.error("Failed to parse signature:", error);
    throw error;
  }
}

// Utility functions
function generateRandomChallenge(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return arrayBufferToBase64URL(buffer.buffer);
}

function generateRandomUserId(): string {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return arrayBufferToBase64URL(buffer.buffer);
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? 0 : 4 - (base64.length % 4);
  const paddedBase64 = base64 + '='.repeat(padding);
  const binary = atob(paddedBase64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function hexToBase64URL(hex: Hex): string {
  const bytes = new Uint8Array(hex.slice(2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  return arrayBufferToBase64URL(bytes.buffer);
}

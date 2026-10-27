import crypto from "crypto";

// ZEGOCLOUD "Token04", generated on the server so the ServerSecret never reaches the browser.
// Format: "04" + base64( expire(int64 BE) | ivLen(u16) | iv | cipherLen(u16) | AES-CBC(json) )
export function generateToken04(
  appId: number,
  userId: string,
  secret: string,
  effectiveSeconds: number,
  payload = ""
) {
  if (secret.length !== 32) throw new Error("ZEGO_SERVER_SECRET must be 32 characters");
  const now = Math.floor(Date.now() / 1000);
  const info = {
    app_id: appId,
    user_id: userId,
    nonce: crypto.randomInt(-(2 ** 31), 2 ** 31 - 1),
    ctime: now,
    expire: now + effectiveSeconds,
    payload,
  };

  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const iv = Array.from({ length: 16 }, () => chars[crypto.randomInt(chars.length)]).join("");

  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(secret), Buffer.from(iv));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(info)), cipher.final()]);

  const expire = Buffer.alloc(8);
  expire.writeBigInt64BE(BigInt(info.expire));
  const ivLen = Buffer.alloc(2);
  ivLen.writeUInt16BE(iv.length);
  const encLen = Buffer.alloc(2);
  encLen.writeUInt16BE(encrypted.length);

  return "04" + Buffer.concat([expire, ivLen, Buffer.from(iv), encLen, encrypted]).toString("base64");
}

export function zegoConfig() {
  const appId = Number(process.env.ZEGO_APP_ID);
  const secret = process.env.ZEGO_SERVER_SECRET ?? "";
  return appId && secret ? { appId, secret } : null;
}

export const kycRoomId = (driverId: string) => `kyc_${driverId}`;

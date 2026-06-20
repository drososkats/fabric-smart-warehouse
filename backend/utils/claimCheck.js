// Claim Check pattern: large payloads (files) are uploaded directly to object
// storage (MinIO), and only a lightweight reference (the resulting URL) is
// passed downstream — e.g. into a message queue — instead of the file itself.
const fs = require("fs");

async function uploadAndGetClaimCheck(minioClient, bucket, file, prefix, vmIp) {
  const fileName = `${prefix}-${Date.now()}-${file.originalname}`;
  await minioClient.fPutObject(bucket, fileName, file.path);
  fs.unlinkSync(file.path); // clean local temp file
  return `http://${vmIp}:9000/${bucket}/${fileName}`;
}

module.exports = { uploadAndGetClaimCheck };

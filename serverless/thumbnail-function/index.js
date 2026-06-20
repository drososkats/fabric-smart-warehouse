const express = require('express');
const Minio = require('minio');
const sharp = require('sharp');

const app = express();
app.use(express.json());

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'password123',
});

app.post('/', async (req, res) => {
  console.log('Received request body:', JSON.stringify(req.body)); // Πρόσθεσε αυτό!
  res.status(200).send('OK');
  processRecords(req.body.Records || []).catch(err => console.error(err));
});

async function processRecords(records) {
  for (const record of records) {
    try {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      // Skip files that are already thumbnails to avoid infinite loops
      if (key.startsWith('thumb-')) continue;

      // Check if already processed via object tagging
      try {
        const tags = await minioClient.getObjectTagging(bucket, key);
        console.log('DEBUG tags shape:', JSON.stringify(tags));
        if (tags.some(t => t.Key === 'processed' && (t.Value === 'true' || t.Value === true))){
          console.log(`Already processed: ${key}`);
          continue;
        }
      } catch (e) { 
        // No tags found, proceed as new file
      }

      const stream = await minioClient.getObject(bucket, key);
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const inputBuffer = Buffer.concat(chunks);

      const thumbBuffer = await sharp(inputBuffer)
        .resize(200, 200, { fit: 'inside' })
        .jpeg()
        .toBuffer();

      const thumbKey = `thumb-${key}`;
      await minioClient.putObject(bucket, thumbKey, thumbBuffer, thumbBuffer.length, { 'Content-Type': 'image/jpeg' });
      
      // Mark as processed using object tags
      await minioClient.setObjectTagging(bucket, key, {
        thumbnail: thumbKey,
        processed: 'true'
      });

      console.log(`✅ Thumbnail created: ${thumbKey}`);
    } catch (err) {
      console.error(`Error processing ${record.s3.object.key}:`, err.message);
    }
  }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Thumbnail service running on port ${PORT}`));
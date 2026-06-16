const amqp = require("amqplib");
const Minio = require("minio");
require("dotenv").config();

let rabbitChannel = null;

// read the variable : process.env.MINIO_ENDPOINT
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

//init MinIO bucket
const initMinIO = async () => {
  const bucket = process.env.MINIO_BUCKET || "products";
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      await minioClient.makeBucket(bucket, "us-east-1");
      console.log(`✅ MinIO Bucket '${bucket}' created.`);
      
      // bucket(Public Read-Only) - view images
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
      console.log("Bucket policy set to Public.");
    } else {
      console.log(`✅ MinIO Bucket '${bucket}' connected.`);
    }
  } catch (err) {
    console.error("❌ MinIO Init Error:", err.message);
  }
};

// rabbitmq config - connection
const connectRabbitMQ = async () => {
  try {
    // URI from environment
    const rabbitUri = process.env.RABBITMQ_URI || "amqp://guest:guest@localhost:5672";
    const connection = await amqp.connect(rabbitUri);
    rabbitChannel = await connection.createChannel();
    await rabbitChannel.assertQueue("system_logs", { durable: false });
    console.log("✅ RabbitMQ Connected via:", rabbitUri);
    return rabbitChannel;
  } catch (err) {
    console.error("❌ RabbitMQ Connection Error:", err.message);
    return null;
  }
};

module.exports = { connectRabbitMQ, initMinIO, minioClient };
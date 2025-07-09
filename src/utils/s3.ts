import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadImageToS3 = async (file: Express.Multer.File) => {
  const fileKey = `products/${Date.now()}_${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: "public-read",
  });

  await s3.send(command);

  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
};

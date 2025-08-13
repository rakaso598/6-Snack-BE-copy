import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const generateSafeFileName = (originalName: string): string => {
  const extension = originalName.split(".").pop()?.toLowerCase() || "";
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `products/${timestamp}_${randomString}.${extension}`;
};

export const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const uploadImageToS3 = async (file: Express.Multer.File) => {
  try {
    const fileKey = generateSafeFileName(file.originalname);
    const bucketName = process.env.AWS_BUCKET_NAME!;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);
    return fileKey;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NoSuchBucket") {
        throw new Error("S3 버킷을 찾을 수 없습니다.");
      } else if (error.name === "AccessDenied") {
        throw new Error("S3 접근 권한이 없습니다.");
      } else if (error.name === "NetworkError") {
        throw new Error("네트워크 연결에 실패했습니다.");
      }
    }
    throw new Error("이미지 업로드에 실패했습니다.");
  }
};

export const getCloudFrontUrl = (s3Key: string) => {
  const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
  if (!cloudFrontDomain) {
    throw new Error("CLOUDFRONT_DOMAIN 환경변수가 설정되지 않았습니다.");
  }
  return `https://${cloudFrontDomain}/${s3Key}`;
};

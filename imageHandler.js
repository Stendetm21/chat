const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs/promises");
const { v4: uuidv4 } = require('uuid');
const dotenv = require("dotenv");
dotenv.config();

const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } = process.env;
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET_NAME) {
  console.error('Missing required AWS environment variables.');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'eu-central-1',
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  }
});

const handleUpload = async (file) => {
  try {
    // Прочитайте файл изображения
    const fileContent = await fs.readFile(file.path);
    // Генерируйте уникальный ключ с использованием uuid
    const uniqueKey = `${uuidv4()}.jpg`;
    // Определите параметры загрузки
    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: uniqueKey,
      Body: fileContent,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    };
    // Выполните загрузку в S3
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    // Соберите URL вручную
    const region = 'eu-central-1'; // Укажите свой регион
    const bucket = AWS_BUCKET_NAME;
    const key = uniqueKey;
    const imageUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    // Удалите временный файл после загрузки
    await fs.unlink(file.path);
    // Верните URL загруженного изображения
    return imageUrl;
  } catch (error) {
    console.error('Error handling image upload:', error);
    throw error;
  }
};

module.exports = { handleUpload };

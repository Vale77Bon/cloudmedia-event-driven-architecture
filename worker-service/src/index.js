const amqp = require('amqplib');
const sharp = require('sharp');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    }
});

// NUEVA FUNCIÓN: Enviar mensaje de finalización
async function notifyCompletion(jobId, url) {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'job_completed_queue';
    
    await channel.assertQueue(queue, { durable: false });
    
    const message = { id: jobId, status: 'completed', url: url };
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    
    setTimeout(() => connection.close(), 500);
}

async function processImage(jobData) {
    console.log(`⏳ Procesando imagen: ${jobData.originalName}...`);
    
    const processedImageBuffer = await sharp(jobData.path).resize(800).webp({ quality: 80 }).toBuffer();
    const newFilename = `${jobData.id}-processed.webp`;

    const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: newFilename,
        Body: processedImageBuffer,
        ContentType: 'image/webp'
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    console.log(`✅ Imagen subida exitosamente a MinIO: ${newFilename}`);

    // Construimos la URL pública de la imagen (apuntando a nuestro MinIO local)
    const fileUrl = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${newFilename}`;
    
    // Avisamos a RabbitMQ que ya terminamos
    await notifyCompletion(jobData.id, fileUrl);

    if (fs.existsSync(jobData.path)) fs.unlinkSync(jobData.path);
}

async function startWorker() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = 'image_processing_queue';

        await channel.prefetch(1); 
        await channel.assertQueue(queue, { durable: true });

        console.log(`👷 Worker iniciado. Esperando mensajes en [${queue}]...`);

        channel.consume(queue, async (msg) => {
            if (msg !== null) {
                const jobData = JSON.parse(msg.content.toString());
                try {
                    await processImage(jobData);
                    channel.ack(msg); 
                } catch (error) {
                    console.error(`❌ Error procesando la imagen ${jobData.id}:`, error);
                    channel.nack(msg); 
                }
            }
        });
    } catch (error) {
        console.error("Error al iniciar el Worker:", error);
    }
}

startWorker();
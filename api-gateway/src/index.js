const express = require('express');
const cors = require('cors');
const multer = require('multer');
const amqp = require('amqplib');
const path = require('path');
const fs = require('fs');
const http = require('http'); // Nativo de Node
const { Server } = require('socket.io'); // Importar Socket.io
require('dotenv').config();

const app = express();
// Configurar servidor HTTP y conectarlo con Express y Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } // Permitir conexiones desde cualquier frontend
});

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

async function sendToQueue(message) {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = 'image_processing_queue';
        await channel.assertQueue(queue, { durable: true });
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        setTimeout(() => connection.close(), 500);
    } catch (error) {
        console.error("Error enviando a RabbitMQ:", error);
    }
}

// NUEVO: Función para escuchar cuando el Worker termina
async function listenForCompletedJobs() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = 'job_completed_queue';

        await channel.assertQueue(queue, { durable: false });
        
        console.log(`🎧 API Gateway escuchando notificaciones en [${queue}]`);
        
        channel.consume(queue, (msg) => {
            if (msg !== null) {
                const result = JSON.parse(msg.content.toString());
                console.log(`🔔 Notificando al Frontend: El trabajo ${result.id} terminó.`);
                
                // ¡LA MAGIA EN TIEMPO REAL! 
                // Emitimos un evento a todos los clientes web conectados
                io.emit('image_processed', result);
                
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error("Error escuchando trabajos completados:", error);
    }
}

// Iniciar el listener de notificaciones
listenForCompletedJobs();

// Conexión básica de Socket.io
io.on('connection', (socket) => {
    console.log(`🟢 Nuevo cliente Frontend conectado (ID: ${socket.id})`);
});

app.post('/api/upload', upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No imagen' });

    const eventPayload = {
        id: req.file.filename.split('.')[0],
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        status: 'pending'
    };

    await sendToQueue(eventPayload);

    res.status(202).json({
        message: 'Recibido. Procesamiento en segundo plano.',
        jobId: eventPayload.id
    });
});

const PORT = process.env.PORT || 3001;
// IMPORTANTE: Cambiamos app.listen por server.listen
server.listen(PORT, () => {
    console.log(`🚀 API Gateway y WebSockets corriendo en puerto ${PORT}`);
});
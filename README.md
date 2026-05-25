¡Ah! Ya veo exactamente el problema en tu captura de pantalla. Es un error súper común al trabajar con Markdown.

Lo que sucedió es que en el "Paso 1", abriste un bloque de código con tres comillas invertidas (````bash`), pero **nunca lo cerraste** con las otras tres comillas (`````) al final de ese comando. Como resultado, GitHub (o tu editor) asume que *todo el resto del documento* sigue siendo parte de ese mismo bloque de código.

Además, al copiar y pegar anteriormente, se pegaron las palabras literales "Bash" y "Fragmento de código" en lugar de los delimitadores de Markdown reales.

He corregido absolutamente todo. Ahora los bloques se abren y se cierran correctamente.

Copia **todo** este bloque y pégalo tal cual en tu `README.md` borrando lo anterior:

```markdown
# 🚀 CloudMedia - Arquitectura Event-Driven y Serverless

Este proyecto es una implementación completa de una arquitectura orientada a eventos (*Event-Driven Architecture*) diseñada para resolver los cuellos de botella en el procesamiento de archivos pesados. El sistema desacopla la recepción de la imagen de su procesamiento intensivo utilizando microservicios, un Message Broker, almacenamiento en la nube simulado y notificaciones en tiempo real, garantizando que la interfaz del usuario nunca se congele.

## 🏗️ Stack Tecnológico
* **Infraestructura & DevOps:** Docker, Docker Compose, Terraform (AWS SQS & S3 IaC).
* **Backend (API Gateway):** Node.js, Express.js (Recepción de peticiones HTTP multipart).
* **Backend (Worker Service):** Node.js, Sharp (Procesamiento de imágenes asíncrono).
* **Frontend:** Next.js (App Router), React.js, Tailwind CSS.
* **Message Broker:** RabbitMQ (Gestión de colas y desacoplamiento de microservicios).
* **Almacenamiento Cloud:** MinIO (100% compatible con el SDK de AWS S3).
* **Tiempo Real:** WebSockets con Socket.io (Notificaciones Push al cliente).

## 🗺️ Topología y Flujo de la Arquitectura
1. **El Usuario** sube un archivo pesado a través del Frontend (Next.js).
2. **El API Gateway** recibe el archivo, responde con un `202 Accepted` al instante, y publica un evento `NUEVA_IMAGEN` en RabbitMQ.
3. **El Worker Service** (que escucha en segundo plano) toma el evento, comprime y redimensiona la imagen usando Sharp, y la sube al bucket de MinIO (S3).
4. **El Worker** avisa que terminó enviando un evento a la cola `job_completed_queue`.
5. **El API Gateway** recibe este aviso y hace un *Push* vía WebSockets al Frontend.
6. **El Frontend** actualiza la galería dinámica en tiempo real sin recargar la página.

## 🛠️ Requisitos previos para ejecutar este proyecto

Para que este proyecto funcione en tu computadora, necesitas tener instalado lo siguiente:
1. **[Docker Desktop](https://www.docker.com/products/docker-desktop/):** Para levantar los contenedores de RabbitMQ y MinIO sin instalar dependencias globales.
2. **[Node.js (LTS)](https://nodejs.org/):** Para correr los microservicios y el entorno de Next.js.
3. **[Terraform](https://developer.hashicorp.com/terraform/downloads) (Opcional):** Si deseas probar la simulación de despliegue de Infraestructura como Código (`terraform plan`).

## 🚀 Guía de Instalación Detallada

**Paso 1: Levantar la Infraestructura Base (Message Broker y Almacenamiento)**

Abre Docker Desktop. Luego, en la terminal raíz del proyecto, ejecuta:
```bash
docker-compose up -d

```

*Configuración de MinIO:* Ingresa al panel en `http://localhost:9001` (Usuario: `cloudmedia_admin` / Contraseña: `cloudmedia_secure_password`). Ve a "Buckets", crea uno nuevo llamado `cloudmedia-bucket` y asegúrate de configurarlo como público.

**Paso 2: Configurar y Levantar el API Gateway (El Recepcionista)**

Abre una nueva terminal, entra a la carpeta del API y crea el archivo de entorno:

```bash
cd api-gateway

```

Crea un archivo llamado `.env` en esta carpeta con el siguiente contenido:

```env
PORT=3001
RABBITMQ_URL=amqp://guest:guest@localhost:5672

```

Instala las dependencias e inicia el servidor:

```bash
npm install
npm run dev

```

**Paso 3: Configurar y Levantar el Worker Service (El Obrero)**

Abre otra terminal, entra a la carpeta del Worker:

```bash
cd worker-service

```

Crea un archivo llamado `.env` en esta carpeta con el siguiente contenido:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=cloudmedia_admin
S3_SECRET_KEY=cloudmedia_secure_password
S3_BUCKET_NAME=cloudmedia-bucket

```

Instala las dependencias e inicia el worker:

```bash
npm install
npm run dev

```

**Paso 4: Levantar el Dashboard Visual (Frontend)**

En una última terminal, entra a la aplicación Next.js y ejecuta:

```bash
cd frontend
npm install
npm run dev

```

¡Listo! Ingresa a `http://localhost:3000` en tu navegador y prueba la plataforma subiendo imágenes.

**Paso 5: (Opcional) Simular Despliegue en AWS con Terraform**

Si deseas ver cómo se provisionaría esta infraestructura en AWS:

```bash
cd infrastructure/terraform
terraform init
terraform plan

```

---

# 🚀 CloudMedia - Event-Driven & Serverless Architecture (English Version)

This project is a comprehensive implementation of an Event-Driven Architecture designed to solve bottlenecks in heavy file processing. The system decouples image reception from intensive processing using microservices, a Message Broker, simulated cloud storage, and real-time notifications, ensuring the user interface remains responsive and never freezes.

## 🏗️ Tech Stack

* **Infrastructure & DevOps:** Docker, Docker Compose, Terraform (AWS SQS & S3 IaC).
* **Backend (API Gateway):** Node.js, Express.js (Multipart HTTP request handling).
* **Backend (Worker Service):** Node.js, Sharp (Asynchronous image processing).
* **Frontend:** Next.js (App Router), React.js, Tailwind CSS.
* **Message Broker:** RabbitMQ (Queue management and microservice decoupling).
* **Cloud Storage:** MinIO (100% compatible with AWS S3 SDK).
* **Real-Time:** WebSockets with Socket.io (Push notifications to the client).

## 🗺️ Architecture Flow

1. **The User** uploads a heavy file through the Frontend (Next.js).
2. **The API Gateway** receives the file, instantly responds with a `202 Accepted`, and publishes a `NEW_IMAGE` event to RabbitMQ.
3. **The Worker Service** (listening in the background) consumes the event, compresses and resizes the image using Sharp, and uploads it to the MinIO bucket (S3).
4. **The Worker** notifies completion by sending an event to the `job_completed_queue`.
5. **The API Gateway** receives this acknowledgment and pushes a WebSocket event to the Frontend.
6. **The Frontend** updates the dynamic gallery in real-time without reloading the page.

## 🛠️ Prerequisites

To run this project locally, you will need:

* **Docker Desktop:** To spin up the RabbitMQ and MinIO containers without installing global dependencies.
* **Node.js (LTS):** To run the microservices and the Next.js environment.
* **Terraform (Optional):** If you want to test the Infrastructure as Code deployment simulation (`terraform plan`).

## 🚀 Detailed Start Guide

**Step 1: Spin up the Base Infrastructure (Message Broker and Storage)**

Open Docker Desktop. Then, in the root terminal of the project, run:

```bash
docker-compose up -d

```

*MinIO Setup:* Access the dashboard at `http://localhost:9001` (User: `cloudmedia_admin` / Pass: `cloudmedia_secure_password`). Go to "Buckets", create a new one named `cloudmedia-bucket`, and make sure it is set to public access.

**Step 2: Setup and Start the API Gateway (The Receptionist)**

Open a new terminal, navigate to the API folder:

```bash
cd api-gateway

```

Create a `.env` file in this folder with the following content:

```env
PORT=3001
RABBITMQ_URL=amqp://guest:guest@localhost:5672

```

Install dependencies and start the server:

```bash
npm install
npm run dev

```

**Step 3: Setup and Start the Worker Service (The Laborer)**

Open another terminal, navigate to the Worker folder:

```bash
cd worker-service

```

Create a `.env` file in this folder with the following content:

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=cloudmedia_admin
S3_SECRET_KEY=cloudmedia_secure_password
S3_BUCKET_NAME=cloudmedia-bucket

```

Install dependencies and start the worker:

```bash
npm install
npm run dev

```

**Step 4: Start the Visual Dashboard (Frontend)**

In a final terminal, navigate to the Next.js application and run:

```bash
cd frontend
npm install
npm run dev

```

Done! Access `http://localhost:3000` in your browser and test the platform by uploading images.

**Step 5: (Optional) Simulate AWS Deployment with Terraform**

If you want to see how this infrastructure would be provisioned in AWS:

```bash
cd infrastructure/terraform
terraform init
terraform plan

```

```


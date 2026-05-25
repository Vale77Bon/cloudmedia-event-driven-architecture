# 1. Definimos el proveedor de la nube (AWS)
provider "aws" {
  region                      = "us-east-1"
  
  # Credenciales simuladas para el entorno local
  access_key                  = "mock_access_key"
  secret_key                  = "mock_secret_key"
  
  # Banderas maestras para saltar la validación con la nube real
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
}

# 2. Creamos el Bucket de S3 (El reemplazo de MinIO)
resource "aws_s3_bucket" "cloudmedia_storage" {
  bucket = "cloudmedia-production-bucket-2026" # Los nombres en S3 deben ser únicos a nivel mundial
  
  tags = {
    Environment = "Production"
    Project     = "CloudMedia"
  }
}

# 3. Configuramos la privacidad del Bucket (Todo privado por defecto)
resource "aws_s3_bucket_public_access_block" "cloudmedia_storage_security" {
  bucket = aws_s3_bucket.cloudmedia_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 4. Creamos la Cola Principal (El reemplazo de la cola de RabbitMQ)
resource "aws_sqs_queue" "image_processing_queue" {
  name                      = "image_processing_queue.fifo"
  fifo_queue                = true  # Garantiza que los mensajes se procesen en orden exacto
  content_based_deduplication = true # Evita que se procese la misma imagen dos veces por error
  message_retention_seconds = 86400 # Retiene el mensaje 1 día si el Worker está caído
}

# 5. Creamos la Cola de Notificaciones (Para avisarle al API/WebSockets)
resource "aws_sqs_queue" "job_completed_queue" {
  name                      = "job_completed_queue"
  message_retention_seconds = 3600 # Solo necesitamos guardarlo 1 hora
}

# 6. Outputs: Terraform nos devolverá las URLs de lo que acaba de crear
output "s3_bucket_name" {
  value = aws_s3_bucket.cloudmedia_storage.bucket
}

output "sqs_processing_queue_url" {
  value = aws_sqs_queue.image_processing_queue.url
}
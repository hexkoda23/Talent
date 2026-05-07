import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { extname, posix } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class AzureBlobStorageService {
  private readonly logger = new Logger(AzureBlobStorageService.name);
  private containerClient: ContainerClient | undefined;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
    const containerName = this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME', 'uploads');

    if (connectionString) {
      try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = blobServiceClient.getContainerClient(containerName);
        this.isConfigured = true;
      } catch (err) {
        this.logger.error('Failed to initialize Azure Blob Storage client', err);
      }
    } else {
      this.logger.warn('AZURE_STORAGE_CONNECTION_STRING is not set. Azure Blob Storage is not configured.');
    }
  }

  async saveRegistrationDocument(applicationId: string, file: Express.Multer.File) {
    if (!this.isConfigured) {
      throw new Error('Azure Blob Storage is not configured');
    }

    const extension = extname(file.originalname) || '.bin';
    const filename = `${randomUUID()}${extension}`;
    const storagePath = posix.join('registration', applicationId, filename);

    const blockBlobClient = this.containerClient!.getBlockBlobClient(storagePath);
    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    return {
      fileUrl: storagePath,
      originalFilename: file.originalname,
    };
  }

  reservePath(purpose: string, ownerId: string, originalFilename: string) {
    const safePurpose = purpose.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const extension = extname(originalFilename) || '.bin';
    const filename = `${randomUUID()}${extension}`;
    const storageKey = posix.join(safePurpose, ownerId, filename);
    
    return { storageKey, absolutePath: storageKey }; // In Azure, the absolute path is just the key
  }

  async writeBuffer(storageKey: string, buffer: Buffer): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('Azure Blob Storage is not configured');
    }

    const blockBlobClient = this.containerClient!.getBlockBlobClient(storageKey);
    await blockBlobClient.uploadData(buffer);
  }
}

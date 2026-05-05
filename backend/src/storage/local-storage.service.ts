import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { dirname, extname, join, posix } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class LocalStorageService {
  constructor(private readonly configService: ConfigService) {}

  private rootDir(): string {
    return this.configService.get<string>('LOCAL_UPLOAD_DIR', 'uploads');
  }

  async saveRegistrationDocument(applicationId: string, file: Express.Multer.File) {
    const rootDir = this.rootDir();
    const targetDir = join(process.cwd(), rootDir, 'registration', applicationId);
    await fs.mkdir(targetDir, { recursive: true });

    const extension = extname(file.originalname) || '.bin';
    const filename = `${randomUUID()}${extension}`;
    const destination = join(targetDir, filename);
    await fs.writeFile(destination, file.buffer);

    return {
      fileUrl: destination,
      originalFilename: file.originalname,
    };
  }

  /**
   * Reserves a storage path for a presigned upload. The file is written later via writeBuffer().
   * Returns both the on-disk absolute path and a relative storage key clients can persist as file_url.
   */
  reservePath(purpose: string, ownerId: string, originalFilename: string) {
    const rootDir = this.rootDir();
    const safePurpose = purpose.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const extension = extname(originalFilename) || '.bin';
    const filename = `${randomUUID()}${extension}`;
    const relative = posix.join(safePurpose, ownerId, filename);
    const absolute = join(process.cwd(), rootDir, ...relative.split('/'));
    return { storageKey: posix.join(rootDir, relative), absolutePath: absolute };
  }

  async writeBuffer(absolutePath: string, buffer: Buffer): Promise<void> {
    await fs.mkdir(dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
  }
}

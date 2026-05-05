import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class LocalStorageService {
  constructor(private readonly configService: ConfigService) {}

  async saveRegistrationDocument(applicationId: string, file: Express.Multer.File) {
    const rootDir = this.configService.get<string>('LOCAL_UPLOAD_DIR', 'uploads');
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
}

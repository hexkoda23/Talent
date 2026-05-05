import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { LocalStorageService } from '../storage/local-storage.service';
import { AuthUser } from '../common/dto/auth-user.type';
import { PresignDto, UploadPurpose } from './dto/presign.dto';

const PRESIGN_TTL_SECONDS = 600;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type PresignTokenPayload = {
  sub: string;
  purpose: UploadPurpose;
  storageKey: string;
  absolutePath: string;
  mimeType: string;
  filename: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class UploadsService {
  constructor(
    private readonly storageService: LocalStorageService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createPresignedUpload(user: AuthUser, dto: PresignDto) {
    const reservation = this.storageService.reservePath(dto.purpose, user.sub, dto.filename);

    const payload: PresignTokenPayload = {
      sub: user.sub,
      purpose: dto.purpose,
      storageKey: reservation.storageKey,
      absolutePath: reservation.absolutePath,
      mimeType: dto.mime_type,
      filename: dto.filename,
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.uploadSecret(),
      expiresIn: PRESIGN_TTL_SECONDS,
    });

    const apiPrefix = this.configService.get<string>('API_PREFIX', 'api/v1').replace(/^\/+/, '');
    const expiresAt = new Date(Date.now() + PRESIGN_TTL_SECONDS * 1000).toISOString();

    return {
      upload_url: `/${apiPrefix}/uploads/local/${token}`,
      file_url: `/${reservation.storageKey}`,
      expires_at: expiresAt,
    };
  }

  async receiveUpload(token: string, request: Request): Promise<void> {
    let payload: PresignTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<PresignTokenPayload>(token, {
        secret: this.uploadSecret(),
      });
    } catch {
      throw new UnauthorizedException({
        error: { code: 'invalid_upload_token', message: 'Upload link is invalid or expired' },
      });
    }

    const buffer = await this.collectBody(request);
    if (buffer.length === 0) {
      throw new BadRequestException({
        error: { code: 'empty_upload', message: 'No file body received' },
      });
    }

    await this.storageService.writeBuffer(payload.absolutePath, buffer);
  }

  private uploadSecret(): string {
    return this.configService.get<string>(
      'UPLOAD_PRESIGN_SECRET',
      this.configService.get<string>('JWT_ACCESS_SECRET', 'change-this-access-secret'),
    );
  }

  private async collectBody(request: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let received = 0;
      request.on('data', (chunk: Buffer) => {
        received += chunk.length;
        if (received > MAX_UPLOAD_BYTES) {
          reject(
            new BadRequestException({
              error: { code: 'file_too_large', message: 'Uploaded file exceeds maximum size' },
            }),
          );
          request.destroy();
          return;
        }
        chunks.push(chunk);
      });
      request.on('end', () => resolve(Buffer.concat(chunks)));
      request.on('error', (error) => reject(error));
    });
  }
}

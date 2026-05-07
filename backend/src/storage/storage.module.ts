import { Module } from '@nestjs/common';
import { AzureBlobStorageService } from './azure-blob-storage.service';
import { LocalStorageService } from './local-storage.service';

@Module({
  providers: [AzureBlobStorageService, LocalStorageService],
  exports: [AzureBlobStorageService, LocalStorageService],
})
export class StorageModule {}

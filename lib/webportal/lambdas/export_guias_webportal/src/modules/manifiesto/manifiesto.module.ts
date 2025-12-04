import { Module } from '@nestjs/common';
import { CloseManifestService } from './close-manifest.service';

@Module({
  providers: [CloseManifestService],
  exports: [CloseManifestService],
})
export class ManifiestoModule {}


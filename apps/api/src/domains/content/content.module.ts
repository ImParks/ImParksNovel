import { Module } from '@nestjs/common';
import { ContentResolver } from './presentation/content.resolver';
import { ContentService } from './application/content.service';
import { ContentRepository } from './infrastructure/content.repository';

@Module({
  providers: [ContentResolver, ContentService, ContentRepository],
  exports: [ContentService],
})
export class ContentModule {}

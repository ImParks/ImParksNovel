import {
  Controller,
  Post,
  Header,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SseResponse = { write: (data: string) => void; end: () => void };
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/types/context';
import { AiService } from '../application/ai.service';
import {
  ContinueWritingDto,
  ImproveTextDto,
  GenerateSettingDto,
  SuggestPlotDto,
} from '../application/dto/ai.input';

// ──────────────────────────────────────────────
// SSE Controller
// ──────────────────────────────────────────────

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Continue writing with AI (SSE streaming)
   * POST /api/ai/continue
   */
  @Post('continue')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async continueWriting(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ContinueWritingDto,
    @Res() res: SseResponse,
  ): Promise<void> {
    try {
      for await (const event of this.aiService.generateContinuation(
        user.userId,
        dto,
      )) {
        res.write(
          `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const errorData = {
        code: error.code ?? 'AI_001',
        message: error.message ?? 'AI 생성 중 오류가 발생했습니다.',
      };
      res.write(
        `event: error\ndata: ${JSON.stringify(errorData)}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  /**
   * Improve text with AI (SSE streaming)
   * POST /api/ai/improve
   */
  @Post('improve')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async improveText(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ImproveTextDto,
    @Res() res: SseResponse,
  ): Promise<void> {
    try {
      for await (const event of this.aiService.improveText(user.userId, dto)) {
        res.write(
          `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const errorData = {
        code: error.code ?? 'AI_002',
        message: error.message ?? 'AI 개선 중 오류가 발생했습니다.',
      };
      res.write(
        `event: error\ndata: ${JSON.stringify(errorData)}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  /**
   * Generate setting with AI (SSE streaming)
   * POST /api/ai/generate-setting
   */
  @Post('generate-setting')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async generateSetting(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateSettingDto,
    @Res() res: SseResponse,
  ): Promise<void> {
    try {
      for await (const event of this.aiService.generateSetting(
        user.userId,
        dto,
      )) {
        res.write(
          `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const errorData = {
        code: error.code ?? 'AI_003',
        message: error.message ?? 'AI 설정 생성 중 오류가 발생했습니다.',
      };
      res.write(
        `event: error\ndata: ${JSON.stringify(errorData)}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  /**
   * Suggest plot with AI (SSE streaming)
   * POST /api/ai/suggest-plot
   */
  @Post('suggest-plot')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async suggestPlot(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SuggestPlotDto,
    @Res() res: SseResponse,
  ): Promise<void> {
    try {
      for await (const event of this.aiService.suggestPlot(
        user.userId,
        dto,
      )) {
        res.write(
          `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const errorData = {
        code: error.code ?? 'AI_004',
        message: error.message ?? 'AI 플롯 제안 중 오류가 발생했습니다.',
      };
      res.write(
        `event: error\ndata: ${JSON.stringify(errorData)}\n\n`,
      );
    } finally {
      res.end();
    }
  }
}

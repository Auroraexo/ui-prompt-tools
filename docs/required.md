已经实现了“AI 参数提取”并在 PostgreSQL 基础上运行，这里有一份为你定制的 NestJS 后端 Service 核心代码实现。

这段代码的作用是：接收你截图中豆包 AI 生成的 JSON 结果，将其解析并精准存入 PgSQL 的 JSONB 字段中。

1. NestJS Service 实现 (TypeScript)
你可以直接将这个逻辑整合到你的项目中：

TypeScript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UIPreset } from './entities/ui-preset.entity';

@Injectable()
export class UiConfigService {
  constructor(
    @InjectRepository(UIPreset)
    private readonly presetRepository: Repository<UIPreset>,
  ) {}

  /**
   * 将 AI 提取的 JSON 参数保存到 PgSQL
   * @param aiExtractedData 截图右侧生成的 JSON 对象
   * @param themeName 方案名称
   */
  async saveAiExtractedConfig(aiExtractedData: any, themeName: string) {
    // 1. 数据清洗：确保数据符合你截图中的结构
    const configToSave = {
      radius: aiExtractedData['圆角'],
      spacing: aiExtractedData['间距'],
      colors: aiExtractedData['配色'],
      shadows: aiExtractedData['阴影'],
      glass_effect: aiExtractedData['背景效果'],
      typography: aiExtractedData['字体'],
      animations: aiExtractedData['交互动画'],
    };

    // 2. 自动生成一段增强型的 System Prompt 片段
    const generatedPrompt = this.buildFinalPrompt(configToSave);

    // 3. 写入 PostgreSQL (利用 TypeORM 的 JSONB 映射)
    const newPreset = this.presetRepository.create({
      preset_name: themeName,
      config_data: configToSave, // 这里在 Entity 中定义为 jsonb 类型
      full_prompt: generatedPrompt,
    });

    return await this.presetRepository.save(newPreset);
  }

  private buildFinalPrompt(data: any): string {
    return `请按照以下当代审美重构 UI：
    - 圆角策略：${data.radius?.卡片圆角 || 'rounded-2xl'}
    - 阴影深度：${data.shadows?.卡片阴影 || 'shadow-xl'}
    - 背景方案：${data.glass_effect?.毛玻璃 || 'backdrop-blur-md'}
    - 交互反馈：${data.animations?.悬停 || 'hover:scale-105 transition-all'}
    确保界面具有呼吸感，符合 2026 年极简主义标准。`;
  }
}
2. 数据库迁移建议 (Entity 定义)
在 NestJS 中，使用 jsonb 类型是关键，它支持高效的读写和复杂的查询操作。

TypeScript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('ui_presets')
export class UIPreset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  preset_name: string;

  @Index({ fulltext: true }) // 核心：使用 PgSQL 的 jsonb 并建议创建 GIN 索引
  @Column({ type: 'jsonb' }) 
  config_data: any;

  @Column({ type: 'text' })
  full_prompt: string;

  @CreateDateColumn()
  created_at: Date;
}
3. 进阶：如何让这个工具“更好用”？
既然你已经有了这个“进阶建议表”，可以考虑增加以下两个功能：

审美校验器 (Schema Validation): 在写入 PgSQL 前，用 class-validator 校验 AI 提取的参数。如果 AI 漏掉了“圆角”参数，自动补全一个你最喜欢的默认值。

一键克隆 (Preset Cloner): 既然是在 PgSQL 里，你可以写一个简单的 SQL 存储过程，将一个项目的“审美方案”一键克隆给另一个项目。
import type { ConfigState } from '../types/config';

/**
 * 根据配置数据生成完整的 Cursor 指令 Prompt
 * @param config 配置状态对象
 * @param componentNameFilter 可选的组件名称过滤（如果提供，只生成包含该组件名称的配置）
 * @returns 生成的完整 Prompt 字符串
 */
export function generateUIPrompt(
  config: ConfigState,
  componentNameFilter?: string
): string {
  const dimensions = Object.keys(config);
  const promptParts: string[] = [];

  // 添加标题
  promptParts.push('请按照以下 UI 审美参数来设计和实现界面：\n');

  // 遍历每个维度
  dimensions.forEach((dimension) => {
    const items = config[dimension];
    if (!items || items.length === 0) return;

    // 如果指定了组件名称过滤，只包含匹配的项
    const filteredItems = componentNameFilter
      ? items.filter((item) =>
          item.componentName
            .toLowerCase()
            .includes(componentNameFilter.toLowerCase())
        )
      : items;

    if (filteredItems.length === 0) return;

    // 添加维度标题
    promptParts.push(`## ${dimension}\n`);

    // 添加该维度下的所有配置项
    filteredItems.forEach((item) => {
      promptParts.push(`- **${item.componentName}**: ${item.promptFragment}`);
      if (item.cssClass) {
        promptParts.push(`  - CSS 类名: \`${item.cssClass}\``);
      }
      promptParts.push('');
    });

    promptParts.push('');
  });

  // 添加总结说明
  promptParts.push('---\n');
  promptParts.push(
    '请确保所有组件都遵循以上参数，保持整体设计的一致性和现代感。'
  );

  return promptParts.join('\n');
}

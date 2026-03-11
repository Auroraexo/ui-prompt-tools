export type UIConfig = {
  componentName: string;
  cssClass: string;
  promptFragment: string;
  dimension: string;
}

export type ConfigState = {
  [dimension: string]: UIConfig[];
}

// 提供运行时导出，避免工具链将类型导入保留为运行时导入时报错
export const UIConfig = {} as UIConfig;
export const ConfigState = {} as ConfigState;

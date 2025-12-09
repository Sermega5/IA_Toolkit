export enum AppTab {
  RANK_GENERATOR = 'RANK_GENERATOR',
  TEXTURE_EDITOR = 'TEXTURE_EDITOR',
  CONFIG_GENERATOR = 'CONFIG_GENERATOR',
  GUI_GENERATOR = 'GUI_GENERATOR',
  BACKGROUND_DESIGNER = 'BACKGROUND_DESIGNER',
}

export interface RankSettings {
  text: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  borderWidth: number;
  width: number;
  height: number;
  icon?: string;
  iconX: number;
  iconY: number;
  textX: number;
  textY: number;
  fontSize: number;
  fontFamily: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  borderStartX: number;
  borderEndX: number;
  enableShadow: boolean;
}

export interface ItemConfig {
  namespace: string;
  id: string;
  displayName: string;
  material: string;
  modelId: number;
  lore: string;
  path: string;
  
  // Advanced
  events: { type: string; actions: string[] }[];
  specifics: { key: string; value: string }[];
}

export interface GuiSlot {
  index: number; // 0-53
  item?: string; // e.g., "my_namespace:my_item"
  action?: string; // command or action
  texture?: string; // path to texture
}

export interface GuiConfig {
  title: string;
  slots: GuiSlot[];
}
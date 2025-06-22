export type Direction = 'up' | 'bottom' | 'right' | 'left';

export interface ConnectionStyle {
  color: string;
  weight: number;
  style: 'solid' | 'dashed' | 'dotted';
  curve: 'curved' | 'straight' | 'orthogonal';
  dashGap?: number; // Gap multiplier for dashed/dotted lines (1-5)
}

export interface RoadmapBlock {
  block_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  inner_label: string;
  outer_label: string;
  outer_label_direction: 'up' | 'bottom';
  html_content: string;
  connected_blocks: { [key: string]: Direction | string };
  connection_styles?: { [key: string]: ConnectionStyle };
  titleColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface RoadmapData {
  blocks: RoadmapBlock[];
} 
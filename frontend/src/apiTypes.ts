/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface Action {
  timeout: number;
  time: number;
  action: "move" | "swing";
  target_id?: number;
}
export interface BaseModel {}
export interface BasicAnimation {
  type: "shake" | "rotate";
}
export interface DirectionsType {
  down: 0;
  up: 1;
  right: 2;
  left: 3;
}
export interface Entity {
  id: string;
  nickname?: string;
  width?: number;
  height?: number;
  x: number;
  y: number;
  x_from?: number;
  y_from?: number;
  x_offset?: number;
  y_offset?: number;
  x_bound?: number;
  y_bound?: number;
  speed?: number;
  direction?: 0 | 1 | 2 | 3;
  animations?: BasicAnimation[];
  animation_speed?: number;
  sprites?: Sprite[][];
  action?: Action;
  on_touch?: "move" | "swing";
}
export interface Sprite {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Item {
  id: string;
  slug: "axe" | "pickaxe" | "wood_block" | "stone_block";
}
export interface TileSize {
  width: 32;
}
export interface User {
  nickname: string;
  entity_id: string;
  last_seen: number;
  request_id?: string;
}

/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface BasicAnimation {
  type: "shake" | "rotate";
}
export interface Entity {
  id: number;
  width: number;
  height: number;
  x: number;
  y: number;
  x_from: number;
  y_from: number;
  speed: number;
  animations: BasicAnimation[];
  sprites: Sprite[][];
  sprite_speed: number;
}
export interface Sprite {
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface TileSize {
  width: 32;
}

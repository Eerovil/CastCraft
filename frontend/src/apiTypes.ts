/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export interface BasicAnimation {
  type: "shake" | "rotate";
}
export interface Coordinates {
  x: number;
  y: number;
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
  sprite: Sprite;
}
export interface Sprite {
  slug: string;
  url: string;
  animation_speed: number;
  coordinates: Coordinates[];
}

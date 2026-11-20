/** The opaque trunk ends about 1.5 pixels above the 384px sprite's lower edge.
 * Sink only that transparent margin, scaled with each billboard, into the ground. */
export const PINE_SPRITE_HEIGHT=8.72;
export const PINE_TRANSPARENT_MARGIN=1.5/384;
export function pineGroundInset(scale:number) {return PINE_SPRITE_HEIGHT*PINE_TRANSPARENT_MARGIN*scale;}

/** The opaque trunk ends about 1.5 pixels above the 384px sprite's lower edge.
 * Sink only that transparent margin, scaled with each billboard, into the ground. */
export const PINE_SPRITE_HEIGHT=8.72;
export const PINE_TRANSPARENT_MARGIN=1.5/384;
export function pineGroundInset(scale:number) {return PINE_SPRITE_HEIGHT*PINE_TRANSPARENT_MARGIN*scale;}

/** The oak image has approximately five transparent rows at its 361px height.
 * The inset is shared across compact/full textures and hides that margin. */
export const OAK_SPRITE_HEIGHT=8.6;
export const OAK_GROUND_INSET=.125;

/**
 * Sound feature has been completely removed as requested.
 * Empty no-op sound interface preserved for backward compatibility.
 */
export const sound = {
  enabled: false,
  playBubblePop: (..._args: any[]) => {},
  playBubbleBounce: (..._args: any[]) => {},
  playThrowWhoosh: (..._args: any[]) => {},
  playTick: (..._args: any[]) => {},
  playBiteCrunch: (..._args: any[]) => {},
};

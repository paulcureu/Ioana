declare module "page-flip" {
  export type FlipState = "user_fold" | "fold_corner" | "flipping" | "read";
  export type Orientation = "portrait" | "landscape";

  export interface FlipSetting {
    startPage: number;
    size: "fixed" | "stretch";
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  }

  export interface WidgetEvent<T = unknown> {
    data: T;
    object: PageFlip;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: Partial<FlipSetting>);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    update(): void;
    destroy(): void;
    flip(page: number, corner?: "top" | "bottom"): void;
    flipNext(corner?: "top" | "bottom"): void;
    flipPrev(corner?: "top" | "bottom"): void;
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): Orientation;
    getState(): FlipState;
    getSettings(): FlipSetting;
    on(event: "flip", cb: (e: WidgetEvent<number>) => void): PageFlip;
    on(event: "changeState", cb: (e: WidgetEvent<FlipState>) => void): PageFlip;
    on(event: "changeOrientation", cb: (e: WidgetEvent<Orientation>) => void): PageFlip;
    on(event: "init" | "update", cb: (e: WidgetEvent<{ page: number; mode: Orientation }>) => void): PageFlip;
    off(event: string): void;
  }
}

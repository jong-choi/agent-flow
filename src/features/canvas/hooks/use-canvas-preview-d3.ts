"use client";

import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { select } from "d3-selection";
import {
  type ZoomBehavior,
  type ZoomTransform,
  zoom as createZoom,
  zoomIdentity,
  zoomTransform,
} from "d3-zoom";

type UseCanvasPreviewD3Options = {
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
};

type ZoomUpdater = number | ((currentZoom: number) => number);

export function useCanvasPreviewD3(
  viewportRef: RefObject<HTMLDivElement | null>,
  { defaultZoom, minZoom, maxZoom }: UseCanvasPreviewD3Options,
) {
  const [transform, setTransform] = useState<ZoomTransform>(
    zoomIdentity.scale(defaultZoom),
  );
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(
    null,
  );

  const clamp = useCallback(
    (value: number) => Math.min(maxZoom, Math.max(minZoom, value)),
    [maxZoom, minZoom],
  );

  const applyTransform = useCallback(
    (next: ZoomTransform) => {
      const el = viewportRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      if (!el || !zoomBehavior) {
        setTransform(next);
        return;
      }

      select(el).call(
        zoomBehavior.transform,
        zoomIdentity.translate(next.x, 0).scale(next.k),
      );
    },
    [viewportRef],
  );

  const setZoomScale = useCallback(
    (nextZoom: ZoomUpdater) => {
      const el = viewportRef.current;
      if (!el) {
        return;
      }

      const current = zoomTransform(el);
      const resolvedZoom =
        typeof nextZoom === "function" ? nextZoom(current.k) : nextZoom;

      applyTransform(
        zoomIdentity.translate(current.x, 0).scale(clamp(resolvedZoom)),
      );
    },
    [applyTransform, clamp, viewportRef],
  );

  const resetPan = useCallback(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }

    const current = zoomTransform(el);
    applyTransform(zoomIdentity.translate(0, 0).scale(current.k));
  }, [applyTransform, viewportRef]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }

    const selection = select(el);
    const zoomBehavior = createZoom<HTMLDivElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .filter(
        (event) =>
          event.type === "wheel" ||
          (event.type === "mousedown" && event.button === 0),
      )
      .on("start", (event) => {
        if (event.sourceEvent?.type === "mousedown") {
          el.classList.add("cursor-grabbing");
        }
      })
      .on("zoom", (event) => {
        setTransform(
          zoomIdentity.translate(event.transform.x, 0).scale(event.transform.k),
        );
      })
      .on("end", () => {
        el.classList.remove("cursor-grabbing");
      });

    zoomBehaviorRef.current = zoomBehavior;
    selection.call(zoomBehavior);
    selection.on("wheel", (event) => event.preventDefault());
    selection.on("dblclick.zoom", null);
    selection.call(zoomBehavior.transform, zoomIdentity.scale(defaultZoom));

    return () => {
      selection.on(".zoom", null);
      selection.on("wheel", null);
      el.classList.remove("cursor-grabbing");
    };
  }, [defaultZoom, maxZoom, minZoom, viewportRef]);

  return {
    zoom: transform.k,
    panX: transform.x,
    setZoomScale,
    resetPan,
  };
}

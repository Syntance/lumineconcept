"use client";

import { useCallback, useState } from "react";

interface InPostPoint {
  name: string;
  address: {
    line1: string;
    line2: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  type: string;
}

declare global {
  interface Window {
    easyPackAsyncInit?: () => void;
    easyPack?: {
      init: (config: Record<string, unknown>) => void;
      mapWidget: (
        elementId: string,
        callback: (point: InPostPoint) => void,
      ) => void;
    };
  }
}

export function useInPostPoints() {
  const [selectedPoint, setSelectedPoint] = useState<InPostPoint | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const openMap = useCallback((elementId: string) => {
    if (typeof window === "undefined") return;

    setIsMapOpen(true);

    const loadWidget = () => {
      window.easyPack?.mapWidget(elementId, (point: InPostPoint) => {
        setSelectedPoint(point);
        setIsMapOpen(false);
      });
    };

    if (window.easyPack) {
      loadWidget();
      return;
    }

    window.easyPackAsyncInit = () => {
      window.easyPack?.init({
        defaultLocale: "pl",
        mapType: "osm",
        searchType: "osm",
        points: { types: ["parcel_locker"] },
        map: { initialTypes: ["parcel_locker"] },
      });
      loadWidget();
    };

    const script = document.createElement("script");
    script.src = "https://geowidget.inpost.pl/inpost-geowidget.js";
    script.async = true;
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://geowidget.inpost.pl/inpost-geowidget.css";
    document.head.appendChild(link);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPoint(null);
  }, []);

  return {
    selectedPoint,
    isMapOpen,
    openMap,
    clearSelection,
  };
}

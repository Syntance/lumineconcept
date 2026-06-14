"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ShopListingCategoryContextValue = {
  activeCategoryId: string | undefined;
  setActiveCategoryId: (id: string | undefined) => void;
};

const ShopListingCategoryContext =
  createContext<ShopListingCategoryContextValue | null>(null);

export function ShopListingCategoryProvider({
  initialCategoryId,
  children,
}: {
  initialCategoryId?: string;
  children: ReactNode;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId);

  useEffect(() => {
    setActiveCategoryId(initialCategoryId);
  }, [initialCategoryId]);

  return (
    <ShopListingCategoryContext.Provider
      value={{ activeCategoryId, setActiveCategoryId }}
    >
      {children}
    </ShopListingCategoryContext.Provider>
  );
}

export function useShopListingCategory(): ShopListingCategoryContextValue {
  const ctx = useContext(ShopListingCategoryContext);
  if (!ctx) {
    throw new Error(
      "useShopListingCategory must be used within ShopListingCategoryProvider",
    );
  }
  return ctx;
}

export function useShopListingCategoryOptional():
  | ShopListingCategoryContextValue
  | null {
  return useContext(ShopListingCategoryContext);
}

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}

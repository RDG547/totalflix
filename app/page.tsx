import { Hero } from "@/components/Hero";
import { TrendingSection } from "@/components/TrendingSection";
import { CategorySection } from "@/components/CategorySection";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="relative z-10 -mt-4 sm:-mt-10 md:-mt-14">
        <TrendingSection />
        <CategorySection category="movie" title="Filmes Populares" />
        <CategorySection category="tv" title="Séries Populares" />
      </div>
    </>
  );
}

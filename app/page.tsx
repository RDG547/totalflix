import { Hero } from "@/components/Hero";
import { TrendingSection } from "@/components/TrendingSection";
import { CategorySection } from "@/components/CategorySection";

export default function Home() {
  return (
    <>
      <Hero />
      <div className="relative z-20 -mt-10 sm:-mt-32">
        <TrendingSection />
        <CategorySection category="movie" title="Filmes Populares" />
        <CategorySection category="tv" title="Séries Populares" />
      </div>
    </>
  );
}

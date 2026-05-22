"use client"

import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules"
import { Button } from "@/components/ui/button"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "swiper/css/effect-fade"
import "./grocery-hero-slider.css"

const HERO_SLIDES = [
  { src: "/images/grocery-hero.jpg", alt: "Fresh vegetables and produce at market" },
  { src: "/images/grocery-hero-2.jpg", alt: "Colorful fresh vegetables display" },
  { src: "/images/grocery-hero-3.jpg", alt: "Healthy salad and fresh ingredients" },
  { src: "/images/grocery-hero-4.jpg", alt: "Fresh fruits and groceries" },
] as const

type GroceryHeroSliderProps = {
  onRequestClick: () => void
  onHowItWorksClick?: () => void
}

function SlideContent({
  onRequestClick,
  onHowItWorksClick,
}: {
  onRequestClick: () => void
  onHowItWorksClick?: () => void
}) {
  return (
    <div className="grocery-hero-slide-content">
      <p className="text-white/90 text-xs sm:text-sm font-medium uppercase tracking-widest mb-2 sm:mb-3">
        Concierge grocery shopping · Accra &amp; beyond
      </p>
      <h1
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight max-w-xl drop-shadow-md"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        Fresh Groceries, No Stress
      </h1>
      <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-white/95 max-w-md leading-relaxed drop-shadow-sm">
        We shop, you relax. Delivery anywhere in Accra.
      </p>
      <div className="mt-5 sm:mt-7 flex flex-wrap gap-3">
        <Button
          type="button"
          size="lg"
          className="h-11 sm:h-12 min-h-[44px] px-6 sm:px-8 rounded-full bg-[#0E8F3D] text-white hover:bg-[#0A5C2A] font-semibold shadow-lg border-2 border-white/25 text-sm sm:text-base"
          onClick={onRequestClick}
        >
          Request Shopping
        </Button>
        {onHowItWorksClick && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-11 sm:h-12 min-h-[44px] px-5 sm:px-7 rounded-full border-2 border-white text-white bg-white/10 hover:bg-white/25 text-sm sm:text-base"
            onClick={onHowItWorksClick}
          >
            How It Works
          </Button>
        )}
      </div>
    </div>
  )
}

export function GroceryHeroSlider({ onRequestClick, onHowItWorksClick }: GroceryHeroSliderProps) {
  return (
    <section
      id="hero"
      className="grocery-hero-section relative w-full overflow-hidden bg-[#0A5C2A]"
      aria-label="Grocery shopping hero"
    >
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={900}
        loop
        autoplay={{
          delay: 5500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        navigation
        className="grocery-hero-swiper"
      >
        {HERO_SLIDES.map((slide) => (
          <SwiperSlide key={slide.src}>
            <div className="grocery-hero-slide-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.alt}
                className="grocery-hero-slide-img"
                loading={slide.src === HERO_SLIDES[0].src ? "eager" : "lazy"}
                fetchPriority={slide.src === HERO_SLIDES[0].src ? "high" : "auto"}
              />
              <div className="grocery-hero-slide-overlay" aria-hidden />
              <SlideContent onRequestClick={onRequestClick} onHowItWorksClick={onHowItWorksClick} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}

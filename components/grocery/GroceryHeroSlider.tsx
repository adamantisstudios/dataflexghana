"use client"

import type { ReactNode } from "react"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Navigation, Pagination, EffectFade } from "swiper/modules"
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

const HERO_OVERLAY = "rgba(0, 60, 30, 0.75)"

type GroceryHeroSliderProps = {
  children: ReactNode
}

export function GroceryHeroSlider({ children }: GroceryHeroSliderProps) {
  return (
    <section
      id="hero"
      className="relative min-h-[85vh] w-full overflow-hidden bg-[#0A5C2A]"
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
        className="grocery-hero-swiper absolute inset-0 z-0"
      >
        {HERO_SLIDES.map((slide) => (
          <SwiperSlide key={slide.src}>
            <div className="relative w-full min-h-[85vh] h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.alt}
                className="absolute inset-0 w-full h-full object-cover"
                loading={slide.src === HERO_SLIDES[0].src ? "eager" : "lazy"}
                fetchPriority={slide.src === HERO_SLIDES[0].src ? "high" : "auto"}
              />
              <div className="absolute inset-0" style={{ backgroundColor: HERO_OVERLAY }} aria-hidden />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="relative z-10 flex min-h-[85vh] items-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-6xl mx-auto px-4 py-20 animate-in fade-in duration-700">
          {children}
        </div>
      </div>
    </section>
  )
}

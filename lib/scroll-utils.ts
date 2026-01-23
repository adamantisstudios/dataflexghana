export const scrollToElement = (element: HTMLElement | null, offsetPx = 120) => {
  if (!element) return

  const elementPosition = element.getBoundingClientRect().top + window.scrollY
  const targetPosition = elementPosition - offsetPx

  window.scrollTo({
    top: targetPosition,
    behavior: "smooth",
  })
}

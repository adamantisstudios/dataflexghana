// Initialize Swiper slider with improved configuration
document.addEventListener("DOMContentLoaded", () => {
  // Hero Slider with improved configuration
  const heroSwiper = new Swiper(".hero-slider", {
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    speed: 1000,
    effect: "fade",
    fadeEffect: {
      crossFade: true,
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    grabCursor: true,
    keyboard: {
      enabled: true,
    },
    on: {
      slideChangeTransitionStart: function () {
        const activeSlide = this.slides[this.activeIndex]
        const content = activeSlide.querySelector(".slide-content")
        if (content) {
          content.style.opacity = 0
          content.style.transform = "translateY(20px)"
          setTimeout(() => {
            content.style.opacity = 1
            content.style.transform = "translateY(0)"
            content.style.transition = "all 0.8s ease"
          }, 100)
        }
      },
    },
  })

  // Mobile Navigation
  const hamburger = document.querySelector(".hamburger")
  const navLinks = document.querySelector(".nav-links")

  if (hamburger) {
    hamburger.addEventListener("click", function () {
      this.classList.toggle("active")
      navLinks.classList.toggle("active")
    })
  }

  // Close mobile menu when clicking on a link
  const navItems = document.querySelectorAll(".nav-links a")
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      hamburger.classList.remove("active")
      navLinks.classList.remove("active")
    })
  })

  // Network Tabs
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabPanes = document.querySelectorAll(".tab-pane")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const network = this.getAttribute("data-network")

      // Remove active class from all buttons and panes
      tabBtns.forEach((btn) => btn.classList.remove("active"))
      tabPanes.forEach((pane) => pane.classList.remove("active"))

      // Add active class to clicked button and corresponding pane
      this.classList.add("active")
      document.getElementById(`${network}-content`).classList.add("active")
    })
  })

  // Image Upload Functionality
  const imageUploads = document.querySelectorAll(".image-upload")

  imageUploads.forEach((upload) => {
    upload.addEventListener("change", function (e) {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        const imageId = this.id.replace("-upload", "")

        reader.onload = (e) => {
          document.getElementById(imageId).src = e.target.result

          // If this is the popup channel image, also update the main channel image
          if (imageId === "popup-channel-image") {
            document.getElementById("whatsapp-channel-image").src = e.target.result
          }
          // If this is the main channel image, also update the popup channel image
          if (imageId === "whatsapp-channel-image") {
            document.getElementById("popup-channel-image").src = e.target.result
          }
        }

        reader.readAsDataURL(file)
      }
    })
  })

  // WhatsApp Chat Functionality
  const chatIcon = document.getElementById("chat-icon")
  const chatPopup = document.getElementById("chat-popup")
  const closeChat = document.querySelector(".close-chat")
  const faqQuestions = document.querySelectorAll(".faq-question")

  if (chatIcon) {
    chatIcon.addEventListener("click", () => {
      chatPopup.classList.toggle("active")
    })
  }

  if (closeChat) {
    closeChat.addEventListener("click", () => {
      chatPopup.classList.remove("active")
    })
  }

  faqQuestions.forEach((question) => {
    question.addEventListener("click", function () {
      const questionText = this.getAttribute("data-question")
      const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(questionText)}`
      window.open(whatsappUrl, "_blank")
    })
  })

  // WhatsApp Channel Popup
  const channelPopup = document.getElementById("channel-popup")
  const closePopup = document.querySelector(".close-popup")

  // Show popup after 5 seconds
  setTimeout(() => {
    channelPopup.classList.add("active")
  }, 5000)

  if (closePopup) {
    closePopup.addEventListener("click", () => {
      channelPopup.classList.remove("active")
    })
  }

  // Close popup when clicking outside
  channelPopup.addEventListener("click", function (e) {
    if (e.target === this) {
      this.classList.remove("active")
    }
  })
})

// Order Data Function
function orderData(network) {
  const plan = document.getElementById(`${network}-plan`).value
  const phone = document.getElementById(`${network}-phone`).value

  if (!phone) {
    alert("Please enter a phone number")
    return
  }

  const [bundle, cost] = plan.split(" - ")
  const message = `I want to order ${bundle} for ${cost}. Bundle For This Number: ${phone}`
  const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, "_blank")
}

// Register User Function
function registerUser() {
  const fullname = document.getElementById("fullname").value
  const phone = document.getElementById("phone").value
  const idType = document.getElementById("id-type").value
  const dob = document.getElementById("dob").value

  if (!fullname || !phone || !idType || !dob) {
    alert("Please fill in all required fields")
    return
  }

  const message = `New Registration:\n\nFull Name: ${fullname}\nPhone Number: ${phone}\nID Type/Number: ${idType}\nDate of Birth: ${dob}`
  const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, "_blank")
}

// Order Device Function
document.addEventListener("DOMContentLoaded", () => {
  const orderDeviceBtns = document.querySelectorAll(".order-device-btn")

  orderDeviceBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const device = this.getAttribute("data-device")
      const price = this.getAttribute("data-price")
      const description = this.parentElement.querySelector(".device-description").textContent.trim()

      const message = `I want to order:\n\nDevice: ${device}\nPrice: ${price}\nDescription: ${description}`
      const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    })
  })
})

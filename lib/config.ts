// Global Configuration for DataFlex Agents Platform
export const PLATFORM_CONFIG = {
  // Pricing Configuration
  pricing: {
    joiningFee: 47, // Changed from 35 to 50 Cedis
    currency: "₵",
    currencySymbol: "₵",
  },

  // Platform Information
  platform: {
    name: "DataFlex Agents",
    tagline: "Ghana's Biggest Multi-Service Agent Platform",
    supportPhone: "+233242799990",
    supportEmail: "sales.dataflex@gmail.com",
  },

  // Commission Rates (can be configured globally)
  commissions: {
    defaultDataBundleRate: 0.05, // 5%
    maxCommissionRate: 0.2, // 20%
  },

  // Business Rules
  business: {
    minWithdrawalAmount: 10,
    maxWithdrawalAmount: 10000,
    withdrawalProcessingDays: "1-3",
  },
}

// Helper functions for easy access
export const getJoiningFee = () => PLATFORM_CONFIG.pricing.joiningFee
export const getJoiningFeeFormatted = () => `${PLATFORM_CONFIG.pricing.currency} ${PLATFORM_CONFIG.pricing.joiningFee}`
export const getCurrency = () => PLATFORM_CONFIG.pricing.currency
export const getPlatformName = () => PLATFORM_CONFIG.platform.name
export const getSupportPhone = () => PLATFORM_CONFIG.platform.supportPhone
export const getSupportEmail = () => PLATFORM_CONFIG.platform.supportEmail

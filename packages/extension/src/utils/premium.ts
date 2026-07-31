import { generateHash, type Premium } from "../store/wsk-store.js"

/**
 * Validates the premium status of a user by checking the hash.
 * This prevents simple tampering with local storage values.
 */
export const validatePremium = (premium: Premium): boolean => {
  if (!premium || premium.status === "free") return true
  
  if (!premium.licenseKey || !premium._hash) return false
  
  const expectedHash = generateHash(premium.status, premium.licenseKey)
  return premium._hash === expectedHash
}

/**
 * Helper to check if a user has active premium status
 */
export const isPremiumActive = (premium: Premium): boolean => {
  if (!validatePremium(premium)) return false
  if (premium.status !== "premium") return false
  
  // Check expiry if exists
  if (premium.expiryDate) {
    const expiry = new Date(premium.expiryDate)
    return expiry > new Date()
  }
  
  return true
}

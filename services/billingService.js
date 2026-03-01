import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

class BillingService {
  constructor() {
    this.isInitialized = false;
    this.entitlementId = 'premium_access'; // Change this to your actual Entitlement ID from RevenueCat
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Only proceed if running on a native platform (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        // Enable debug logs in development
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

        if (Capacitor.getPlatform() === 'android') {
          await Purchases.configure({ 
            apiKey: "goog_your_android_api_key", // TODO: Get this from RevenueCat > Project Settings > API Keys
            appUserID: null 
          });
          this.isInitialized = true;
          console.log('RevenueCat initialized for Android');
        }
      } else {
        console.log('RevenueCat: Web platform detected, using mock mode');
        this.isInitialized = true; // Mark as initialized to avoid repeated attempts
      }
    } catch (e) {
      console.error('Failed to initialize RevenueCat:', e);
    }
  }

  async checkPremiumStatus() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active[this.entitlementId];
    } catch (e) {
      console.error('Error checking premium status:', e);
      return false;
    }
  }

  async getOfferings() {
    if (!Capacitor.isNativePlatform()) {
      // Return mock offerings for web preview
      return [
        { id: 'monthly', product: { priceString: '$0.99', title: 'Monthly Support' } },
        { id: 'annual', product: { priceString: '$9.99', title: 'Annual Support' } }
      ];
    }
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      console.error('Error fetching offerings:', e);
      return [];
    }
  }

  async purchasePackage(pack) {
    if (!Capacitor.isNativePlatform()) {
      console.log('Mock purchase successful on web');
      return true;
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pack });
      return !!customerInfo.entitlements.active[this.entitlementId];
    } catch (e) {
      if (e.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase error:', e);
      }
      return false;
    }
  }

  async restorePurchases() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const customerInfo = await Purchases.restorePurchases();
      return !!customerInfo.entitlements.active[this.entitlementId];
    } catch (e) {
      console.error('Restore error:', e);
      return false;
    }
  }
}

export const billingService = new BillingService();

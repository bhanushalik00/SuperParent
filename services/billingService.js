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
      // Enable debug logs in development
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      // Only configure if running on Android
      if (Capacitor.getPlatform() === 'android') {
        await Purchases.configure({ 
          apiKey: "goog_your_android_api_key", // TODO: Get this from RevenueCat > Project Settings > API Keys
          appUserID: null 
        });
        this.isInitialized = true;
        console.log('RevenueCat initialized for Android');
      } else {
        console.log('RevenueCat: Not on Android, skipping native initialization');
      }
    } catch (e) {
      console.error('Failed to initialize RevenueCat:', e);
    }
  }

  async checkPremiumStatus() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return !!customerInfo.entitlements.active[this.entitlementId];
    } catch (e) {
      console.error('Error checking premium status:', e);
      return false;
    }
  }

  async getOfferings() {
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

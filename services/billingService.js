import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

class BillingService {
  constructor() {
    this.isInitialized = false;
    this.entitlementId = 'premium'; // Important: Must match the Identifier in RevenueCat > Entitlements
  }

  async init() {
    if (this.isInitialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

        let apiKey = '';
        if (Capacitor.getPlatform() === 'android') {
          apiKey = "goog_WIeFdMjEmipmSkjVnVbheDuLStv"; // TODO: Get this from RevenueCat > Project Settings > API Keys > Android
        } else if (Capacitor.getPlatform() === 'ios') {
          apiKey = "appl_YOUR_REVENUECAT_IOS_API_KEY"; // TODO: Get this from RevenueCat > Project Settings > API Keys > App Store
        }

        if (apiKey) {
          await Purchases.configure({ 
            apiKey: apiKey,
            appUserID: null 
          });
          this.isInitialized = true;
          console.log(`RevenueCat initialized for ${Capacitor.getPlatform()}`);
        } else {
          console.warn(`RevenueCat: No API key for platform ${Capacitor.getPlatform()}`);
        }
      } else {
        console.log('RevenueCat: Web platform detected, using mock mode');
        this.isInitialized = true;
      }
    } catch (e) {
      console.error('Failed to initialize RevenueCat:', e);
    }
  }

  async checkPremiumStatus() {
    if (!Capacitor.isNativePlatform()) return false;
    if (!this.isInitialized) {
      console.warn('RevenueCat: Attempted to check status before initialization');
      await this.init();
    }
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
    
    if (!this.isInitialized) {
      console.warn('RevenueCat: Attempted to fetch offerings before initialization');
      await this.init();
    }

    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
      console.log('RevenueCat: No current offerings available');
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

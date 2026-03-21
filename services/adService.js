import { AdMob, BannerAdPosition, BannerAdSize, BannerAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

class AdService {
  constructor() {
    this.isInitialized = false;
    // Replace these with your actual Ad Unit IDs from AdMob
    this.adUnitIds = {
      android: {
        // Replace with your real Ad Unit IDs from AdMob
        banner: 'ca-app-pub-8414725641734374/8285725953', 
        interstitial: 'ca-app-pub-8414725641734374/9323744954',
        rewarded: 'YOUR_ANDROID_REWARDED_ID_HERE'
      }
    };
  }

  async init() {
    if (this.isInitialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await AdMob.initialize({
          requestTrackingAuthorization: true,
          testingDevices: [], 
          initializeForTesting: false, // Set to false for production
        });
        this.isInitialized = true;
        console.log('AdMob initialized');
      } else {
        console.log('AdMob: Web platform detected, skipping native initialization');
        this.isInitialized = true;
      }
    } catch (e) {
      console.error('Failed to initialize AdMob:', e);
    }
  }

  async showBanner() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Mock Banner: Banner ad would show here on native');
      return;
    }
    if (!this.isInitialized) {
      console.warn('AdMob not initialized, skipping banner');
      return;
    }

    const options = {
      adId: this.adUnitIds.android.banner,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      // isTesting: true // Uncomment for testing
    };

    try {
      await AdMob.showBanner(options);
    } catch (e) {
      console.error('Error showing banner ad:', e);
    }
  }

  async hideBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.hideBanner();
    } catch (e) {
      console.error('Error hiding banner ad:', e);
    }
  }

  async resumeBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.resumeBanner();
    } catch (e) {
      console.error('Error resuming banner ad:', e);
    }
  }

  async removeBanner() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.removeBanner();
    } catch (e) {
      console.error('Error removing banner ad:', e);
    }
  }

  async prepareInterstitial() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await AdMob.prepareInterstitial({
        adId: this.adUnitIds.android.interstitial,
        // isTesting: true // Uncomment for testing
      });
    } catch (e) {
      console.error('Error preparing interstitial ad:', e);
    }
  }

  async showInterstitial() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Mock Interstitial: Interstitial ad would show here on native');
      return;
    }
    try {
      await AdMob.showInterstitial();
    } catch (e) {
      console.error('Error showing interstitial ad:', e);
    }
  }
}

export const adService = new AdService();

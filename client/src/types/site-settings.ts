export interface ReviewVerificationSettings {
  reviewVerificationEnabled: boolean;
  reviewVerificationVideoUrl: string;
  reviewVerificationPrompt: string;
  reviewVerificationTimecode: string;
  reviewVerificationYouTubeChannelUrl: string;
}

export interface SiteSettings extends ReviewVerificationSettings {
  reviewVerificationPassphrase: string;
  backgroundImageUrl?: string;
  monetizationVerifiedSellersEnabled?: boolean;
  monetizationVerifiedSellerFee?: number;
  monetizationBoostingEnabled?: boolean;
  monetizationBoostingCommissionPct?: number;
  monetizationPremiumEnabled?: boolean;
  monetizationPremiumMonthlyPrice?: number;
  monetizationAffiliateEnabled?: boolean;
  monetizationAffiliateCommissionPct?: number;
}

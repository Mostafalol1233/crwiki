export interface ReviewVerificationSettings {
  reviewVerificationEnabled: boolean;
  reviewVerificationVideoUrl: string;
  reviewVerificationPrompt: string;
  reviewVerificationTimecode: string;
  reviewVerificationYouTubeChannelUrl: string;
}

export interface SiteSettings extends ReviewVerificationSettings {
  reviewVerificationPassphrase: string;
}


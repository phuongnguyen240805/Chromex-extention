import React from "react";
import { Check, Sparkles, X } from "lucide-react";
import { useTranslation } from "~i18n";

export const PremiumPanel = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const features = [
    t("premium_feature_free"),
    t("premium_feature_friends"),
    t("premium_feature_groups"),
    t("premium_feature_ai"),
    t("premium_feature_comments"),
    t("premium_feature_requests"),
    t("premium_feature_download"),
    t("premium_feature_security"),
    t("premium_feature_backup"),
    t("premium_feature_liked_pages"),
    t("premium_feature_joined_groups"),
    t("premium_feature_sent_requests"),
    t("premium_feature_early_access")
  ];

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl z-50 flex justify-center items-start p-4 animate-in fade-in duration-300">
      {/* 
        - mt-[1cm]: Cách lề trên đúng 1cm
        - max-w-md: Giữ độ rộng chuẩn
        - h-auto: Chiều cao tự động co theo nội dung để ngắn lại
      */}
      <div className="bg-[rgb(var(--bg-main))] w-full max-w-md mt-[1cm] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-[rgba(var(--border-main),var(--border-opacity))] overflow-hidden relative animate-in zoom-in-95 duration-400">
        
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-main))] hover:bg-[rgb(var(--bg-card))] rounded-2xl transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Padding giảm từ p-10 xuống p-7 để ngắn lại */}
        <div className="p-7 relative">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-black font-inter text-[rgb(var(--text-main))] tracking-tight">{t("premium_title")}</h2>
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              {t("premium_popular")}
            </div>
          </div>
          <p className="text-[rgb(var(--text-muted))] font-medium font-inter mb-6 text-base">{t("premium_subtitle")}</p>

          {/* Price Box: Thu gọn padding và size chữ */}
          <div className="flex items-baseline gap-3 mb-6 bg-[rgb(var(--bg-card))] p-5 rounded-[1.8rem] border border-[rgba(var(--border-main),var(--border-opacity))]">
            <span className="text-[rgb(var(--text-muted))] line-through text-xl font-bold">$4.99</span>
            <span className="text-4xl font-black text-[rgb(var(--text-main))]">$2.99</span>
            <span className="text-[rgb(var(--text-muted))] font-bold text-base">{t("premium_price_period")}</span>
          </div>

          {/* Features List: Giảm spacing và max-height */}
          <div className="space-y-3.5 mb-7 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <div className="flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
                  <Check size={18} className="text-blue-400 stroke-[3]" />
                </div>
                <span className="text-[14px] font-bold font-inter text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text-main))] transition-colors">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button: Thu gọn padding dọc */}
          <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-[1.2rem] font-black font-inter text-lg shadow-[0_10px_30px_rgba(59,130,246,0.3)] hover:shadow-[0_15px_40px_rgba(59,130,246,0.4)] transition-all active:scale-[0.97] flex items-center justify-center gap-3">
             <Sparkles size={20} className="animate-pulse" />
             {t("premium_cta")}
          </button>
        </div>
      </div>
    </div>
  );
};
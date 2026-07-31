/**
 * Anti-FB Phishing detector
 * Detects and warns about suspicious links and common phishing patterns on Facebook
 */
export const initAntiPhishing = () => {
    console.log("FB AIO: Anti-Phishing detector initializing...");

    const suspiciousKeywords = [
        'nhận quà', 'trúng thưởng', 'khóa tài khoản', 'xác minh danh tính',
        'free gift', 'winner', 'account locked', 'verify account',
        'facebook-security', 'fb-login', 'meta-support'
    ];

    const isSuspiciousLink = (href: string, text: string): boolean => {
        const lowerHref = href.toLowerCase();
        const lowerText = text.toLowerCase();

        if (lowerHref.includes('face') || lowerHref.includes('fb')) {
            if (!lowerHref.includes('facebook.com') && !lowerHref.includes('fb.com') && !lowerHref.includes('messenger.com')) {
                return true;
            }
        }

        if (!lowerHref.includes('facebook.com') && !lowerHref.includes('fb.com')) {
            if (suspiciousKeywords.some(kw => lowerText.includes(kw))) {
                return true;
            }
        }
        return false;
    };

    const checkLinks = () => {
        const links = document.querySelectorAll('a[href*="http"]');
        links.forEach((el: Element) => {
            const link = el as HTMLAnchorElement;
            if (link.hasAttribute('data-phishing-checked')) return;
            link.setAttribute('data-phishing-checked', 'true');

            if (isSuspiciousLink(link.href, link.innerText)) {
                link.style.border = '2px solid red';
                link.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                link.title = 'WARNING: This link looks suspicious! Be careful.';
                
                link.addEventListener('click', (e) => {
                    if (!confirm('WARNING: This link might be a phishing scam. Are you sure you want to visit it?')) {
                        e.preventDefault();
                    }
                }, { capture: true });
            }
        });
    };

    checkLinks();
    const observer = new MutationObserver(() => checkLinks());
    observer.observe(document, { childList: true, subtree: true });
};

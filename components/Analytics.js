"use client";

import { useEffect } from "react";

export default function Analytics() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

    if (!gaId && !clarityId) return;

    let scriptsLoaded = false;

    const loadScripts = () => {
      if (scriptsLoaded) return;
      scriptsLoaded = true;

      // Clean up event listeners
      window.removeEventListener("scroll", loadScripts);
      window.removeEventListener("mousemove", loadScripts);
      window.removeEventListener("touchstart", loadScripts);

      // Load GA4
      if (gaId) {
        const gaScript = document.createElement("script");
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        gaScript.async = true;
        document.head.appendChild(gaScript);

        const gaInitScript = document.createElement("script");
        gaInitScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag("js", new Date());
          gtag("config", "${gaId}", {
            page_path: window.location.pathname,
          });
        `;
        document.head.appendChild(gaInitScript);
      }

      // Load Microsoft Clarity
      if (clarityId) {
        const clarityScript = document.createElement("script");
        clarityScript.innerHTML = `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window,document,"clarity","script","${clarityId}");
        `;
        document.head.appendChild(clarityScript);
      }
    };

    // Trigger loading on interaction or after 3.5 seconds timeout (fallback)
    window.addEventListener("scroll", loadScripts, { passive: true });
    window.addEventListener("mousemove", loadScripts, { passive: true });
    window.addEventListener("touchstart", loadScripts, { passive: true });

    const timeoutId = setTimeout(loadScripts, 3500);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", loadScripts);
      window.removeEventListener("mousemove", loadScripts);
      window.removeEventListener("touchstart", loadScripts);
    };
  }, []);

  return null;
}

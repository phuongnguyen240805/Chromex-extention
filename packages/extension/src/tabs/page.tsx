import React, { useEffect, useState } from "react";

export default function PageTab() {
  const [iframeSrc, setIframeSrc] = useState<string>("");

  useEffect(() => {
    chrome.storage.local.get(null, (storageData) => {
      // Retrieve settings either from 'settings' or 'wsk-state'
      const rawWskState = storageData?.["wsk-state"];
      const parsedWskState = typeof rawWskState === "string" ? JSON.parse(rawWskState) : rawWskState;
      const settings = storageData?.settings || parsedWskState?.state || {};
      const apiKey = settings.apiKey || "";

      const params = new URLSearchParams(window.location.search);
      const page = params.get("page") || "";
      const id = params.get("id") || "";
      const loc = btoa(window.location.href);

      const isDev = process.env.NODE_ENV === "development";
      let src = "";

      if (isDev) {
        src = `http://localhost:8080/${page}.html?apiKey=${apiKey}&t=${Date.now()}`;
      } else {
        src = `https://keywordseverywhere.com/ke/3/${page}.php?apiKey=${apiKey}&t=${Date.now()}`;
      }

      if (page === "autocomplete" || page === "list") {
        const query = params.get("query") || "";
        const service = params.get("service") || "";
        const tld = params.get("tld") || "";
        const lng = params.get("lng") || "";
        src += `&query=${encodeURIComponent(query)}&service=${encodeURIComponent(service)}&tld=${encodeURIComponent(tld)}&lng=${encodeURIComponent(lng)}`;
      }

      if (page === "hashtags") {
        const service = params.get("service") || "";
        const version = chrome.runtime.getManifest().version;
        src += `&service=${encodeURIComponent(service)}&version=${encodeURIComponent(version)}`;
      }

      if (page === "analyze" || page === "keywords") {
        src += `&loc=${encodeURIComponent(loc)}`;
      }

      if (page === "keywords" || page === "bulkTraffic") {
        const target = params.get("target") || "";
        src += `&target=${encodeURIComponent(target)}`;
      }

      if (page === "gap") {
        const type = params.get("type") || "";
        src += `&type=${encodeURIComponent(type)}`;
      }

      if (page === "trends") {
        const country = params.get("country");
        const timerange = params.get("timerange") || "";
        const prop = params.get("prop") || "";
        const terms = params.get("terms") || "";
        
        if (country) src += `&country=${encodeURIComponent(country)}`;
        src += `&timerange=${encodeURIComponent(timerange)}&prop=${encodeURIComponent(prop)}&terms=${encodeURIComponent(terms)}`;
      }

      if (id) {
        src += `&id=${encodeURIComponent(id)}`;
      }

      setIframeSrc(src);
    });
  }, []);

  if (!iframeSrc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F172A] text-slate-200 font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-semibold text-sm">Loading iframe container...</span>
        </div>
      </div>
    );
  }

  return (
    <iframe
      src={iframeSrc}
      className="w-screen h-screen border-none"
      title="Keywords Everywhere External Panel"
    />
  );
}

import React, { useEffect, useState, useRef } from "react";
import * as api from "../services/openai/api";
import { processPageHTML } from "../services/openai/page-parser";

export const OpenAiWidget: React.FC = () => {
  // Config state
  const [categories, setCategories] = useState<Record<string, api.Category>>({});
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Record<string, string>>({});
  const [voiceTones, setVoiceTones] = useState<Record<string, string>>({});
  const [writingStyles, setWritingStyles] = useState<Record<string, string>>({});

  // Selection state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubcat, setSelectedSubcat] = useState<string>("");
  const [templates, setTemplates] = useState<Record<string, api.TemplateItem>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateDetails, setTemplateDetails] = useState<api.TemplateDetails | null>(null);

  // Global settings
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [selectedCountry, setSelectedCountry] = useState<string>("us");
  const [selectedTone, setSelectedTone] = useState<string>("default");
  const [selectedStyle, setSelectedStyle] = useState<string>("default");

  // Inputs state
  const [inputsState, setInputsState] = useState<Record<string, string>>({});
  const [apiDataStatus, setApiDataStatus] = useState<Record<string, "idle" | "loading" | "success" | "error">>({});
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [compiledPrompt, setCompiledPrompt] = useState<string>("");

  const sourceRef = useRef<string>("");

  // Load initial settings and options
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get("source") || "openai";
    sourceRef.current = source;

    api.openAIFetchCategories(source).then(setCategories).catch(console.error);
    api.openAIFetchLanguages().then(setLanguages).catch(console.error);
    api.openAIFetchCountries().then(setCountries).catch(console.error);
    api.openAIFetchVoiceTones().then(setVoiceTones).catch(console.error);
    api.openAIFetchWritingStyles().then(setWritingStyles).catch(console.error);
  }, []);

  // Fetch templates when subcategory changes
  useEffect(() => {
    if (!selectedSubcat) {
      setTemplates({});
      return;
    }
    api.openAIFetchTemplates(selectedSubcat, sourceRef.current)
      .then(setTemplates)
      .catch(console.error);
  }, [selectedSubcat]);

  // Fetch template details when template changes
  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplateDetails(null);
      return;
    }
    const cleanId = selectedTemplateId.replace(/^premium_/, "");
    api.openAIFetchTemplate(cleanId, sourceRef.current)
      .then(details => {
        setTemplateDetails(details);
        // Initialize dynamic inputs state
        const initialInputs: Record<string, string> = {};
        const initialStatus: Record<string, "idle"> = {};
        details.inputs?.forEach(inp => {
          initialInputs[inp.name] = inp.default_text || "";
          if (["URL", "SERP", "YouTube_Video_URL"].includes(inp.type)) {
            initialStatus[inp.name] = "idle";
          }
        });
        setInputsState(initialInputs);
        setApiDataStatus(initialStatus);
        setTemplateVars({});
      })
      .catch(console.error);
  }, [selectedTemplateId]);

  // Compile prompt whenever template inputs or global variables change
  useEffect(() => {
    if (!templateDetails) {
      setCompiledPrompt("");
      return;
    }

    let prompt = templateDetails.prompt;
    const subst: Record<string, string> = {};

    // Dynamic inputs
    Object.entries(inputsState).forEach(([name, val]) => {
      subst[name] = val.trim().replace(/"/g, "");
    });

    // Globals
    subst["language"] = languages[selectedLang] || selectedLang;
    subst["country"] = countries[selectedCountry] || selectedCountry;

    if (selectedTone === "default" || !selectedTone) {
      subst["tone_of_voice"] = "";
    } else {
      subst["tone_of_voice"] = `You have a ${voiceTones[selectedTone] || selectedTone} tone of voice.`;
    }

    if (selectedStyle === "default" || !selectedStyle) {
      subst["writing_style"] = "";
    } else {
      subst["writing_style"] = `You have a ${writingStyles[selectedStyle] || selectedStyle} writing style.`;
    }

    // Custom scraped vars
    Object.entries(templateVars).forEach(([key, val]) => {
      subst[key] = val;
    });

    // Run substitution
    Object.entries(subst).forEach(([key, val]) => {
      const re = new RegExp(`{${key}}`, "g");
      prompt = prompt.replace(re, val);
    });

    setCompiledPrompt(prompt);
  }, [templateDetails, inputsState, selectedLang, selectedCountry, selectedTone, selectedStyle, templateVars, languages, countries, voiceTones, writingStyles]);

  // Handle postMessage resize whenever states that change document height update
  useEffect(() => {
    const handleResize = () => {
      const height = document.body.offsetHeight;
      window.parent.postMessage({
        cmd: "xt.resize",
        data: {
          height,
          source: sourceRef.current
        }
      }, "*");
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [templateDetails, inputsState, apiDataStatus, templateVars, compiledPrompt]);

  // Scraping logic for URL/SERP/Youtube inputs
  const handleFetchData = async (inputName: string, type: "url" | "serp" | "youtube_video_url") => {
    let val = inputsState[inputName] || "";
    if (!val) return;

    if (type === "url" && !val.match(/^https?:\/\//)) {
      val = "https://" + val;
    } else if (type === "serp") {
      val = "https://www.google.com/search?q=" + encodeURIComponent(val);
    }

    setApiDataStatus(prev => ({ ...prev, [inputName]: "loading" }));

    chrome.runtime.sendMessage({
      cmd: "ajax.getPageHTML",
      data: { url: val }
    }, async (response) => {
      if (!response || response.error) {
        setApiDataStatus(prev => ({ ...prev, [inputName]: "error" }));
        return;
      }

      try {
        const pageData = await processPageHTML(type, response.data);
        
        // Save advanced variables mapping
        const newVars: Record<string, string> = {};
        if (type === "url") {
          newVars[`${inputName}.title`] = pageData.title;
          newVars[`${inputName}.description`] = pageData.description;
          newVars[`${inputName}.content`] = pageData.cleanFullText;
          newVars[`${inputName}.total_words`] = String(pageData.wordsTotal);
          newVars[`${inputName}.headings`] = pageData.allHeaders;
          pageData.headers.forEach((arr, i) => {
            newVars[`${inputName}.headings_h${i + 1}`] = arr.join("\n");
          });
        } else if (type === "youtube_video_url") {
          newVars[`${inputName}.title`] = pageData.title;
          newVars[`${inputName}.description`] = pageData.description;
          newVars[`${inputName}.tags`] = pageData.tags || "";
        } else if (type === "serp") {
          const titles = pageData.results?.map(r => r.title).join("\n") || "";
          const descriptions = pageData.results?.map(r => r.description).join("\n") || "";
          newVars[`${inputName}.titles`] = titles;
          newVars[`${inputName}.descriptions`] = descriptions;
          newVars[`${inputName}.related_keywords`] = pageData.relatedKeywords?.join("\n") || "";
          newVars[`${inputName}.pasf_keywords`] = pageData.pasfKeywords?.join("\n") || "";
        }

        setTemplateVars(prev => ({ ...prev, ...newVars }));
        setApiDataStatus(prev => ({ ...prev, [inputName]: "success" }));
      } catch (err) {
        console.error(err);
        setApiDataStatus(prev => ({ ...prev, [inputName]: "error" }));
      }
    });
  };

  const handleExecute = () => {
    // Verify required inputs
    const emptyFields = templateDetails?.inputs?.filter(inp => !inputsState[inp.name]);
    if (emptyFields && emptyFields.length > 0) {
      alert(`Please fill out the following fields: ${emptyFields.map(f => f.label).join(", ")}`);
      return;
    }

    // Send final compiled prompt back to the content script
    window.parent.postMessage({
      cmd: "xt-openai-choose-template",
      data: {
        prompt: compiledPrompt
      }
    }, "*");

    // Close the widget iframe
    window.parent.postMessage({
      cmd: "xt-openai-widget.close"
    }, "*");
  };

  return (
    <div className="wsk-root text-slate-200 bg-[#0F172A] min-h-screen p-4 flex flex-col gap-4 text-xs font-semibold custom-scrollbar">
      
      {/* 1. Category Selection */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Category:</label>
          <select
            className="bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            value={selectedCategory}
            onChange={e => {
              setSelectedCategory(e.target.value);
              setSelectedSubcat("");
              setSelectedTemplateId("");
            }}
          >
            <option value="">Choose a category</option>
            {Object.keys(categories).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Sub-category:</label>
          <select
            className="bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedSubcat}
            onChange={e => {
              setSelectedSubcat(e.target.value);
              setSelectedTemplateId("");
            }}
            disabled={!selectedCategory}
          >
            <option value="">Select a sub-category</option>
            {selectedCategory && categories[selectedCategory]?.subcategories &&
              Object.entries(categories[selectedCategory].subcategories).map(([key, val]) => (
                <option key={key} value={key}>{val}</option>
              ))
            }
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Templates:</label>
          <select
            className="bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            value={selectedTemplateId}
            onChange={e => setSelectedTemplateId(e.target.value)}
            disabled={!selectedSubcat}
          >
            <option value="">Select a template</option>
            {Object.entries(templates).map(([key, item]) => (
              <option key={key} value={(item.paid ? "premium_" : "") + key}>
                {item.name} {item.paid ? "💎" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description / Instruction Block */}
      {!templateDetails && (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-lg p-3 text-slate-400 leading-relaxed">
          Please browse through categories and sub-categories above and select a prompt template that you'd like to execute.
        </div>
      )}

      {/* Global Config Section */}
      <div className="grid grid-cols-4 gap-3 bg-slate-900/30 p-3 rounded-lg border border-slate-800/40">
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Language:</label>
          <select
            className="bg-slate-900 border border-slate-800 rounded-md p-1.5 text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
          >
            {Object.entries(languages).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Country:</label>
          <select
            className="bg-slate-900 border border-slate-800 rounded-md p-1.5 text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
          >
            {Object.entries(countries).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Voice Tone:</label>
          <select
            className="bg-slate-900 border border-slate-800 rounded-md p-1.5 text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={selectedTone}
            onChange={e => setSelectedTone(e.target.value)}
          >
            <option value="default">Default Tone</option>
            {Object.entries(voiceTones).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Writing Style:</label>
          <select
            className="bg-slate-900 border border-slate-800 rounded-md p-1.5 text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={selectedStyle}
            onChange={e => setSelectedStyle(e.target.value)}
          >
            <option value="default">Default Style</option>
            {Object.entries(writingStyles).map(([key, val]) => (
              <option key={key} value={key}>{val}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Template Form Fields */}
      {templateDetails && templateDetails.inputs && templateDetails.inputs.length > 0 && (
        <div className="flex flex-col gap-3 bg-slate-900/20 p-3 rounded-lg border border-slate-800/40">
          <div className="text-sm font-bold text-slate-300 border-b border-slate-800 pb-1.5 mb-1">
            Template Variables
          </div>
          <div className="flex flex-col gap-3">
            {templateDetails.inputs.map(inp => {
              const labelWithHelp = (
                <div className="flex items-center gap-1">
                  <span className="text-slate-300">{inp.label}</span>
                  {inp.help_text && (
                    <span className="text-slate-500 hover:text-slate-300 cursor-help" title={inp.help_text}>
                      ❓
                    </span>
                  )}
                </div>
              );

              // 1. Text Inputs
              if (inp.type === "text" || inp.type === "number") {
                return (
                  <div key={inp.name} className="flex flex-col gap-1">
                    {labelWithHelp}
                    <input
                      type={inp.type}
                      className="bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={inputsState[inp.name] || ""}
                      onChange={e => setInputsState(prev => ({ ...prev, [inp.name]: e.target.value }))}
                      placeholder={inp.label}
                    />
                  </div>
                );
              }

              // 2. Textarea Inputs
              if (inp.type === "textarea") {
                return (
                  <div key={inp.name} className="flex flex-col gap-1">
                    {labelWithHelp}
                    <textarea
                      rows={3}
                      className="bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={inputsState[inp.name] || ""}
                      onChange={e => setInputsState(prev => ({ ...prev, [inp.name]: e.target.value }))}
                      placeholder={inp.label}
                    />
                  </div>
                );
              }

              // 3. Dropdowns
              if (inp.type === "dropdown") {
                const opts = inp.options?.split(/\s*,\s*/) || [];
                return (
                  <div key={inp.name} className="flex flex-col gap-1">
                    {labelWithHelp}
                    <select
                      className="bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={inputsState[inp.name] || ""}
                      onChange={e => setInputsState(prev => ({ ...prev, [inp.name]: e.target.value }))}
                    >
                      <option value="">Select option</option>
                      {opts.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                );
              }

              // 4. URL, SERP, Youtube Video URLs (Require Scrape action)
              if (["URL", "SERP", "YouTube_Video_URL"].includes(inp.type)) {
                const cleanType = (inp.type === "YouTube_Video_URL" ? "youtube_video_url" : inp.type.toLowerCase()) as "url" | "serp" | "youtube_video_url";
                const status = apiDataStatus[inp.name] || "idle";

                return (
                  <div key={inp.name} className="flex flex-col gap-1">
                    {labelWithHelp}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-md p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={inputsState[inp.name] || ""}
                        onChange={e => setInputsState(prev => ({ ...prev, [inp.name]: e.target.value }))}
                        placeholder={inp.label}
                        disabled={status === "loading"}
                      />
                      <button
                        onClick={() => handleFetchData(inp.name, cleanType)}
                        disabled={status === "loading" || !inputsState[inp.name]}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-md px-3 font-semibold transition-colors flex items-center gap-1.5"
                      >
                        {status === "loading" && (
                          <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        {status === "loading" ? "Fetching..." : "Get Data"}
                      </button>
                    </div>
                    {status === "success" && (
                      <span className="text-emerald-500 text-[10px]">Data extracted successfully!</span>
                    )}
                    {status === "error" && (
                      <span className="text-rose-500 text-[10px]">Failed to extract data. Please verify the URL.</span>
                    )}
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {/* Live Preview Textarea */}
      {templateDetails && (
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400">Prompt Template Preview:</label>
          <textarea
            rows={6}
            readOnly
            className="bg-slate-950 border border-slate-800 rounded-md p-2.5 text-slate-300 font-mono leading-relaxed focus:outline-none cursor-default"
            value={compiledPrompt}
          />
        </div>
      )}

      {/* Action Buttons */}
      {templateDetails && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-3.5 mt-1">
          <div className="text-[10px] text-slate-500">
            Powered by Keywords Everywhere
          </div>
          <button
            onClick={handleExecute}
            className="px-5 py-2 rounded-lg font-bold text-white transition-all bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 active:scale-95 shadow-md shadow-purple-500/10"
          >
            Execute Template
          </button>
        </div>
      )}

    </div>
  );
};

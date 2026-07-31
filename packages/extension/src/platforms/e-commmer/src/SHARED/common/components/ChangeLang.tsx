import { useTranslation } from "react-i18next";
import { Select } from "antd";
import { useEffect, useState } from "react";
import { useObservable } from "@ngneat/react-rxjs";
import { GlobalConfigsStore } from "../states/index.state";
import { select } from "@ngneat/elf";

function ChangeLang() {
  const [lang] = useObservable(GlobalConfigsStore.pipe(select((s) => s.lang)));
  const { t, i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  return (
    <Select
      size="small"
      value={lang}
      onChange={(value) => {
        GlobalConfigsStore.update((s) => ({ ...s, lang: value }));
      }}
      options={[
        { value: "vi", label: t("vietnamese") },
        { value: "en-US", label: t("english") },
      ]}
      dropdownStyle={{ zIndex: 1100 }}
    />
  );
}

export default ChangeLang;

import { useEffect, useState } from "react";
import ShopeeBuyerShop from "./shop";
import { waitForElementToAppear } from "../../../../../../SHARED/utils/helper";
import { Checkbox } from "antd";
import { GlobalConfigsStore } from "../../../../../../SHARED/common/states/index.state";
import { useTranslation } from "react-i18next";
import { useObservable } from "@ngneat/react-rxjs";
import { select } from "@ngneat/elf";
function ShopeeBuyerEntry(props: { pathname: string }) {
  const [isShop, setIsShop] = useState(false);

  useEffect(() => {
    const sub = waitForElementToAppear(".shop-page .shop-page__info").subscribe(
      (elements) => {
        setTimeout(() => {
          setIsShop(elements.length > 0);
        }, 500);
      },
    );
    return () => {
      sub.unsubscribe();
    };
  }, [props.pathname]);
  const { t } = useTranslation();
  const [hideAnalytics] = useObservable(
    GlobalConfigsStore.pipe(select((s) => s.content?.hideAnalytics)),
  );

  return (
    <>
      {isShop ? <ShopeeBuyerShop /> : null}
      {props.pathname === "/search" || isShop ? (
        <Checkbox
          checked={hideAnalytics}
          onChange={(e) => {
            GlobalConfigsStore.update((s) => ({
              ...s,
              content: {
                ...s.content,
                hideAnalytics: e.target.checked,
              },
            }));
            location.reload();
          }}
        >
          {t("translation:hide_analytics")}
        </Checkbox>
      ) : null}
    </>
  );
}

export default ShopeeBuyerEntry;

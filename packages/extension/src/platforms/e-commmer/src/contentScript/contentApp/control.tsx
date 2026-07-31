import { Alert, notification, Space, Spin, Typography } from "antd";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ShopeeBuyerProductsDetail from "./content/pages/shopee/buyer/products/detail";
import { getCurrentUID } from "../../SHARED/utils/helper";
import RequireSupport from "../../SHARED/common/components/RequireSupport";
import ShopeeBuyerEntry from "./content/pages/shopee/buyer";
import ShopeeSellerOrderList from "./content/pages/shopee/seller/orders-list";
import LazadaBuyerEntry from "./content/pages/lazada/buyer";
import LazadaBuyerProductDetail from "./content/pages/lazada/buyer/products/detail";
import AliexpressBuyer from "./content/pages/aliexpress/buyer";
import AliexpressProductDetail from "./content/pages/aliexpress/buyer/products/detail";
import Buyer1688ProductDetail from "./content/pages/1688/buyer/products/detail";
import Buyer1688 from "./content/pages/1688/buyer";
import TaobaoBuyer from "./content/pages/taobao/buyer";
import TaobaoBuyerProductsDetail from "./content/pages/taobao/buyer/products/detail";
import TmallBuyerProductDetail from "./content/pages/taobao/buyer/products/detail/Tmall";
import ShopeeSeller from "./content/pages/shopee/seller";
import TiktokBuyer from "./content/pages/tiktok/buyer";
import TiktokBuyerProduct from "./content/pages/tiktok/buyer/product";
import TiktokBuyerProductPdp from "./content/pages/tiktok/buyer/product-pdp";
import KiotVietPriceBook from "./content/pages/kiotviet/price-book";
import TiktokSellerProductList from "./content/pages/tiktok/seller/product-list";
import ViettelPost from "./content/pages/viettelpost";
import TiktokSellerOrdersList from "./content/pages/tiktok/seller/orders-list";
import PinduoduoBuyer from "./content/pages/pinduoduo/buyer";
import PinduoduoBuyerProductsDetail from "./content/pages/pinduoduo/buyer/products/detail";
export const isShopeeBuyer = (hostname: string) => {
  hostname = hostname.replace("www.", "");
  return hostname.split(".")[0] === "shopee";
};

const isShopeeSeller = (hostname: string) => {
  hostname = hostname.replace("www.", "");

  return (
    hostname.split(".")[1] == "shopee" &&
    ["seller", "banhang"].includes(hostname.split(".")[0])
  );
};

const isShopeeSellerOrdersPage = (pathname: string) => {
  return pathname.includes("/portal/sale");
};

const isShopeeBuyerProduct = (pathname: string) => {
  return true;
};
const isLazadaBuyer = (hostname: string) => {
  hostname = hostname.replace("www.", "");

  return hostname.split(".")[0] === "lazada";
};

const isLazadaBuyerProduct = (pathname: string) => {
  return (
    /^\/products\/.*i(\d+)-s(\d+)\.html$/g.test(pathname) ||
    /^\/products\/.*i(\d+).html$/g.test(pathname)
  );
};

const isAliexpressBuyer = (hostname: string) => {
  hostname = hostname.replace("www.", "");

  return hostname.split(".").includes("aliexpress");
};
const isAliexpressBuyerDetailProduct = (pathname: string) => {
  return /^\/item\/.*\.html$/g.test(pathname);
};

const is1688Buyer = (hostname: string) => {
  hostname = hostname.replace("www.", "");
  return hostname.split(".")[1] === "1688";
};

const is1688BuyerDetailProduct = (pathname: string) => {
  return /^\/offer\/.*\.html$/g.test(pathname);
};
const isTaobaoBuyer = (hostname: string) => {
  hostname = hostname.replace("www.", "");

  return hostname.includes("taobao");
};

const isTmallBuyer = (hostname: string) => {
  return hostname.includes("tmall");
};

const isDetailProduct = (pathname: string) => {
  return /^\/item\.htm$/.test(pathname) || /\/\w+\/item\.htm/.test(pathname);
};

const isTiktokBuyer = (hostname: string) => {
  return hostname.includes("tiktok");
};

const isTiktokBuyerProduct = (pathname: string) => {
  // https://www.tiktok.com/view/product/1732131340104796995
  // Support optional trailing slash and prevent hash/query strings from breaking match
  return /^\/view\/product\/\d+\/?(?:[#?].*)?$/.test(pathname);
};

const isTiktokBuyerProductPdp = (pathname: string) => {
  // https://shop.tiktok.com/vn/pdp/some-slug/123 or https://shop.tiktok.com/vn/pdp/123
  // Strip trailing slash/params for cleaning check if needed, but regex here is already good
  return (
    /^\/[a-z]{2}\/pdp\/(?:.*\/)?(\d+)\/?(?:[#?].*)?$/.test(pathname) ||
    /^\/shop\/vn\/pdp\/(?:.*\/)?(\d+)\/?(?:[#?].*)?$/.test(pathname)
  );
};

const isTiktokSeller = (hostname: string) => {
  return (hostname.includes("seller") || hostname.includes("shop")) && hostname.includes("tiktok.com");
};

const isTiktokSellerProductList = (pathname: string) => {
  // /product/manage
  return /^\/product\/manage$/.test(pathname);
};

const isTiktokSellerOrdersList = (pathname: string) => {
  // /order/list
  return /^\/order$/.test(pathname);
};

const isKiotViet = (hostname: string) => {
  hostname = hostname.replace("www.", "");

  return hostname.split(".")[1] === "kiotviet";
};

const isKiotVietPriceBook = (pathname: string) => {
  // example: https://shopsieure912.kiotviet.vn/man/#/PriceBook

  return pathname == "/man/#/PriceBook";
};

const isViettelPost = (hostname: string) => {
  hostname = hostname.replace("www.", "");

  return hostname == "viettelpost.vn";
};

const isPinduoduoBuyer = (hostname: string) => {
  return hostname.includes("yangkeduo") || hostname.includes("pinduoduo");
};

const isPinduoduoBuyerProduct = (pathname: string) => {
  return /^\/goods\d*\.html$/.test(pathname);
};
function ControlShowComponent(props: { pathname: string }) {
  const { pathname } = props;
  const hostname = window.location.hostname;
  const [api, contextHolder] = notification.useNotification();

  // Use useMemo to prevent re-computing these values on every render
  const hostChecks = useMemo(() => {
    return {
      isShopeeBuyer: isShopeeBuyer(hostname),
      isShopeeSeller: isShopeeSeller(hostname),
      isLazadaBuyer: isLazadaBuyer(hostname),
      isAliexpressBuyer: isAliexpressBuyer(hostname),
      is1688Buyer: is1688Buyer(hostname),
      isTaobaoBuyer: isTaobaoBuyer(hostname),
      isTmallBuyer: isTmallBuyer(hostname),
      isTiktokBuyer: isTiktokBuyer(hostname),
      isKiotViet: isKiotViet(hostname),
      isTiktokSeller: isTiktokSeller(hostname),
      isViettelPost: isViettelPost(hostname),
      isPinduoduoBuyer: isPinduoduoBuyer(hostname),
    };
  }, [hostname]);

  const pathChecks = useMemo(() => {
    return {
      isShopeeBuyerProduct: isShopeeBuyerProduct(pathname),
      isShopeeSellerOrdersPage: isShopeeSellerOrdersPage(pathname),
      isLazadaBuyerProduct: isLazadaBuyerProduct(pathname),
      isAliexpressBuyerDetailProduct: isAliexpressBuyerDetailProduct(pathname),
      is1688BuyerDetailProduct: is1688BuyerDetailProduct(pathname),
      isDetailProduct: isDetailProduct(pathname),
      isTiktokBuyerProduct: isTiktokBuyerProduct(pathname),
      isTiktokBuyerProductPdp: isTiktokBuyerProductPdp(pathname),
      isTiktokSellerProductList: isTiktokSellerProductList(pathname),
      isTiktokSellerOrdersList: isTiktokSellerOrdersList(pathname),
      isKiotVietPriceBook: isKiotVietPriceBook(pathname),
      isPinduoduoBuyerProduct: isPinduoduoBuyerProduct(pathname),
    };
  }, [pathname]);

  // Redirect TikTok product URLs to clean versions (strip query strings from shared links)
  useEffect(() => {
    if (hostChecks.isTiktokBuyer && pathChecks.isTiktokBuyerProduct && window.location.search) {
      window.location.replace(window.location.origin + window.location.pathname);
    }
  }, [pathname]);

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      {contextHolder}
      {hostChecks.isShopeeBuyer ? (
        <>
          <ShopeeBuyerEntry pathname={pathname} />
          {pathChecks.isShopeeBuyerProduct ? (
            <ShopeeBuyerProductsDetail pathname={pathname} />
          ) : null}
        </>
      ) : null}

      {hostChecks.isShopeeSeller ? (
        <>
          {pathChecks.isShopeeSellerOrdersPage ? (
            <>
              <ShopeeSellerOrderList pathname={pathname} />
            </>
          ) : (
            <ShopeeSeller />
          )}
        </>
      ) : null}

      {hostChecks.isLazadaBuyer ? (
        <>
          <LazadaBuyerEntry />
          {pathChecks.isLazadaBuyerProduct ? (
            <LazadaBuyerProductDetail pathname={pathname} />
          ) : null}
        </>
      ) : null}

      {hostChecks.isAliexpressBuyer ? (
        <>
          <AliexpressBuyer />
          {pathChecks.isAliexpressBuyerDetailProduct ? (
            <AliexpressProductDetail pathname={pathname} />
          ) : null}
        </>
      ) : null}

      {hostChecks.is1688Buyer ? (
        <>
          <Buyer1688 />
          {pathChecks.is1688BuyerDetailProduct ? (
            <Buyer1688ProductDetail pathname={pathname} />
          ) : null}
        </>
      ) : null}

      {hostChecks.isTaobaoBuyer ? (
        <>
          <TaobaoBuyer />
          {pathChecks.isDetailProduct ? (
            <TaobaoBuyerProductsDetail pathname={pathname} />
          ) : null}
        </>
      ) : null}

      {hostChecks.isTmallBuyer ? (
        <>
          <TmallBuyerProductDetail pathname={pathname} />
        </>
      ) : null}

      {hostChecks.isTiktokBuyer ? (
        <>
          <TiktokBuyer />
          {pathChecks.isTiktokBuyerProduct ? (
            <TiktokBuyerProduct pathname={pathname} />
          ) : null}
          {pathChecks.isTiktokBuyerProductPdp ? (
            <TiktokBuyerProductPdp pathname={pathname} />
          ) : null}
        </>
      ) : null}

      {hostChecks.isTiktokSeller ? (
        <>
          {pathChecks.isTiktokSellerProductList ? (
            <TiktokSellerProductList pathname={pathname} />
          ) : null}
          {pathChecks.isTiktokSellerOrdersList ? (
            <TiktokSellerOrdersList />
          ) : null}
        </>
      ) : null}

      {hostChecks.isKiotViet ? (
        <>{pathChecks.isKiotVietPriceBook ? <KiotVietPriceBook /> : null}</>
      ) : null}

      {hostChecks.isPinduoduoBuyer ? (
        <>
          <PinduoduoBuyer />
          {pathChecks.isPinduoduoBuyerProduct ? (
            <PinduoduoBuyerProductsDetail pathname={pathname} />
          ) : null}
        </>
      ) : null}

      {hostChecks.isViettelPost ? <ViettelPost /> : null}
      <Space>
        <RequireSupport isSimple={true} />
      </Space>
    </Space>
  );
}

export default ControlShowComponent;

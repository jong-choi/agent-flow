import { hasLocale } from "next-intl";
import {
  type GetRequestConfigParams,
  type RequestConfig,
  getRequestConfig,
} from "next-intl/server";
import { getMessage } from "@/lib/i18n/messages";
import { routing } from "@/lib/i18n/routing";

const requestConfig = async ({
  requestLocale,
}: GetRequestConfigParams): Promise<RequestConfig> => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [Home, ErrorBoundary, NotFound] = await Promise.all([
    getMessage["Home"][locale](),
    getMessage["ErrorBoundary"][locale](),
    getMessage["NotFound"][locale](),
  ]);

  return {
    locale,
    messages: {
      Home,
      ErrorBoundary,
      NotFound,
    },
  };
};

export default getRequestConfig(requestConfig);

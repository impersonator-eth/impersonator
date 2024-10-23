import { MutableRefObject, useEffect, useState } from "react";
import { MessageFormatter } from "./messageFormatter";
import {
  SDKMessageEvent,
  MethodToResponse,
  Methods,
  ErrorResponse,
  RequestId,
} from "../types";
import { getSDKVersion } from "./utils";

type MessageHandler = (
  msg: SDKMessageEvent
) =>
  | void
  | MethodToResponse[Methods]
  | ErrorResponse
  | Promise<MethodToResponse[Methods] | ErrorResponse | void>;

export enum LegacyMethods {
  getEnvInfo = "getEnvInfo",
}

type SDKMethods = Methods | LegacyMethods;

class AppCommunicator {
  private iframeRef: MutableRefObject<HTMLIFrameElement | null>;
  private handlers = new Map<SDKMethods, MessageHandler>();

  constructor(iframeRef: MutableRefObject<HTMLIFrameElement | null>) {
    this.iframeRef = iframeRef;

    window.addEventListener("message", this.handleIncomingMessage);
  }

  on = (method: SDKMethods, handler: MessageHandler): void => {
    this.handlers.set(method, handler);
  };

  private isValidMessage = (msg: SDKMessageEvent): boolean => {
    if (msg.data.hasOwnProperty("isCookieEnabled")) {
      return true;
    }

    const sentFromIframe = this.iframeRef.current?.contentWindow === msg.source;
    const knownMethod = Object.values(Methods).includes(msg.data.method);

    return sentFromIframe && knownMethod;
  };

  private canHandleMessage = (msg: SDKMessageEvent): boolean => {
    return Boolean(this.handlers.get(msg.data.method));
  };

  send = (data: unknown, requestId: RequestId, error = false): void => {
    const sdkVersion = getSDKVersion();
    const msg = error
      ? MessageFormatter.makeErrorResponse(
          requestId,
          data as string,
          sdkVersion
        )
      : MessageFormatter.makeResponse(requestId, data, sdkVersion);
    // console.log("send", { msg });
    this.iframeRef.current?.contentWindow?.postMessage(msg, "*");
  };

  handleIncomingMessage = async (msg: SDKMessageEvent): Promise<void> => {
    const validMessage = this.isValidMessage(msg);
    const hasHandler = this.canHandleMessage(msg);

    if (validMessage && hasHandler) {
      // console.log("incoming", { msg: msg.data });

      const handler = this.handlers.get(msg.data.method);
      try {
        // @ts-expect-error Handler existence is checked in this.canHandleMessage
        const response = await handler(msg);

        // If response is not returned, it means the response will be sent somewhere else
        if (typeof response !== "undefined") {
          this.send(response, msg.data.id);
        }
      } catch (err: any) {
        this.send(err.message, msg.data.id, true);
      }
    }
  };

  clear = (): void => {
    window.removeEventListener("message", this.handleIncomingMessage);
  };
}

const useAppCommunicator = (
  iframeRef: MutableRefObject<HTMLIFrameElement | null>
): AppCommunicator | undefined => {
  const [communicator, setCommunicator] = useState<AppCommunicator | undefined>(
    undefined
  );
  useEffect(() => {
    let communicatorInstance: AppCommunicator;
    const initCommunicator = (
      iframeRef: MutableRefObject<HTMLIFrameElement>
    ) => {
      communicatorInstance = new AppCommunicator(iframeRef);
      setCommunicator(communicatorInstance);
    };

    initCommunicator(iframeRef as MutableRefObject<HTMLIFrameElement>);

    return () => {
      communicatorInstance?.clear();
    };
  }, [iframeRef]);

  return communicator;
};

export { useAppCommunicator };

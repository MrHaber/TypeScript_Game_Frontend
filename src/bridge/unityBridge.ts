import { UnityOutboundEvent } from '../types';

declare global {
  interface Window {
    unityInstance?: {
      SendMessage: (gameObject: string, methodName: string, value: string) => void;
    };
    UchiUnityBridge?: {
      send: (event: UnityOutboundEvent) => void;
      receive: (type: string, payload?: unknown) => void;
    };
  }
}

const UNITY_GAME_OBJECT = 'WebFrontendBridge';
const UNITY_METHOD = 'OnFrontendEvent';

export function sendUnityEvent(event: UnityOutboundEvent) {
  window.dispatchEvent(new CustomEvent('uchi:frontend-event', { detail: event }));

  if (window.unityInstance?.SendMessage) {
    window.unityInstance.SendMessage(UNITY_GAME_OBJECT, UNITY_METHOD, JSON.stringify(event));
  }
}

export function installUnityBridge(onUnityMessage: (type: string, payload?: unknown) => void) {
  window.UchiUnityBridge = {
    send: sendUnityEvent,
    receive: onUnityMessage,
  };

  return () => {
    delete window.UchiUnityBridge;
  };
}

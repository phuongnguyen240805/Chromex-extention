import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { AppContentDraggable } from "./draggable";
// @ts-nocheck
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useObservable } from "@ngneat/react-rxjs";
import { GlobalConfigsStore } from "../../SHARED/common/states/index.state";
import { select } from "@ngneat/elf";
import { map } from "rxjs";
import { ConfigProvider, message } from "antd";
import { AppContentDroppable } from "./droppable";
import viVN from "antd/locale/vi_VN";

import type { ArgsProps } from "antd/es/message";
import { sendMessageToBackground } from "../../SHARED/common/states/common";
// Create Context
const MessageContext = createContext<(args: ArgsProps) => void>(() => {});

export const useMessage = () => useContext(MessageContext);
function AppContent() {

  const [currentPosition] = useObservable(
    GlobalConfigsStore.pipe(
      select((s) => s.content?.currentPosition),
      map((s) => s || { x: 10, y: 10 }),
    ),
  );

  // Use memoized sensors to prevent unnecessary re-creations
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 200,
      },
    }),
  );

  // Memoize drag handler to prevent unnecessary re-renders
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { x, y } = event.delta;
      GlobalConfigsStore.update((s) => ({
        ...s,
        content: {
          ...s.content,
          currentPosition: {
            x: currentPosition.x + x,
            y: currentPosition.y - y,
          },
        },
      }));
    },
    [currentPosition.x, currentPosition.y],
  );

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    let mounted = true;

    sendMessageToBackground("GET_TAB_ID").then((tabId) => {
      if (mounted) {
        GlobalConfigsStore.update((s) => ({
          ...s,
          content: {
            ...s.content,
            tabId,
          },
        }));
      }
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
    };
  }, []);

  // Memoize style to prevent unnecessary re-renders
  const positionStyle = useMemo(
    () => ({
      position: "fixed" as const,
      left: currentPosition.x,
      bottom: currentPosition.y,
    }),
    [currentPosition.x, currentPosition.y],
  );

  // Memoize theme config to prevent unnecessary re-renders
  const themeConfig = useMemo(
    () => ({
      token: {
        colorPrimary: "rgb(73 82 255)",
        colorPrimaryHover: "rgb(64 71 211)",
        colorPrimaryActive: "#3021d9",
        borderRadius: 6,
        colorError: "#c90708",
        padding: 8,
        margin: 8,
        colorBgLayout: "#f6f8fa",
      },
    }),
    [],
  );

  return (
    <ConfigProvider
      theme={themeConfig}
      locale={viVN}
    >
      <MessageContext.Provider value={messageApi.open}>
        {contextHolder}
        <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
          <AppContentDroppable>
            <div style={positionStyle}>
              <AppContentDraggable id="sx-content-draggable" />
            </div>
          </AppContentDroppable>
        </DndContext>
      </MessageContext.Provider>
    </ConfigProvider>
  );
}

export default AppContent;

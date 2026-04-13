"use client";

import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import { ReactRenderer } from "@tiptap/react";
import { Suggestion } from "@tiptap/suggestion";
import {
  buildSlashCommandItems,
  filterSlashItems,
  type SlashCommandItem,
} from "./slash-command-types";
import {
  SlashCommandMenu,
  type SlashCommandMenuHandle,
} from "./SlashCommandMenu";

export const slashCommandPluginKey = new PluginKey("slashCommand");

export type SlashCommandExtensionOptions = {
  onRequestImageUpload?: () => void;
};

function positionSlashMenu(
  element: HTMLElement,
  getRect: () => DOMRect | null
) {
  const rect = getRect();
  if (!rect) return;

  const w = 300;
  const margin = 8;
  let top = rect.bottom + margin;
  let left = rect.left;

  const estHeight = Math.min(element.offsetHeight || 240, 320);
  if (top + estHeight > window.innerHeight - margin) {
    top = rect.top - estHeight - margin;
  }
  if (left + w > window.innerWidth - margin) {
    left = window.innerWidth - w - margin;
  }

  element.style.position = "fixed";
  element.style.left = `${Math.max(margin, left)}px`;
  element.style.top = `${Math.max(margin, top)}px`;
  element.style.zIndex = "250";
}

export const SlashCommandExtension =
  Extension.create<SlashCommandExtensionOptions>({
    name: "slashCommand",

    addOptions() {
      return {
        onRequestImageUpload: undefined,
      };
    },

    addProseMirrorPlugins() {
      const editor = this.editor;
      const { onRequestImageUpload } = this.options;

      const allItems = buildSlashCommandItems({
        onRequestImageUpload,
      });

      let component: ReactRenderer<SlashCommandMenuHandle> | null = null;
      let updatePosition: (() => void) | null = null;
      let latestClientRect: (() => DOMRect | null) | null = null;

      return [
        Suggestion({
          pluginKey: slashCommandPluginKey,
          editor,
          char: "/",
          allowSpaces: false,
          allowedPrefixes: [" ", "\n"],
          decorationClass: "slash-command-decoration",
          command: ({ editor: ed, range, props: item }) => {
            item.command({ editor: ed, range });
          },
          items: ({ query }) => filterSlashItems(allItems, query),
          allow: ({ state, range }) => {
            const $from = state.doc.resolve(range.from);
            for (let d = $from.depth; d > 0; d--) {
              if ($from.node(d).type.name === "codeBlock") {
                return false;
              }
            }
            return true;
          },
          render: () => ({
            onStart: (props) => {
              latestClientRect = props.clientRect ?? null;

              component = new ReactRenderer(SlashCommandMenu, {
                editor: props.editor,
                props: {
                  items: props.items,
                  query: props.query,
                  command: (item: SlashCommandItem) => {
                    props.command(item);
                  },
                },
              });

              component.element.classList.add("slash-command-floating");

              updatePosition = () => {
                if (!component) return;
                positionSlashMenu(
                  component.element as HTMLElement,
                  () => latestClientRect?.() ?? null
                );
              };

              updatePosition();
              window.addEventListener("scroll", updatePosition, true);
              window.addEventListener("resize", updatePosition);

              document.body.appendChild(component.element);
            },

            onUpdate: (props) => {
              latestClientRect = props.clientRect ?? null;

              component?.updateProps({
                items: props.items,
                query: props.query,
                command: (item: SlashCommandItem) => {
                  props.command(item);
                },
              });

              requestAnimationFrame(() => updatePosition?.());
            },

            onExit: () => {
              if (updatePosition) {
                window.removeEventListener("scroll", updatePosition, true);
                window.removeEventListener("resize", updatePosition);
              }
              updatePosition = null;
              latestClientRect = null;
              component?.destroy();
              component = null;
            },

            onKeyDown: (keyProps) => {
              if (keyProps.event.key === "Escape") {
                keyProps.event.preventDefault();
                editor
                  .chain()
                  .focus()
                  .deleteRange(keyProps.range)
                  .run();
                return true;
              }

              return component?.ref?.onKeyDown(keyProps) ?? false;
            },
          }),
        }),
      ];
    },
  });

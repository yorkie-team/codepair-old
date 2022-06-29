import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { useSelector } from 'react-redux';
import { ActorID, DocEvent } from 'yorkie-js-sdk';
import CodeMirror from 'codemirror';
import SimpleMDE from 'easymde';
import SimpleMDEReact from 'react-simplemde-editor';
import { Marpit } from '@marp-team/marpit';

import { AppState } from 'app/rootReducer';
import { ConnectionStatus, Metadata } from 'features/peerSlices';
import { Theme as ThemeType } from 'features/settingSlices';
import { Preview } from 'features/docSlices';

import { NAVBAR_HEIGHT } from '../Editor';
import Cursor from './Cursor';

import 'easymde/dist/easymde.min.css';
import 'codemirror/keymap/sublime';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/vim';

const marpit = new Marpit();
const slideTheme = `
/* @theme example */
section {
  width: 100%;
  background-color: #000;
  color: #fff;
  font-size: 30px;
  padding: 40px;
  margin: 10px;
  border: 10px solid black;
}

h1, h2 {
  text-align: center;
  margin: 0;
}

h1 {
  color: #fff;
}
`;
marpit.themeSet.default = marpit.themeSet.add(slideTheme);

function renderSlide(markdownPlainText: string, previewElement: HTMLElement): string {
  const { html, css } = marpit.render(markdownPlainText);
  // @ts-ignore
  const self = this as any;
  setTimeout(() => {
    if (!self.style) {
      self.style = document.createElement('style');
      document.head.appendChild(self.style);            
    }
    self.style.innerHTML = css;

    // eslint-disable-next-line no-param-reassign
    previewElement.innerHTML = html;
  }, 20);

  // @ts-ignore
  return null;
}

const WIDGET_HEIGHT = 70;

interface CodeEditorProps {
  forwardedRef: React.MutableRefObject<CodeMirror.Editor | null>;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    dark: {
      '& .CodeMirror': {
        color: theme.palette.common.white,
        borderColor: theme.palette.background.paper,
        backgroundColor: theme.palette.background.paper,
      },
      '& .CodeMirror-cursor': {
        borderLeftColor: theme.palette.common.white,
        color: theme.palette.common.white,
      },
      '& .editor-toolbar': {
        backgroundColor: '#303030',
      },
      '& .editor-toolbar > *': {
        color: theme.palette.common.white,
      },
      '& .editor-toolbar > .active, .editor-toolbar > button:hover, .editor-preview pre, .cm-s-easymde .cm-comment': {
        backgroundColor: theme.palette.background.paper,
      },
      '& .editor-preview': {
        backgroundColor: theme.palette.background.default,
      },
      '& .editor-preview-side': {
        border: 'none',
      },
    },
  }),
);

export default function CodeEditor({ forwardedRef }: CodeEditorProps) {
  const classes = useStyles();

  const doc = useSelector((state: AppState) => state.docState.doc);
  const preview = useSelector((state: AppState) => state.docState.preview);
  const menu = useSelector((state: AppState) => state.settingState.menu);
  const client = useSelector((state: AppState) => state.docState.client);
  const peers = useSelector((state: AppState) => state.peerState.peers);
  const cursorMapRef = useRef<Map<ActorID, Cursor>>(new Map());

  const connectCursor = useCallback((clientID: ActorID, metadata: Metadata) => {
    cursorMapRef.current.set(clientID, new Cursor(clientID, metadata));
  }, []);

  const disconnectCursor = useCallback((clientID: ActorID) => {
    if (cursorMapRef.current.has(clientID)) {
      cursorMapRef.current.get(clientID)!.clear();
      cursorMapRef.current.delete(clientID);
    }
  }, []);

  const getCmInstanceCallback = useCallback(
    (editor: CodeMirror.Editor) => {
      if (!client || !doc) {
        return;
      }

      // eslint-disable-next-line no-param-reassign
      forwardedRef.current = editor;

      const updateCursor = (clientID: ActorID, pos: CodeMirror.Position) => {
        const cursor = cursorMapRef.current.get(clientID);
        cursor?.updateCursor(editor, pos);
      };

      const updateLine = (clientID: ActorID, fromPos: CodeMirror.Position, toPos: CodeMirror.Position) => {
        const cursor = cursorMapRef.current.get(clientID);
        cursor?.updateLine(editor, fromPos, toPos);
      };

      // 02. display remote cursors
      doc.subscribe((event: DocEvent) => {
        if (event.type === 'remote-change') {
          for (const { change } of event.value) {
            const actor = change.getID().getActorID()!;
            if (actor !== client.getID()) {
              if (!cursorMapRef.current.has(actor)) {
                return;
              }

              const cursor = cursorMapRef.current.get(actor);
              if (cursor!.isActive()) {
                return;
              }

              updateCursor(actor, editor.posFromIndex(0));
            }
          }
        }
      });

      // 03. local to remote
      editor.on('beforeChange', (instance: CodeMirror.Editor, change: CodeMirror.EditorChange) => {
        if (change.origin === 'yorkie' || change.origin === 'setValue') {
          return;
        }

        const from = editor.indexFromPos(change.from);
        const to = editor.indexFromPos(change.to);
        const content = change.text.join('\n');

        doc.update((root) => {
          root.content.edit(from, to, content);
        });
      });

      editor.on('beforeSelectionChange', (instance: CodeMirror.Editor, data: CodeMirror.EditorSelectionChange) => {
        if (!data.origin) {
          return;
        }

        const from = editor.indexFromPos(data.ranges[0].anchor);
        const to = editor.indexFromPos(data.ranges[0].head);

        doc.update((root) => {
          root.content.select(from, to);
        });
      });

      // 04. remote to local
      const root = doc.getRoot();
      root.content.onChanges((changes) => {
        changes.forEach((change) => {
          const { actor, from, to } = change;
          if (change.type === 'content') {
            const content = change.content || '';

            if (actor !== client.getID()) {
              const fromPos = editor.posFromIndex(from);
              const toPos = editor.posFromIndex(to);
              editor.replaceRange(content, fromPos, toPos, 'yorkie');
            }
          } else if (change.type === 'selection') {
            if (actor !== client.getID()) {
              let fromPos = editor.posFromIndex(from);
              let toPos = editor.posFromIndex(to);
              updateCursor(actor, toPos);

              if (from > to) {
                [toPos, fromPos] = [fromPos, toPos];
              }
              updateLine(actor, fromPos, toPos);
            }
          }
        });
      });

      editor.addKeyMap(menu.codeKeyMap);
      editor.setOption('keyMap', menu.codeKeyMap);
      if (menu.codeKeyMap === 'vim') {
        editor.addKeyMap('vim-insert');
        editor.addKeyMap('vim-replace');
      }

      // 05. initial value
      editor.setValue(root.content.toString());
      editor.getDoc().clearHistory();
      editor.focus();
    },
    [client, doc, menu],
  );

  useEffect(() => {
    for (const [id, peer] of Object.entries(peers)) {
      if (cursorMapRef.current.has(id) && peer.status === ConnectionStatus.Disconnected) {
        disconnectCursor(id);
      } else if (!cursorMapRef.current.has(id) && peer.status === ConnectionStatus.Connected) {
        connectCursor(id, peer.metadata);
      }
    }
  }, [peers]);

  const options = useMemo(() => {
    const opts = {
      spellChecker: false,
      placeholder: 'Write code here and share...',
      tabSize: Number(menu.tabSize),
      maxHeight: `calc(100vh - ${NAVBAR_HEIGHT + WIDGET_HEIGHT}px)`,
      toolbar: [
        'bold',
        'italic',
        '|',
        'unordered-list',
        'ordered-list',
        '|',
        'code',
        'link',
        'image',
        'table',
        '|',
        'side-by-side',
        'preview',
        'fullscreen',
      ],
      unorderedListStyle: '-',
      status: false,
      shortcuts: {
        toggleUnorderedList: null,
      },
    } as SimpleMDE.Options;

    if (preview === Preview.Slide) {
      opts.previewRender = renderSlide;
    }
    return opts;
  }, [preview]);

  return (
    <SimpleMDEReact
      className={menu.theme === ThemeType.Dark ? classes.dark : ''}
      getCodemirrorInstance={getCmInstanceCallback}
      options={options}
    />
  );
}

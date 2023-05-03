/* eslint-disable */
import CodeMirror, { TextMarker } from 'codemirror';

interface TldrawOptions {
  emit: (event: string, message: any, trigger?: (event: string, message: any) => void) => void;
}

class TldrawPreview {
  cm: CodeMirror.Editor;
  options: TldrawOptions;
  widget: any;
  markers: any;
  constructor(cm: CodeMirror.Editor, options: TldrawOptions) {
    this.cm = cm;
    this.options = options;
    this.widget = null;
    this.markers = {};

    this.initEvent();
  }

  emit(event: string, message: any, trigger?: (event: string, message: any) => void) {
    this.options.emit(event, message, trigger);
  }

  initEvent() {
    this.cm.on('mousedown', this.onMousedown.bind(this));
    this.cm.on('change', this.change.bind(this));
    this.cm.on('refresh', this.refresh.bind(this));

    this.emit('tldraw-preview-init', null);
  }

  onMousedown(cm: CodeMirror.Editor, evt: any) {
    var target = evt.target || evt.srcElement;
    if (target.className === 'tldraw-preview') {
      evt.preventDefault();
      var pos = this.cm.coordsChar({ left: evt.clientX, top: evt.clientY });

      // Find any markers at the clicked position
      var marks = this.cm.findMarksAt(pos);

      const currentLineNo = (marks[0] as any).lines[0].lineNo();
      const totalLineNo = this.cm.lineCount();
      let lastLineNo = totalLineNo - 1;

      // if current line is last line, then insert new line
      for (var i = currentLineNo + 1; i < totalLineNo; i++) {
        if (this.cm.getLine(i).startsWith('```')) {
          lastLineNo = i;
          break;
        }
      }

      const range = this.cm.getRange({ line: currentLineNo + 1, ch: 0 }, { line: lastLineNo, ch: 0 });

      let content: any = undefined;

      try {
        content = JSON.parse(range);
      } catch (e) {
        console.log(e);
      }

      this.emit(
        'tldraw-preview-click',
        {
          currentLineNo,
          lastLineNo,
          id: target.id,
          content,
        },
        (event: string, message: any) => {
          if (event === 'tldraw-preview-save') {
            this.updateDraw(message);
          }
        },
      );
    }
  }

  updateDraw(message: any) {
    const currentMark = this.cm.getAllMarks().find((mark: any) => {
      return mark.replacedWith.id === message.id;
    });

    if (currentMark) {
      const currentLineNo = (currentMark as any).lines[0].lineNo();
      const totalLineNo = this.cm.lineCount();
      let lastLineNo = totalLineNo - 1;

      // if current line is last line, then insert new line
      for (var i = currentLineNo + 1; i < totalLineNo; i++) {
        if (this.cm.getLine(i).startsWith('```')) {
          lastLineNo = i;
          break;
        }
      }

      this.cm.operation(() => {
        this.cm.replaceRange(
          '' + JSON.stringify(message.content) + '\n',
          { line: currentLineNo + 1, ch: 0 },
          { line: lastLineNo, ch: 0 },
        );
      });
    }
  }

  change(cm: CodeMirror.Editor, evt: any) {
    this.updateAll();
  }

  refresh() {
    this.change(this.cm, { origin: 'setValue' });
  }

  updateAll() {
    this.cm.operation(() => {
      var max = this.cm.lineCount();
      for (var lineNo = 0; lineNo < max; lineNo++) {
        this.match(lineNo);
      }
    });
  }

  match(lineNo: number) {
    let lastLineNo = lineNo;

    const tokens = this.cm.getLineTokens(lineNo);

    if (tokens[0]?.string === '```tldraw') {
      const target = {
        line: lineNo,
        ch: tokens[0]?.end,
      };

      const markers = this.cm.findMarksAt(target);

      if (!markers.length) {
        const el = this.create_marker(target.line, target.ch);

        this.set_mark(target.line, target.ch, el);
      }
    } else {
      //   this.empty_marker(lineNo);
    }
  }

  make_element() {
    const div = document.createElement('div');
    div.className = 'tldraw-preview';
    // div.innerHTML = content;
    div.style.display = 'inline-block';
    div.style.position = 'relative';
    div.style.verticalAlign = 'middle';
    div.textContent = 'M';
    div.style.backgroundColor = 'yellow';
    div.style.width = '1em';
    div.style.height = '1em';
    div.style.borderRadius = '4px';
    div.style.textAlign = 'center';
    div.style.lineHeight = '1em';
    div.style.fontSize = '0.8em';
    div.style.fontWeight = 'bold';
    div.style.color = 'black';
    div.style.cursor = 'pointer';
    div.style.marginLeft = '0.5em';
    div.id = `tldraw-id-${Date.now()}`;

    return div;
  }

  key(lineNo: number, ch: number) {
    return [lineNo, ch].join(':');
  }

  init() {
    this.markers = {}; // initialize marker list
  }

  addMarker(div: HTMLElement, lineNo: number, ch: number) {
    this.markers[this.key(lineNo, ch)] = div;
  }

  //   empty_marker(lineNo: number) {
  //     var lineHandle = this.cm.getLineHandle(lineNo);

  //     const ch = lineHandle.text.length;

  //     var list = this.cm.findMarks({ line: lineNo, ch: 0 }, { line: lineNo, ch: 100 }) || [];

  //     for (var i = 0, len = list.length; i < len; i++) {
  //       var key = this.key(lineNo, list[i].from);

  //       if (key) {
  //         delete this.markers[key];
  //         list[i].marker.clear();
  //       }
  //     }
  //   }

  set_state(lineNo: number, start: number) {
    var marker = this.create_marker(lineNo, start);

    marker.lineNo = lineNo;
    marker.ch = start;

    return marker;
  }

  create_marker(lineNo: number, start: number) {
    if (!this.has_marker(lineNo, start)) {
      this.init_marker(lineNo, start);
    }

    return this.get_marker(lineNo, start);
  }

  init_marker(lineNo: number, start: number) {
    this.markers[this.key(lineNo, start)] = this.make_element();
  }

  has_marker(lineNo: number, start: number) {
    return !!this.get_marker(lineNo, start);
  }

  get_marker(lineNo: number, start: number) {
    var key = this.key(lineNo, start);
    return this.markers[key];
  }

  set_mark(line: number, ch: number, el: HTMLElement) {
    const marker = this.cm.setBookmark({ line: line, ch: ch }, { widget: el, handleMouseEvents: true });
    (el as any).marker = marker;
  }
}

(CodeMirror as any).defineOption('tldraw', false, function (cm: CodeMirror.Editor, options: TldrawOptions) {
  if (options) {
    cm.state.tldrawView = new TldrawPreview(cm, options);
  }
});

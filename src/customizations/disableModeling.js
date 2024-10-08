import { query, classes } from "min-dom";
var HIGH_PRIORITY = 10005;

function DisableModeling(
  eventBus,
  canvas,
  contextPad,
  dragging,
  directEditing,
  editorActions,
  modeling,
  palette,
  handTool,
) {
  const self = this;

  this._eventBus = eventBus;
  this._canvas = canvas;
  this.modelingDisabled = false;
  this.editorOpened = false;

  function disable() {
    //directEditing.cancel();
    contextPad.close();
    //dragging.cancel();

    // hiding palette
    //classes(self.canvasParent).add("exportMode");
   
    classes(self.palette).add("hidden");

  }

  function enable() {
    //classes(self.canvasParent).remove("exportMode");
    classes(self.palette).remove("hidden");
  }

  eventBus.on("import.done", function () {
    self.canvasParent = self._canvas.getContainer().parentNode;
    self.palette = query(".djs-palette", self._canvas.getContainer());
  });

  eventBus.on("TOGGLE_MODE_EVENT", HIGH_PRIORITY, function (context) {
    self.modelingDisabled = context.exportMode;

    if (self.modelingDisabled) {
      disable();
    } else {
      enable();
    }

    palette._update();
  });

  eventBus.on(
    ["OPEN_CODE_EDITOR", "OPEN_WYSIWYG_EDITOR"],
    HIGH_PRIORITY,
    function () {
      self.editorOpened = true;
      self.modelingDisabled = true;
      disable();
      palette._update();
    }
  );

  eventBus.on(
    ["SAVE_CODE_EDITOR", "SAVE_WYSIWYG_EDITOR"],
    HIGH_PRIORITY,
    function () {
      self.editorOpened = false;
      self.modelingDisabled = false;
      enable();
      palette._update();
    }
  );

  // TODO: NEED TO FIX THE SPACE KEYBINDING NOT WORKING
  // eventBus.on('keyboard.init', function() {
  //
  //   keyboard.addListener(2000, function(event) {
  //     var keyEvent = event.keyEvent;
  //
  //     if (self.modelingDisabled && self.editorOpened && isSpace(keyEvent)) {
  //       return;
  //     }
  //
  //   }, 'keyboard.keydown');
  //
  //   keyboard.addListener(2000, function(event) {
  //     var keyEvent = event.keyEvent;
  //
  //     if (self.modelingDisabled && self.editorOpened && isSpace(keyEvent)) {
  //       return;
  //     }
  //
  //   }, 'keyboard.keyup');
  //
  //   function isSpace(keyEvent) {
  //     return isKey(' ', keyEvent);
  //   }
  //
  // });

  function intercept(obj, fnName, cb) {
    var fn = obj[fnName];
    obj[fnName] = function () {
      return cb.call(this, fn, arguments);
    };
  }

  function ignoreIfModelingDisabledAndEditorIsOpen(obj, fnName) {
    intercept(obj, fnName, function (fn, args) {
      if (self.modelingDisabled && self.editorOpened) {
        return true;
      }

      return fn.apply(this, args);
    });
  }

  function ignoreIfModelingDisabled(obj, fnName) {
    intercept(obj, fnName, function (fn, args) {
      if (self.modelingDisabled) {
        return;
      }

      return fn.apply(this, args);
    });
  }

  function throwIfModelingDisabled(obj, fnName) {
    intercept(obj, fnName, function (fn, args) {
      if (self.modelingDisabled) {
        throw new Error("model is read-only");
      }

      return fn.apply(this, args);
    });
  }

  ignoreIfModelingDisabled(contextPad, "open");
  ignoreIfModelingDisabled(dragging, "init");
  ignoreIfModelingDisabled(directEditing, "activate");

  /*ignoreIfModelingDisabledAndEditorIsOpen(handTool, "activateMove");
  ignoreIfModelingDisabledAndEditorIsOpen(handTool, "activateHand");
  ignoreIfModelingDisabledAndEditorIsOpen(handTool, "toggle");*/

  //throwIfModelingDisabled(modeling, "moveShape");
  //throwIfModelingDisabled(modeling, "updateAttachment");
  //throwIfModelingDisabled(modeling, "moveElements");
  //throwIfModelingDisabled(modeling, "moveConnection");
  //throwIfModelingDisabled(modeling, "layoutConnection");
  //throwIfModelingDisabled(modeling, "createConnection");
  /*throwIfModelingDisabled(modeling, "createShape");
  //throwIfModelingDisabled(modeling, "createLabel");
  throwIfModelingDisabled(modeling, "appendShape");
  throwIfModelingDisabled(modeling, "removeElements");
  throwIfModelingDisabled(modeling, "distributeElements");
  throwIfModelingDisabled(modeling, "removeShape");
  throwIfModelingDisabled(modeling, "removeConnection");
  throwIfModelingDisabled(modeling, "replaceShape");
  throwIfModelingDisabled(modeling, "pasteElements");
  throwIfModelingDisabled(modeling, "alignElements");

  // throwIfModelingDisabled(modeling, 'resizeShape');
  throwIfModelingDisabled(modeling, "createSpace");
  throwIfModelingDisabled(modeling, "updateWaypoints");
  throwIfModelingDisabled(modeling, "reconnectStart");
  throwIfModelingDisabled(modeling, "reconnectEnd");*/

  intercept(editorActions, "trigger", function (fn, args) {
    var action = args[0];

    if (
      self.modelingDisabled &&
      isAnyAction(
        [
          "undo",
          "redo",
          "copy",
          "paste",
          "removeSelection",
          "spaceTool",
          "lassoTool",
          "globalConnectTool",
          "distributeElements",
          "alignElements",
          "directEditing"
        ],
        action
      )
    ) {
      return;
    }

    if (
      self.modelingDisabled &&
      self.editorOpened &&
      isAnyAction(
        [
          "activateHandtool",
          "toggleTokenSimulation",
          "resetTokenSimulation",
          "toggleTokenSimulationLog",
          "togglePauseTokenSimulation"
        ],
        action
      )
    ) {
      return false;
    }

    return fn.apply(this, args);
  });
}

DisableModeling.$inject = [
  "eventBus",
  "canvas",
  "contextPad",
  "dragging",
  "directEditing",
  "editorActions",
  "modeling",
  "palette",
  "handTool"
];

// helpers //////////

function isAnyAction(actions, action) {
  return actions.indexOf(action) > -1;
}

export default {
  __init__: ["DisableModeling"],
  DisableModeling: ["type", DisableModeling]
};

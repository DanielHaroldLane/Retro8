define(function(require) {
  'use strict';

  var operations = require('./operations'),
    font = require('./font'),
    keyboard = require('./keyboard'),
    NotEnoughMemory = require('./errors/notenoughmemory'),
    memoryLimit = 4096,
    registerCount = 16,
    width = 64,
    height = 32,
    stackSize = 16,
    reset, cycle, handleTimers, loadProgram, loadFont;

  function Interpreter() {
    this.program_counter = 0x200;
    this.stack_pointer = 0;
    this.index_register = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.registers = initRegisters();
    this.memory = initMemory();
    this.display = initDisplay(width, height);
    this.keyboard = initKeyboard();
    this.stack = initStack();
    this.reset = reset;
    this.loadFont = loadFont;
    this.cycle = cycle;
    this.handleTimers = handleTimers;
    this.render = false;
    this.loadProgram = loadProgram;
    this.running = false;
    loadFont.call(this);
  }

  Interpreter.prototype = {
    initDisplay: initDisplay,
    initMemory: initMemory,
    initRegisters: initRegisters,
    initKeyboard: initKeyboard,
    initStack: initStack
  };

  reset = function reset() {
    this.program_counter = 0x200;
    this.stack = initStack();
    this.stack_pointer = 0;
    this.index_register = 0;
    this.registers = initRegisters();
    this.memory = initMemory();
    this.display = initDisplay(width, height);
    this.keyboard = initKeyboard();
    this.loadFont();
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.render = false;
    this.running = false;
  };

  function initStack() {
    return new Uint16Array(stackSize);
  }

  function initRegisters() {
    return new Uint8Array(registerCount);
  }

  function initMemory() {
    return new Uint8Array(memoryLimit);
  }

  function initDisplay(w, h) {
    var display = new Array(w);
    for (var i = 0; i < w; i++) {
      display[i] = new Array(h);
      for (var j = 0; j < h; j++) {
        display[i][j] = 0;
      }
    }

    return display;
  }

  cycle = function cycle() {
    var opcode = this.memory[this.program_counter] << 8 | this.memory[this.program_counter + 1];
    this.program_counter += 2;

    var op = operations.getOps(opcode, this); // decode
    op.call(undefined, opcode, this); // execute
  };

  /*
   * Decrements Chip8 timers if > 0
   */
  handleTimers = function handleTimers() {
    if (this.delayTimer > 0)
      this.delayTimer -= 1;

    if (this.soundTimer > 0) {
      // dispatch beep sound here.
      this.soundTimer -= 1;
    }
  };

  /*
   * Fonts are loaded into the reserved interpreter memory
   * space (0x000 to 0x1FF)
   */
  loadFont = function loadFont() {
    var length = font.length;
    for (var i = 0; i < length; i++) {
      this.memory[i] = font[i];
    }
  };

  /*
   * Loads a binary file into memory starting at 0x200
   */
  loadProgram = function loadProgram(binary) {
    var writableMemory = memoryLimit - 0x200;

    if (binary.length > writableMemory)
      throw new NotEnoughMemory(binary.length, writableMemory);

    for (var i = 0; i < binary.length; i++) {
      this.memory[i + 0x200] = binary[i];
    }
  };

  function initKeyboard() {
    return keyboard.keys();
  }

  return Interpreter;
});

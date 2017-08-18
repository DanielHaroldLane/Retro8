define(function() {
  'use strict';

  var operations = {
    0x0007: setVxToDelay,
    0x000A: setVxToKey,
    0x0015: setDelayTimer,
    0x0018: setSoundTimer,
    0x001E: addVxToIdxReg,
    0x0029: setIdxToSprite,
    0x0033: setBcd,
    0x0055: regDump,
    0x0065: regLoad
  };

  function getOps(opcode, self) {
    return operations[(opcode & 0x00FF)];
  }

  /*
   * Sets VX to the value of the delay timer.
   * pseudo: Vx = get_delay()
   * operator type: Timer
   * opcode: FX07
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function setVxToDelay(opcode, self) {
    var vx = (opcode & 0x0F00) >> 8;
    self.registers[vx] = self.delayTimer;

    self.program_counter += 2;
  }

  /*
   * A key press is awaited, and then stored in VX.
   * (Blocking Operation. All instruction halted until next key event)
   * pseudo: Vx = get_key()
   * operator type: Keyboard
   * opcode: FX0A
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function setVxToKey(opcode, self) {
    var pressed = false;
    var key = null;

    for (var prop in self.keyboard) {
      if (self.keyboard[prop] !== 1)
        continue;
      pressed = true;
      key = parseInt(prop, 10);
      break;
    }

    if (pressed !== true)
      return;

    var vx = (opcode & 0x0F00) >> 8;
    self.registers[vx] = key;
    self.program_counter += 2;
  }

  /*
   * Sets the delay timer to VX.
   * pseudo: 	delay_timer(Vx)
   * operator type: Timer
   * opcode: FX15
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function setDelayTimer(opcode, self) {
    var vx = (opcode & 0x0F00) >> 8;
    self.delayTimer = self.registers[vx];

    self.program_counter += 2;
  }

  /*
   * Sets the sound timer to VX.
   * pseudo: 	sound_timer(Vx)
   * operator type: Timer
   * opcode: FX18
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function setSoundTimer(opcode, self) {
    var vx = (opcode & 0x0F00) >> 8;
    self.soundTimer = self.registers[vx];

    self.program_counter += 2;
  }

  /*
   * Adds VX to I
   * pseudo: 	i += vx
   * operator type: Memory
   * opcode: FX1E
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function addVxToIdxReg(opcode, self) {
    var vx = (opcode & 0x0F00) >> 8;
    self.index_register += self.registers[vx];

    self.program_counter += 2;
  }

  /*
   * Sets I to the location of the sprite for the character in Vx.
   * Characters 0-F (in hexadecimal) are represented by a 4x5 font.
   * pseudo: I=sprite_addr[Vx]
   * operator type: Memory
   * opcode: FX29
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function setIdxToSprite(opcode, self) {
    var vx = (opcode & 0x0F00) >> 8;
    self.index_register = self.registers[vx] * 5;

    self.program_counter += 2;
  }

  /*
   * Stores the binary-coded decimal representation of VX, with the most significant of three digits at the address in I.
   * The middle digit at I plus 1, and the least significant digit at I plus 2.
   * (In other words, take the decimal representation of VX,
   * place the hundreds digit in memory at location in I,
   * the tens digit at location I+1, and the ones digit at location I+2.)
   * Characters 0-F (in hexadecimal) are represented by a 4x5 font.
   * pseudo: set_BCD(Vx);
   *         (I+0)=BCD(3);
   *         (I+1)=BCD(2);
   *         (I+2)=BCD(1);
   * operator type: Memory
   * opcode: FX33
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function setBcd(opcode, self) {
    var vx = self.registers[(opcode & 0x0F00)];

    for (var i = 3; i > 0; i--) { // i is set to the decimal number size
      self.memory[self.index_register + i - 1] = parseInt(vx % 10); // we modulo by 10 to get the BCD
      vx = Math.floor(vx / 10); // reduces the decimal number to its next lowest unit
    }

    self.program_counter += 2;
  }

  /*
   * Stores V0 to VX (including VX) in memory starting at address I.
   * pseudo: reg_dump(Vx,&I)
   * operator type: Memory
   * opcode: FX55
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function regDump(opcode, self) {
    var vx = (opcode & 0x0F00) >> 8;
    for (var i = 0; i <= vx; i++) {
      self.memory[self.index_register + i] = self.registers[i];
    }

    self.program_counter += 2;
  }

  /*
   * Fills V0 to VX (including VX) with values from memory starting at address I.
   * pseudo: reg_load(Vx,&I)
   * operator type: Memory
   * opcode: FX65
   * @param {UInt8} opcode - 8 bit opcode value
   */
  function regLoad(opcode, self) {
    var vx = (opcode & 0x0F00) >> 8;
    for (var i = 0; i <= vx; i++) {
      self.registers[i] = self.memory[self.index_register + i];
    }

    self.program_counter += 2;
  }

  return {
    getOps: getOps
  };
});

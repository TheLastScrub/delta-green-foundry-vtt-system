/* eslint-disable max-classes-per-file */
/* globals game Roll ChatMessage AudioHelper renderTemplate Dialog */

import DGUtils from "../other/utility-functions.js";

export class DGRoll extends Roll {
  /**
   * NOTE: This class will rarely be called on its own. It should generally be extended. Look to DGPercentileRoll as an example.
   *
   * Customize our roll with some useful information, passed in the `options` Object.
   *
   * @param {string}          formula            Unused - The string formula to parse (from Foundry)
   * @param {Object}          data               Unused - The data object against which to parse attributes within the formula
   * @param {Object}          [options]          Additional data which is preserved in the database
   * @param {Number}          [options.rollType] The type of roll (stat, skill, sanity, damage, etc).
   * @param {String}          [options.key]      The key of the skill, stat, etc. to use as a basis for this roll.
   * @param {DeltaGreenActor} [options.actor]    The actor that this roll originates from.
   * @param {DeltaGreenItem}  [options.item]     Optional - The item from which the roll originates.
   */
  constructor(formula, data = {}, options = {}) {
    super(formula, data, options);
    const { rollType, key, actor, item } = options;
    this.type = rollType;
    this.key = key;
    this.actor = actor;
    this.item = item;
    this.modifier = 0;
  }

  /**
   * Simple function that actually creates the message and sends it to chat.
   *
   * Broke this out so multiple functions can use it.
   *
   * @returns {Promise<ChatMessage>} - the created chat message.
   */
  async createMessage(content, flavor, rollMode) {
    const chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content,
      flavor,
      type: 5, // CHAT_MESSAGE_TYPES.ROLL,
      roll: this,
      rollMode,
    };

    // play the dice rolling sound, like a regular in-chat roll
    AudioHelper.play(
      { src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false },
      true,
    );
    return ChatMessage.create(chatData);
  }
}

export class DGPercentileRoll extends DGRoll {
  /**
   * Creates D100 rolls, the base die of the system.
   *
   * This constructor embeds the following info into the roll:
   *   1. Target number that the roll needs to beat.
   *   2. Localized name for the roll.
   *
   * Note: In order for all of our custom data to persist, our constructor must use the same parameters as its parent class.
   * So, even though percentile rolls will always have a formula of "1d100" and we don't use the `data` object,
   * we still have to keep them as parameters.
   *
   * @param {string}          formula            Unused - The string formula to parse (from Foundry) - Always "1d100" for percentile rolls.
   * @param {Object}          data               Unused - The data object against which to parse attributes within the formula
   * @param {Object}          [options]          Additional data which is preserved in the database
   * @param {Number}          [options.rollType] The type of roll (stat, skill, sanity, etc).
   * @param {String}          [options.key]      The key of the skill, stat, etc. to use as a basis for this roll.
   * @param {DeltaGreenActor} [options.actor]    The actor that this roll originates from.
   * @param {DeltaGreenItem}  [options.item]     Optional - The item from which the roll originates.
   */
  constructor(formula = "1D100", data = {}, options) {
    super("1D100", {}, options);

    const skillKeys = Object.keys(this.actor.system.skills);
    const typedSkillKeys = Object.keys(this.actor.system.typedSkills);
    const statKeys = Object.keys(this.actor.system.statistics);

    switch (this.type) {
      case "stat":
        this.target = this.actor.system.statistics[this.key].x5;
        this.localizedKey = game.i18n.localize(`DG.Attributes.${this.key}`);
        break;
      case "skill":
        // Set up a target number and localized roll based on whether the skill is regular or typed.
        if (skillKeys.includes(this.key)) {
          this.target = this.actor.system.skills[this.key].proficiency;
          this.localizedKey = game.i18n.localize(`DG.Skills.${this.key}`);
        }
        if (typedSkillKeys.includes(this.key)) {
          const skill = this.actor.system.typedSkills[this.key];
          this.target = skill.proficiency;
          this.localizedKey = `${skill.group} (${skill.label})`;
        }
        break;
      case "sanity":
        this.target = this.actor.system.sanity.value;
        this.localizedKey = game.i18n.localize("DG.Attributes.SAN");
        break;
      case "weapon":
        // Set up target number and localized key depending on whether the weapon uses a custom number,
        // a skill, or a stat for its roll.
        if (this.key === "custom") {
          this.target = this.item.system.customSkillTarget;
          this.localizedKey = game.i18n.localize("DG.ItemWindow.Custom");
        } else if (skillKeys.includes(this.key)) {
          this.target = this.actor.system.skills[this.key].proficiency;
          this.localizedKey = game.i18n.localize(`DG.Skills.${this.key}`);
        } else if (statKeys.includes(this.key)) {
          this.target = this.actor.system.statistics[this.key].x5;
          this.localizedKey = game.i18n.localize(`DG.Attributes.${this.key}`);
        }
        // Add a the weapon's internal modifier.
        this.modifier += this.item.system.skillModifier;
        break;
      case "luck":
        this.target = 50;
        this.localizedKey = game.i18n.localize("DG.Luck");
        break;
      default:
        break;
    }
  }

  /**
   * Shows a dialog that can modify the roll.
   *
   * @returns {Promise<Object|void>} - the results of the dialog.
   */
  async showDialog() {
    const privateSanSetting = game.settings.get(
      "deltagreen",
      "keepSanityPrivate",
    );

    let hideSanTarget = false;
    if (
      privateSanSetting &&
      (this.type === "sanity" || this.key === "ritual") &&
      !game.user.isGM
    ) {
      hideSanTarget = true;
    }

    const backingData = {
      data: {
        label: this.localizedKey,
        originalTarget: this.target,
        targetModifier: 20,
        hideTarget: hideSanTarget,
      },
    };

    const template =
      "systems/deltagreen/templates/dialog/modify-percentile-roll.html";
    const content = await renderTemplate(template, backingData);
    return new Promise((resolve, reject) => {
      new Dialog({
        content,
        title: DGUtils.localizeWithFallback(
          "DG.ModifySkillRollDialogue.Title",
          "Modify Roll",
        ),
        default: "roll",
        buttons: {
          roll: {
            label: DGUtils.localizeWithFallback("DG.Roll.Roll", "Roll"),
            callback: (html) => {
              try {
                let targetModifier = html.find("[name='targetModifier']").val(); // this is text as a heads up

                const rollMode = html.find("[name='rollMode']").val();

                const plusMinus = html.find("[name='plusOrMinus']").val();

                if (
                  targetModifier.trim() !== "" &&
                  !Number.isNaN(targetModifier)
                ) {
                  targetModifier = Math.abs(parseInt(targetModifier));

                  if (plusMinus === "-") {
                    targetModifier *= -1;
                  }
                }
                resolve({ targetModifier, rollMode });
              } catch (ex) {
                reject(console.log(ex));
              }
            },
          },
        },
      }).render(true);
    });
  }

  /**
   * Prepares data for a chat message and then passes that data
   * to a method that actually creates a ChatMessage.
   *
   * Lays out and styles message based on outcome of the roll.
   *
   * @returns {Promise<ChatMessage>} - the created chat message.
   */
  async toChat() {
    let rollMode =
      this.options.rollMode || game.settings.get("core", "rollMode");

    // if using private san rolls, must hide any SAN roll unless user is a GM
    const privateSanSetting = game.settings.get(
      "deltagreen",
      "keepSanityPrivate",
    );
    if (
      privateSanSetting &&
      (this.type === "sanity" || this.key === "ritual") &&
      !game.user.isGM
    ) {
      rollMode = "blindroll";
    }

    let label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${
      this.localizedKey
    }</b> ${game.i18n.localize("DG.Roll.Target")} ${
      this.target + this.modifier
    }`;
    // "Inhuman" stat being rolled. See function for details.
    if (this.isInhuman) {
      label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${
        this.localizedKey
      } [${game.i18n
        .localize("DG.Roll.Inhuman")
        .toUpperCase()}]</b> ${game.i18n.localize("DG.Roll.Target")} ${
        this.target + this.modifier
      }`;
    }
    if (this.modifier) {
      label += ` (${DGUtils.formatStringWithLeadingPlus(this.modifier)}%)`;
    }

    let resultString = "";
    let styleOverride = "";
    if (this.isCritical) {
      resultString = `${game.i18n.localize("DG.Roll.Critical")} `;
    }

    if (this.isSuccess) {
      resultString += `${game.i18n.localize("DG.Roll.Success")}`;

      if (this.isCritical) {
        resultString = `${resultString.toUpperCase()}!`;
        styleOverride = "color: green";
      }
    } else {
      resultString += `${game.i18n.localize("DG.Roll.Failure")}`;

      if (this.isCritical) {
        resultString = `${resultString.toUpperCase()}!`;
        styleOverride = "color: red";
      }
    }

    let html = "";
    html += `<div class="dice-roll">`;
    html += `     <div class="dice-result">`;
    html += `     <div style="${styleOverride}" class="dice-formula">${resultString}</div>`;
    html += `     <div class="dice-tooltip">`;
    html += `          <section class="tooltip-part">`;
    html += `               <div class="dice">`;
    html += `                    <header class="part-header flexrow">`;
    html += `                         <span class="part-formula">`;
    html += `                              ${this.formula}`;
    html += `                         </span>`;
    html += `                         <span class="part-total">`;
    html += `                              ${this.total}`;
    html += `                         </span>`;
    html += `                    </header>`;
    html += `                    <ol class="dice-rolls">`;
    html += `                         <li class="roll die ${this.formula}">${this.total}</li>`;
    html += `                    </ol>`;
    html += `               </div>`;
    html += `          </section>`;
    html += `     </div>`;
    html += `     <h4 class="dice-total">${this.total}</h4>`;
    html += `</div>`;

    return this.createMessage(html, label, rollMode);
  }

  /**
   * "Inhuman" stat being rolled, logic is different per page 188 of the Handler's Guide.
   * Note - originally implemented by Uriele, but my attempt at merging conficts went poorly, so re-implementing.
   * For an inhuman check, the roll succeeds except on a roll of 100 which fails AND fumbles.
   * If the roll is a matching digit roll, it is a critical as normal.
   * Also, if the roll is below the regular (non-x5) value of the stat, it is a critical.  E.g. a CON of 25, a d100 roll of 21 would be a critical.
   *
   * @returns {Boolean}
   */
  get isInhuman() {
    if (this.target + this.modifier > 99 && this.type === "stat") {
      return true;
    }
    return false;
  }

  /**
   * Determines if a roll result is critical.
   * If roll has not been evaluated, return null.
   *
   * @returns {null|Boolean}
   */
  get isCritical() {
    // If roll isn't evaluated, return null.
    if (!this.total) {
      return null;
    }
    let isCritical = false;

    // 1, 100, or any matching dice are a crit, i.e. 11, 22, 33...99.
    if (this.total === 1 || this.total === 100 || this.total % 11 === 0) {
      // really good, or reeaaaally bad
      isCritical = true;
    }

    // If inhuman and the roll is below the regular (non-x5) value of the stat, it is a critical.
    // E.g. a CON of 25, a d100 roll of 21 would be a critical.
    if (this.isInhuman && this.total <= (this.target + this.modifier) / 5) {
      isCritical = true;
    }

    return isCritical;
  }

  /**
   * Determines if a roll succeeded.
   * If roll has not been evaluated, return null.
   *
   * @returns {null|Boolean}
   */
  get isSuccess() {
    // If roll isn't evaluated, return null.
    if (!this.total) {
      return null;
    }

    // A roll of 100 always (critically) fails, even for inhuman rolls.
    if (this.total === 100) return false;
    return this.total <= this.target + this.modifier;
  }
}

export class DGLethalityRoll extends DGPercentileRoll {
  /**
   * See constructor for DGPercentileRoll. This theoretically could be done in the parent class'
   * constructor, but since Lethality rolls needs its own class for custom methods anyway,
   * we will set the target and localized key here.
   *
   * @param {String} formula
   * @param {Object} data
   * @param {Object} options
   */
  constructor(formula, data, options) {
    super(formula, data, options);
    this.target = options.item.system.lethality;
    this.localizedKey = game.i18n.localize("DG.ItemWindow.Weapons.Lethality");
  }

  /**
   * Prepares data for a chat message and then passes that data
   * to a method that actually creates a ChatMessage.
   *
   * Lays out and styles message based on outcome of the roll.
   *
   * Overrides `DGPercentileRoll.toChat()`
   *
   * @returns {Promise<ChatMessage>} - the created chat message.
   * @override
   */
  async toChat() {
    const rollMode =
      this.options.rollMode || game.settings.get("core", "rollMode");
    let resultString = "";
    let styleOverride = "";
    if (this.total <= this.target) {
      resultString = `${game.i18n.localize("DG.Roll.Lethal").toUpperCase()}`;
      styleOverride = "color: red";
    } else {
      resultString = `${game.i18n.localize("DG.Roll.Failure")}`;
    }

    const { nonLethalDamage } = this;
    let label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${game.i18n
      .localize("DG.Roll.Lethality")
      .toUpperCase()}</b> ${game.i18n.localize(
      "DG.Roll.For",
    )} <b>${this.item.name.toUpperCase()}</b> ${game.i18n.localize(
      "DG.Roll.Target",
    )} ${this.target + this.modifier}`;
    if (this.modifier) {
      label += ` (${DGUtils.formatStringWithLeadingPlus(this.modifier)}%)`;
    }

    let html = "";
    html += `<div class="dice-roll">`;
    html += `     <div class="dice-result">`;
    html += `     <div style="${styleOverride}" class="dice-formula">${resultString}</div>`;
    html += `     <div class="dice-tooltip">`;
    html += `          <section class="tooltip-part">`;
    html += `               <div class="dice">`;
    html += `                    <header class="part-header flexrow">`;
    html += `                         <span class="part-formula">`;
    html += `                              d100`;
    html += `                         </span>`;
    html += `                         <span class="part-total">`;
    html += `                              ${this.total}`;
    html += `                         </span>`;
    html += `                    </header>`;
    html += `                    <ol class="dice-rolls">`;
    html += `                         <li class="roll die d100">${this.total}`;
    html += `                    </ol>`;
    html += `                    <hr>`;
    html += `                    <header class="part-header flexrow">`;
    html += `                         <span class="part-formula">`;
    html += `                              2d10 (d10 + d10)`;
    html += `                         </span>`;
    html += `                         <span class="part-total">`;
    html += `                              ${nonLethalDamage.total}`;
    html += `                         </span>`;
    html += `                    </header>`;
    html += `                    <ol class="dice-rolls">`;
    html += `                         <li class="roll die d10">${nonLethalDamage.die1}</li>`;
    html += `                         <li class="roll die d10">${nonLethalDamage.die2}</li>`;
    html += `                    </ol>`;
    html += `               </div>`;
    html += `          </section>`;
    html += `     </div>`;
    html += `     <h4 class="dice-total">${this.total} (${
      nonLethalDamage.total
    } ${game.i18n.localize("DG.Roll.Damage")})</h4>`;
    html += `</div>`;

    return this.createMessage(html, label, rollMode);
  }

  /**
   * Calculates the damage for when a lethality roll fails.
   * If roll has not been evaluated, return null.
   *
   * See full rules on page 57 of agent's handbook.
   *
   * Note, this getter does not actually care if the roll has failed.
   *
   * @returns {null|Object} - return data about the non-lethal damage.
   */
  get nonLethalDamage() {
    if (!this.total) {
      return null;
    }

    // Try to determine what the d100 result would be as if it was two d10's being rolled.
    const totalString = this.total.toString();
    const digits = totalString.length;
    let die1;
    let die2;
    switch (digits) {
      case 1:
        // If one digit in the result, one die is a 10, and the other is the result.
        [die1, die2] = [10, this.total];
        break;
      case 2:
        // If two digits in the result, each die is the value of one of the digits. If one of those digits is 0, make it 10.
        [die1, die2] = totalString
          .split("")
          .map((digit) => parseInt(digit))
          .map((digit) => digit || 10);
        break;
      case 3:
        // If three digits in the result (aka result === 100), each die is a 10.
        [die1, die2] = [10, 10];
        break;
      default:
        break;
    }

    const total = die1 + die2;
    return { die1, die2, total };
  }
}

export class DGDamageRoll extends DGRoll {
  /**
   * Prepares data for a chat message and then passes that data
   * to a method that actually creates a ChatMessage.
   *
   * @returns {Promise<ChatMessage>} - the created chat message.
   * @override
   */
  async toChat() {
    const rollMode =
      this.options.rollMode || game.settings.get("core", "rollMode");
    let label = this.formula;
    try {
      label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${game.i18n
        .localize("DG.Roll.Damage")
        .toUpperCase()}</b> ${game.i18n.localize("DG.Roll.For")} ${
        this.item.name
      }`;
    } catch (ex) {
      // console.log(ex);
      label = `Rolling <b>DAMAGE</b> for <b>${label.toUpperCase()}</b>`;
    }
    return this.createMessage(this.total, label, rollMode);
  }

  async showDialog() {
    const template =
      "systems/deltagreen/templates/dialog/modify-damage-roll.html";
    const backingData = {
      data: {
        label: this.item?.name,
        originalFormula: this.formula,
        outerModifier: "2 * ",
        innerModifier: "+ 0",
      },
    };

    const content = await renderTemplate(template, backingData);
    return new Promise((resolve, reject) => {
      new Dialog({
        content,
        title: game.i18n.localize("DG.ModifySkillRollDialogue.Title"),
        default: "roll",
        buttons: {
          roll: {
            label: game.i18n.translations.DG.Roll.Roll,

            callback: (html) => {
              try {
                const outerModifier = html.find("[name='outerModifier']").val(); // this is text as a heads up
                let innerModifier = html.find("[name='innerModifier']").val(); // this is text as a heads up
                const modifiedBaseRoll = html
                  .find("[name='originalFormula']")
                  .val(); // this is text as a heads up
                const rollMode = html.find("[name='targetRollMode']").val();

                if (innerModifier.replace(" ", "") === "+0") {
                  innerModifier = "";
                }

                let newFormula = "";
                if (outerModifier.trim() !== "") {
                  newFormula += `${outerModifier}(${modifiedBaseRoll}${innerModifier.trim()})`;
                } else {
                  newFormula += modifiedBaseRoll + innerModifier.trim();
                }

                resolve({ newFormula, rollMode });
              } catch (ex) {
                reject(console.log(ex));
              }
            },
          },
        },
      }).render(true);
    });
  }
}

export class DGSanityDamageRoll extends DGRoll {
  /**
   * Prepares data for a chat message and then passes that data
   * to a method that actually creates a ChatMessage.
   *
   * @returns {Promise<ChatMessage>} - the created chat message.
   * @override
   */
  async toChat() {
    const rollMode =
      this.options.rollMode || game.settings.get("core", "rollMode");

    const [lowDie, highDie] = this.terms[0].terms.map((formula) => {
      return Roll.parse(formula)[0] || { faces: parseInt(formula), number: 1 };
    });

    const [lowResult, highResult] = this.damageResults;

    const flavor = `Rolling <b>${DGUtils.localizeWithFallback(
      "DG.Generic.SanDamage",
      "SAN DAMAGE",
    )}</b> For <b>${lowDie.formula} / ${highDie.formula}</b>`;

    let html = "";
    html += `<div class="dice-roll">`;
    html += `     <div class="dice-result">`;
    html += `     <div class="dice-formula">${lowDie.formula} / ${highDie.formula}</div>`;
    html += `     <div class="dice-tooltip">`;
    html += `          <section class="tooltip-part">`;
    html += `               <div class="dice">`;
    html += `                    <header class="part-header flexrow">`;
    html += `                         <span class="part-formula">`;
    html += `                              ${lowDie.formula}`;
    html += `                         </span>`;
    html += `                         <span class="part-total">`;
    html += `                              ${lowResult}`;
    html += `                         </span>`;
    html += `                    </header>`;
    html += `                    <ol class="dice-rolls">`;
    html += `                         <li class="roll die d${lowDie.faces}">${lowResult}`;
    html += `                    </ol>`;
    html += `                    <hr>`;
    html += `                    <header class="part-header flexrow">`;
    html += `                         <span class="part-formula">`;
    html += `                               ${highDie.formula}`;
    html += `                         </span>`;
    html += `                         <span class="part-total">`;
    html += `                               ${highResult}`;
    html += `                         </span>`;
    html += `                    </header>`;
    html += `                    <ol class="dice-rolls">`;
    html += `                         <li class="roll die d${highDie.faces}">${highResult}</li>`;
    html += `                    </ol>`;
    html += `               </div>`;
    html += `          </section>`;
    html += `     </div>`;
    html += `     <h4 class="dice-total">${lowResult} / ${highResult}</h4>`;
    html += `</div>`;
    return this.createMessage(html, flavor, rollMode);
  }

  /**
   * Returns the two results for a sanity damage roll.
   *
   * Returns null if the roll has not been evaluated.
   *
   * @returns {null|Array<Number>} - Array of result numbers
   */
  get damageResults() {
    if (!this.total) return null;

    const [lowResult, highResult] = this.terms[0].results;
    return [lowResult?.result, highResult?.result];
  }
}

/* globals game Roll ChatMessage AudioHelper renderTemplate Dialog */

import { localizeWithFallback } from "../other/utility-functions.js"

export class DGPercentileRoll extends Roll {
  /**
   * In order for all of our custom data to persist, our constructor must use the same parameters as its parent class.
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
    const { rollType, key, actor, item } = options;
    this.type = rollType;
    this.key = key;
    this.actor = actor;
    this.item = item;
    this.modifier = 0;

    const skillKeys = Object.keys(actor.system.skills);
    const typedSkillKeys = Object.keys(actor.system.typedSkills);
    const statKeys = Object.keys(actor.system.statistics);

    switch (rollType) {
      case "stat":
        this.target = actor.system.statistics[key].x5;
        this.localizedKey = game.i18n.localize(`DG.Attributes.${key}`);
        break;
      case "skill": 
        if (skillKeys.includes(key)) {
          this.target = actor.system.skills[key].proficiency;
          this.localizedKey = game.i18n.localize(`DG.Skills.${key}`);
        }
        if (typedSkillKeys.includes(key)) {
          this.target = actor.system.typedSkills[key].proficiency;
          this.localizedKey = game.i18n.localize(`DG.Skills.${key}`);
        }
        break;
      case "sanity":
        this.target = actor.system.sanity.value;
        this.localizedKey = game.i18n.localize("DG.Attributes.SAN");
        break;
      case "weapon":
        if (key === "custom") {
          this.target = item.system.customSkillTarget;
          this.localizedKey = game.i18n.localize("DG.ItemWindow.Custom");
        } else if (skillKeys.includes(key)) {
          this.target = actor.system.skills[key].proficiency;
          this.localizedKey = game.i18n.localize(`DG.Skills.${key}`);
        } else if (statKeys.includes(key)) {
          this.target = actor.system.statistics[key].x5;
          this.localizedKey = game.i18n.localize(`DG.Attributes.${key}`);
        }
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
    let isSanCheck = false;
    const hideSanTarget = !game.user.isGM && game.settings.get("deltagreen", "keepSanityPrivate");
  
    if (this.key === 'sanity' || this.key === 'ritual') {
      isSanCheck = true;
    }
  
    let backingData = {
      data:{
        label: this.key,
        originalTarget: this.target,
        targetModifier: 20,
        isSanCheck: isSanCheck,
        hideTarget: hideSanTarget
      },
    };
    
    let template = "systems/deltagreen/templates/dialog/modify-percentile-roll.html";
    let html = await renderTemplate(template, backingData);
    return new Promise((resolve, reject) => {
      new Dialog({
        content: html,
        title: localizeWithFallback("DG.ModifySkillRollDialogue.Title", "Modify Roll"),
        default: "roll",
        buttons: {
          roll:{
            label: localizeWithFallback("DG.Roll.Roll", "Roll"),
            callback: html => { 
              try {
                let targetModifier = html.find("[name='targetModifier']").val();  // this is text as a heads up
    
                let rollMode = html.find("[name='targetRollMode']").val();
    
                let plusMinus = html.find("[name='plusOrMinus']").val();
                            
                if (targetModifier.trim() != "" && !isNaN(targetModifier)){
                  targetModifier = Math.abs(parseInt(targetModifier));
                  
                  if(plusMinus === "-"){
                    targetModifier = -1 * targetModifier;
                  }
                }
                resolve({targetModifier, rollMode})
              } catch(ex) {
                reject(console.log(ex));
              }
            }
          }
        }
      }).render(true);
    });
  }

  /**
   * Evaluates and sends a roll to chat.
   * Lays out and styles message based on outcome of the roll.
   * 
   * @returns {Promise<ChatMessage>} - the created chat message.
   */
  async toChat() {
    let rollMode = this.options.rollMode || game.settings.get("core", "rollMode"); 
  
    // if using private san rolls, must hide any SAN roll unless user is a GM
    const privateSanSetting = game.settings.get("deltagreen", "keepSanityPrivate");
    if (privateSanSetting && (this.key === 'sanity' || this.key === 'ritual') && !game.user.isGM){
      rollMode = 'blindroll';
    }
  
    let label = '';
    // "Inhuman" stat being rolled. See function for details.
    if (this.isInhuman) {
      label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${this.localizedKey} [${game.i18n.localize("DG.Roll.Inhuman").toUpperCase()}]</b> ${game.i18n.localize("DG.Roll.Target")} ${Math.floor(this.target + this.modifier / 5)}`;
    } else {
      label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${this.localizedKey}</b> ${game.i18n.localize("DG.Roll.Target")} ${this.target + this.modifier}`;
    }
  
    let resultString = '', styleOverride = '';
    if (this.isCritical) {
      resultString = `${game.i18n.localize("DG.Roll.Critical")} `;
    }
  
    if (this.isSuccess) {
      resultString += `${game.i18n.localize("DG.Roll.Success")}`;
  
      if (this.isCritical){ 
        resultString = resultString.toUpperCase() + '!';
        styleOverride="color: green";
      }
    } else { 
      resultString += `${game.i18n.localize("DG.Roll.Failure")}`;
  
      if(this.isCritical){
        resultString = resultString.toUpperCase() + '!';
        styleOverride="color: red";
      }
    }
  
    let html = '';
    html += `<div class="dice-roll">`
    html += `     <div class="dice-result">`
    html += `     <div style="${styleOverride}" class="dice-formula">${resultString}</div>`
    html += `     <div class="dice-tooltip">`
    html += `          <section class="tooltip-part">`
    html += `               <div class="dice">`
    html += `                    <p class="part-formula">`
    html += `                         ${this.formula}`
    html += `                         <span class="part-total">${this.total}</span>`
    html += `                    </p>`
    html += `                    <ol class="dice-rolls">`
    html += `                         <li class="roll die ${this.formula}">${this.total}</li>`
    html += `                    </ol>`
    html += `               </div>`
    html += `          </section>`
    html += `     </div>`
    html += `     <h4 class="dice-total">${this.total}</h4>`
    html += `</div>`
  
    let chatData = {
      speaker: ChatMessage.getSpeaker({actor: this.actor}),
      content: html,
      flavor: label,
      type: 5, //CHAT_MESSAGE_TYPES.ROLL,
      roll: this,
      rollMode: rollMode
      };
  
    // play the dice rolling sound, like a regular in-chat roll
    AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);
    
    return ChatMessage.create(chatData);
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
    if (this.target > 99 && this.type === "stat") {
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
    let isCritical = false

    // 1, 100, or any matching dice are a crit, i.e. 11, 22, 33...99.
    if (this.total === 1 || this.total === 100 || this.total % 11 === 0) {
      // really good, or reeaaaally bad
      isCritical = true;
    }

    // If inhuman and the roll is below the regular (non-x5) value of the stat, it is a critical. 
    // E.g. a CON of 25, a d100 roll of 21 would be a critical.
    if (this.isInhuman && this.total <= ((this.target + this.modifier) / 5)) {
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
    return this.total <= (this.target + this.modifier);
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
   * Evaluates and sends a roll to chat.
   * Lays out and styles message based on outcome of the roll.
   * 
   * Overrides `DGPercentileRoll.toChat()`
   * 
   * @returns {Promise<ChatMessage>} - the created chat message.
   * @override
   */
  async toChat() {    
    const rollMode = this.options.rollMode || game.settings.get("core", "rollMode");
    let resultString = '';
    let styleOverride = '';
    if(this.total <= this.target){
      resultString = `${game.i18n.localize("DG.Roll.Lethal").toUpperCase()}`;
      styleOverride="color: red";
    }
    else{
      resultString = `${game.i18n.localize("DG.Roll.Failure")}`;
    }

    const { nonLethalDamage } = this;
    let label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${game.i18n.localize("DG.Roll.Lethality").toUpperCase()}</b> ${game.i18n.localize("DG.Roll.For")} <b>${this.item.name.toUpperCase()}</b> ${game.i18n.localize("DG.Roll.Target")} ${this.target}`;
    let html = '';
    html += `<div class="dice-roll">`;
    html += `     <div class="dice-result">`;
    html += `     <div style="${styleOverride}" class="dice-formula">${resultString}</div>`;
    html += `     <div class="dice-tooltip">`;
    html += `          <section class="tooltip-part">`;
    html += `               <div class="dice">`;
    html += `                    <p class="part-formula">`;
    html += `                         d100`;
    html += `                    </p>`;
    html += `                    <ol class="dice-rolls">`;
    html += `                         <li class="roll die d100">${this.total}`;
    html += `                    </ol>`;
    html += `                    <hr>`;
    html += `                    <p class="part-formula">`;
    html += `                         2d10 (d10 + d10)`;
    html += `                    </p>`;
    html += `                    <ol class="dice-rolls">`;
    html += `                         <li class="roll die d10">${nonLethalDamage.die1}</li>`;
    html += `                         <li class="roll die d10">${nonLethalDamage.die2}</li>`;
    html += `                    </ol>`;
    html += `               </div>`;
    html += `          </section>`;
    html += `     </div>`;
    html += `     <h4 class="dice-total">${this.total} (${nonLethalDamage.total} ${game.i18n.localize("DG.Roll.Damage")})</h4>`;
    html += `</div>`;

    let chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: html,
      flavor: label,
      type: 5, //CHAT_MESSAGE_TYPES.ROLL,
      roll: this,
      rollMode: rollMode
      };

    // play the dice rolling sound, like a regular in-chat roll
    AudioHelper.play({ src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false }, true);
    return ChatMessage.create(chatData, {});
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
    let die1, die2;
    switch (digits) {
      case 1:
        // If one digit in the result, one die is a 10, and the other is the result.
        [die1, die2] = [10, this.total];
        break;
      case 2:
        // If two digits in the result, each die is the value of one of the digits. If one of those digits is 0, make it 10.
        [die1, die2] = totalString.split("").map((digit) => parseInt(digit)).map((digit) => digit || 10);
        break;
      case 3:
        // If three digits in the result (aka result === 100), each die is a 10.
        [die1, die2] = [10, 10];
        break;
      default:
        break;
    }

    const total = die1 + die2;
    return { die1, die2, total }
  }
}

export async function sendDamageRollToChat(actor, label, diceFormula, rollMode){
  
  if(rollMode == null || rollMode === ""){
    rollMode = game.settings.get("core", "rollMode");
  }

  //diceFormula += actor.data.data.statistics.str.meleeDamageBonusFormula;

  let roll = new Roll(diceFormula, actor.system);

  await roll.evaluate({async: true});
  
  try{
    label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${game.i18n.localize("DG.Roll.Damage").toUpperCase()}</b> ${game.i18n.localize("DG.Roll.For")} <b>${label.toUpperCase()}</b>`;
  }
  catch{
    label = `Rolling <b>DAMAGE</b> for <b>${label.toUpperCase()}</b>`;
  }

  let chatData = {
    speaker: ChatMessage.getSpeaker({actor: actor}),
    content: roll.total,
    flavor: label,
    type: 5, //CHAT_MESSAGE_TYPES.ROLL,
    roll: roll,
    rollMode: rollMode
    };

  // play the dice rolling sound, like a regular in-chat roll
  AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

  ChatMessage.create(chatData, {});

}

export async function sendSanityDamageToChat(actor, label, lowFormula, highFormula, rollMode){

  if(rollMode == null || rollMode === ""){
    rollMode = game.settings.get("core", "rollMode");
  }

  //console.log(`Low: ${lowFormula} High: ${highFormula}`)

  // try to do both rolls as one, so that when sent to chat, Dice So Nice will roll both
  let combinedRoll = new Roll('{'+lowFormula + ',' + highFormula + '}', actor.system);

  await combinedRoll.evaluate({async: true});
  
  let flavor = `<h3>Rolling ${localizeWithFallback('DG.Generic.SanDamage', 'SAN DAMAGE')} (${lowFormula}/${highFormula})</h3>`;
  
  let lowResult = "";
  let highResult = "";
  console.log(combinedRoll);
  
  lowResult = combinedRoll.terms[0].results[0].result;
  highResult = combinedRoll.terms[0].results[1].result;

  let html = `<h4><b>${lowResult} / ${highResult}</b></h4>`;

  let chatData = {
    speaker: ChatMessage.getSpeaker({actor: actor}),
    content: html,
    flavor: flavor,
    type: 5, //CHAT_MESSAGE_TYPES.ROLL,
    roll: combinedRoll,
    rollMode: rollMode
  };

  // play the dice rolling sound, like a regular in-chat roll
  AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

  ChatMessage.create(chatData, {});
}

export async function showModifyDamageRollDialogue(actor, label, originalFormula){
  
  let template = "systems/deltagreen/templates/dialog/modify-damage-roll.html";
  let backingData = {
    data:{
      label: label,
      originalFormula: originalFormula,
      outerModifier: "2 * ",
      innerModifier: "+ 0" 
    },
  };
  
  let html = await renderTemplate(template, backingData);

  new Dialog({
    content: html,
    title: game.i18n.localize("DG.ModifySkillRollDialogue.Title"),
    default: "roll",
    buttons: {
      roll:{
        label: game.i18n.translations.DG.Roll.Roll,

        callback: html => { 
          try{
            let outerModifier = html.find("[name='outerModifier']").val();  // this is text as a heads up
            let innerModifier = html.find("[name='innerModifier']").val();  // this is text as a heads up
            let modifiedBaseRoll = html.find("[name='originalFormula']").val();  // this is text as a heads up
            let rollMode = html.find("[name='targetRollMode']").val();
            
            if(innerModifier.replace(" ", "") === "+0"){
              innerModifier = "";
            }

            let newRoll = "";
            if(outerModifier.trim() != ""){
              newRoll += outerModifier + "(" + modifiedBaseRoll + innerModifier.trim() + ")";
            }
            else{
              newRoll += modifiedBaseRoll + innerModifier.trim();
            }
            
            sendDamageRollToChat(actor, label, newRoll, rollMode);
          }
          catch(ex){
            console.log(ex);
          }
        }
      }
    }
  }).render(true);
}

export function skillIsStatTest(skillName){
  try{
    if(skillName.toUpperCase() === game.i18n.localize("DG.Attributes.str").toUpperCase()){
      return true;
    }
    if(skillName.toUpperCase() === game.i18n.localize("DG.Attributes.con").toUpperCase()){
      return true;
    }
    if(skillName.toUpperCase() === game.i18n.localize("DG.Attributes.dex").toUpperCase()){
      return true;
    }
    if(skillName.toUpperCase() === game.i18n.localize("DG.Attributes.int").toUpperCase()){
      return true;
    }
    if(skillName.toUpperCase() === game.i18n.localize("DG.Attributes.pow").toUpperCase()){
      return true;
    }
    if(skillName.toUpperCase() === game.i18n.localize("DG.Attributes.cha").toUpperCase()){
      return true;
    }
    else{
      return false;
    }
  }
  catch(ex){
    return false;
  }
}
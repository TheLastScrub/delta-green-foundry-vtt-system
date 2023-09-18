/* globals game Roll ChatMessage AudioHelper renderTemplate Dialog */

import {localizeWithFallback} from "../other/utility-functions.js"

export class DGPercentileRoll extends Roll {
  constructor(rollType, key, actor, item, options) {
    super("1D100", {}, options);
    this.type = rollType;
    this.key = key;
    this.actor = actor;
    this.item = item;
    switch (rollType) {
      case "stat":
        this.rollBasis = actor.system.statistics[key]
        this.target = this.rollBasis.x5;
        this.localizedKey = key.toUpperCase();
        break;
      case "skill": 
        this.rollBasis = actor.system.skills[key];
        this.target = this.rollBasis.proficiency;
        this.localizedKey = game.i18n.localize(`DG.Skills.${key}`);
        break;
      default:
        break;
    }
  }

  /**
   * "Inhuman" stat being rolled, logic is different per page 188 of the Handler's Guide.
   * Note - originally implemented by Uriele, but my attempt at merging conficts went poorly, so re-implementing.
   * For an inhuman check, the roll succeeds except on a roll of 100 which fails AND fumbles.
   * If the roll is a matching digit roll, it is a critical as normal.
   * Also, if the roll is below the regular (non-x5) value of the stat, it is a critical.  E.g. a CON of 25, a d100 roll of 21 would be a critical.
   * 
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
    if (this.isInhuman && this.total <= (this.target / 5)) {
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
    return this.total <= this.target;
  }
}

export async function sendPercentileTestToChat(roll){
  await roll.evaluate({async: true});
  let rollMode = game.settings.get("core", "rollMode"); 

  // if using private san rolls, must hide any SAN roll unless user is a GM
  const privateSanSetting = game.settings.get("deltagreen", "keepSanityPrivate");
  if (privateSanSetting && (roll.key === 'sanity' || roll.key === 'ritual') && !game.user.isGM){
    rollMode = 'blindroll';
  }

  let label = '';
  // "Inhuman" stat being rolled. See function for details.
  if (roll.isInhuman) {
    label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${roll.localizedKey} [${game.i18n.localize("DG.Roll.Inhuman").toUpperCase()}]</b> ${game.i18n.localize("DG.Roll.Target")} ${Math.floor(roll.target / 5)}`;
  } else {
    label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${roll.localizedKey}</b> ${game.i18n.localize("DG.Roll.Target")} ${roll.target}`;
  }

  let resultString = '', styleOverride = '';
  if (roll.isCritical) {
    resultString = `${game.i18n.localize("DG.Roll.Critical")} `;
  }

  if (roll.isSuccess) {
    resultString += `${game.i18n.localize("DG.Roll.Success")}`;

    if (roll.isCritical){ 
      resultString = resultString.toUpperCase() + '!';
      styleOverride="color: green";
    }
  } else { 
    resultString += `${game.i18n.localize("DG.Roll.Failure")}`;

    if(roll.isCritical){
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
  html += `                         ${roll.formula}`
  html += `                         <span class="part-total">${roll.total}</span>`
  html += `                    </p>`
  html += `                    <ol class="dice-rolls">`
  html += `                         <li class="roll die ${roll.formula}">${roll.total}</li>`
  html += `                    </ol>`
  html += `               </div>`
  html += `          </section>`
  html += `     </div>`
  html += `     <h4 class="dice-total">${roll.total}</h4>`
  html += `</div>`

  let chatData = {
    speaker: ChatMessage.getSpeaker({actor: roll.actor}),
    content: html,
    flavor: label,
    type: 5, //CHAT_MESSAGE_TYPES.ROLL,
    roll: roll,
    rollMode: rollMode
    };

  // play the dice rolling sound, like a regular in-chat roll
  AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);
  
  ChatMessage.create(chatData);
}

export function skillCheckResultIsCritical(rollResult){
  let isCritical = false;

  if(rollResult === 1 || rollResult === 100){
    // really good, or reeaaaally bad
    isCritical = true;
  }
  else if(rollResult % 11 === 0){
    // any matching dice are a crit, i.e. 11, 22, 33...99.
    isCritical = true;
  }

  return isCritical;
}

export async function sendLethalityTestToChat(actor, weaponName, target, rollMode){
  //let roll = new Roll('1D100', actor.data.data).evaluate(false);

  let roll = new Roll('1D100', actor.system);

  await roll.evaluate({async: true});

  let isCritical = false;
  let skillCheckTotal = roll.total;
  
  if(rollMode == null || rollMode === ""){
    rollMode = game.settings.get("core", "rollMode");
  }

  // page 57 of agent's handbook
  // For a failed lethality check, the damage on the tens die is a 10 for a roll of '0'.  E.g. '30' + '0' = 13 damage.
  // Lethality rolls do not fumble or critically succeed, but the attack roll can.
  // In this situation, the lethality threshold doubles (e.g. 20% would become 40%),
  // and if the lethality roll fails, the damage is doubled per normal.  However right now
  // the attack roll and damage roll are completely separate... Perhaps in the future, use a
  // button in the skill check roll to allow doubling this logic?

  // try to determine what the d100 result would be as if it was two d10's being rolled
  let damageDie1 = Math.floor(skillCheckTotal / 10);
  let damageDie2 = skillCheckTotal - (damageDie1 * 10);
  if(damageDie2 === 0){
    // if the result is evenly divisible by 10 (e.g. 30, 40, 50...) 
    // then the percentile die result was actually one lower than the calculation above would show.
    // For example, a '70' is actually a 60 + 10, so the damage die should be 6 + 10 = 16, not 7 + 0 = 7.
    damageDie1 -= 1;
    damageDie2 = 10;
  }

  let damageDie1Label = damageDie1.toString();
  let damageDie2Label = damageDie2.toString();

  if(damageDie1 === 0){
    // a roll of 00 on the tens part of the d100 counts as a ten if it becomes a damage die
    // Will leave the labeling as a '0' though, to be consistent with a regular d10 roll
    damageDie1 = 10;
  }

  if(damageDie2 === 10){
    // keep the labelling consistent, show a '0' for a ten
    damageDie2Label = '0';
  }

  let nonlethalDamage = damageDie1 + damageDie2;
  
  let isLethal = false;
  let html = '';
  let label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${game.i18n.localize("DG.Roll.Lethality").toUpperCase()}</b> ${game.i18n.localize("DG.Roll.For")} <b>${weaponName.toUpperCase()}</b> ${game.i18n.localize("DG.Roll.Target")} ${target}`;
  let resultString = '';
  let styleOverride = '';

  if(skillCheckTotal <= target){
    isLethal = true;
    resultString = `${game.i18n.localize("DG.Roll.Lethal").toUpperCase()}`;
    styleOverride="color: red";
  }
  else{
    resultString = `${game.i18n.localize("DG.Roll.Failure")}`;
  }

  html = `<div class="dice-roll">`;
  html += `     <div class="dice-result">`;
  html += `     <div style="${styleOverride}" class="dice-formula">${resultString}</div>`;
  html += `     <div class="dice-tooltip">`;
  html += `          <section class="tooltip-part">`;
  html += `               <div class="dice">`;
  html += `                    <p class="part-formula">`;
  html += `                         d100 ${game.i18n.localize("DG.Roll.Or").toUpperCase()} d10 + d10`;
  html += `                         <span class="part-total">${roll.total}</span>`;
  html += `                    </p>`;
  html += `                    <ol class="dice-rolls">`;
  html += `                         <li class="roll die d10">${damageDie1Label}</li>`;
  html += `                         <li class="roll die d10">${damageDie2Label}</li>`;
  html += `                    </ol>`;
  html += `               </div>`;
  html += `          </section>`;
  html += `     </div>`;
  html += `     <h4 class="dice-total">${roll.total} (${nonlethalDamage} ${game.i18n.localize("DG.Roll.Damage")})</h4>`;
  html += `</div>`;

  let chatData = {
    speaker: ChatMessage.getSpeaker({actor: actor}),
    content: html,
    flavor: label,
    type: 5, //CHAT_MESSAGE_TYPES.ROLL,
    roll: roll,
    rollMode: rollMode
    };

  // play the dice rolling sound, like a regular in-chat roll
  AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

  ChatMessage.create(chatData, {});
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

export async function showModifyPercentileTestDialogue(actor, label, originalTarget, isLethalityTest){
  
  let template = "systems/deltagreen/templates/dialog/modify-percentile-roll.html";

  let isSanCheck = false;
  let hideSanTarget = false;

  if(label === 'SAN' || label === 'RITUAL'){

    isSanCheck = true;

    hideSanTarget = game.settings.get("deltagreen", "keepSanityPrivate");

    if(game.user.isGM){
      hideSanTarget = false;
    }
  }

  let backingData = {
    data:{
      label: label,
      originalTarget: originalTarget,
      targetModifier: 20,
      isSanCheck: isSanCheck,
      hideTarget: hideSanTarget
    },
  };
  
  let html = await renderTemplate(template, backingData);

  new Dialog({
    content: html,
    title: localizeWithFallback("DG.ModifySkillRollDialogue.Title", "Modify Roll"),
    default: "roll",
    buttons: {
      roll:{
        label: localizeWithFallback("DG.Roll.Roll", "Roll"),

        callback: html => { 
          try{
            let targetModifier = html.find("[name='targetModifier']").val();  // this is text as a heads up

            let rollMode = html.find("[name='targetRollMode']").val();

            let plusMinus = html.find("[name='plusOrMinus']").val();
                    
            let newTarget = parseInt(originalTarget); // this should be an int, but technically the incoming value is text, so parse it just to be safe

            if(targetModifier.trim() != "" && !isNaN(targetModifier)){
              let numericTargetModifier = Math.abs(parseInt(targetModifier));
              
              if(plusMinus === "-"){
                numericTargetModifier = -1 * numericTargetModifier;
              }

              newTarget += numericTargetModifier;
            }
            
            if(isLethalityTest){
              sendLethalityTestToChat(actor, label, newTarget, rollMode);
            }
            else{
              sendPercentileTestToChat(actor, label, newTarget, rollMode);
            }
          }
          catch(ex){
            console.log(ex);
          }
        }
      }
    }
  }).render(true);
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
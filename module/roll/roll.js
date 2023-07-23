import {localizeWithFallback} from "../other/utility-functions.js"

export async function sendPercentileTestToChat(actor, skill, target, rollMode){
  //let roll = new Roll('1D100', actor.data.data).evaluate(false);
  let roll = new Roll('1D100', actor.system)
  
  await roll.evaluate({async: true});

  let total = roll.total;
  let isCritical = false;
  let isSuccess = false;
  let html = '';
  let label = '';
  let resultString = '';
  let styleOverride = '';

  let skillName = typeof skill === "string" ? skill : game.i18n.localize(skill.label).toUpperCase();

  if(rollMode == null || rollMode === ""){
    rollMode = game.settings.get("core", "rollMode"); 
  }

  // if using private san rolls, must hide any SAN role unless user is a GM
  let setting = false;

  setting = game.settings.get("deltagreen", "keepSanityPrivate");

  if(setting === true && (skillName === 'SAN' || skillName === 'RITUAL') && !game.user.isGM){
    rollMode = 'blindroll';
  }

  // "Inhuman" stat being rolled, logic is different per page 188 of the Handler's Guide.
  // Note - originally implemented by Uriele, but my attempt at merging conficts went poorly, so re-implementing.
  // For an inhuman check, the roll succeeds except on a roll of 100 which fails AND fumbles.
  // If the roll is a matching digit roll, it is a critical as normal.
  // Also, if the roll is below the regular (non-x5) value of the stat, it is a critical.  E.g. a CON of 25, a d100 roll of 21 would be a critical.
  if(target > 99 && skillIsStatTest(skillName)){

    label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${skillName} [${game.i18n.localize("DG.Roll.Inhuman").toUpperCase()}]</b> ${game.i18n.localize("DG.Roll.Target")} ${Math.floor(target / 5)}`;

    if(total === 100){
      // only possible fail criteria, and also a fumble.
      isSuccess = false;
      isCritical = true;
    }
    else{
      isSuccess = true;
      if(total <= (target / 5.0)){
        isCritical = true;
      }
      else if(skillCheckResultIsCritical(total)){
        isCritical = true;
      }
      else{
        isCritical = false;
      }
    }

  }
  else{

    label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${skillName}</b> ${game.i18n.localize("DG.Roll.Target")} ${target}`;
    label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${skillName}</b> ${game.i18n.localize("DG.Roll.Target")} ${target}`;

    isCritical = skillCheckResultIsCritical(total);

    if(total <= target){
      isSuccess = true;
    }

  }

  if(isCritical){
    resultString = `${game.i18n.localize("DG.Roll.Critical")} `;
  }

  if(isSuccess){
    resultString += `${game.i18n.localize("DG.Roll.Success")}`;

    if(isCritical){
      resultString = resultString.toUpperCase() + '!';
      styleOverride="color: green";
    }
  }
  else{
    let skillSlug = `system.skills.${skill.key}.failure`;
    if (typeof skill === "object") {      
      if (typeof skill.cannotBeImprovedByFailure === "undefined") {
        skill.typedSkill = true;
      }
      if (actor.type === "agent" && !skill.cannotBeImprovedByFailure) {
        if (skill.typedSkill) {
          skillSlug = `system.typedSkills.${skill.key}.failure`
        }
        await actor.update({ [skillSlug]: true});
      }
    }
    resultString += `${game.i18n.localize("DG.Roll.Failure")}`;

    if(isCritical){
      resultString = resultString.toUpperCase() + '!';
      styleOverride="color: red";
    }
  }

  html = `<div class="dice-roll">`
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
    label = `Rolling <b>DAMAGE</b> for <b>${label.toUpperCase()}</b>`
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
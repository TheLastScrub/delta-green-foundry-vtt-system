export function sendPercentileTestToChat(actor, skill, target){
  let roll = new Roll('1D100', actor.data.data).roll();
  let total = roll.total;
  let isCritical = false;
  let isSuccess = false;
  let html = '';
  let label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${skill}</b> ${game.i18n.localize("DG.Roll.Target")} ${target}`;
  let resultString = '';
  let styleOverride = '';

  isCritical = skillCheckResultIsCritical(total);

  if(total <= target){
    isSuccess = true;
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
    type: CHAT_MESSAGE_TYPES.ROLL,
    roll: roll,
    rollMode: game.settings.get("core", "rollMode")
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

export function sendLethalityTestToChat(actor, weaponName, target){
  let roll = new Roll('1D100', actor.data.data).roll();
  let isCritical = false;
  let skillCheckTotal = roll.total;
  

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
    type: CHAT_MESSAGE_TYPES.ROLL,
    roll: roll,
    rollMode: game.settings.get("core", "rollMode")
    };

  // play the dice rolling sound, like a regular in-chat roll
  AudioHelper.play({src: "sounds/dice.wav", volume: 0.8, autoplay: true, loop: false}, true);

  ChatMessage.create(chatData, {});
}

export function sendDamageRollToChat(actor, label, diceFormula){
  let roll = new Roll(diceFormula, actor.data.data);
  
  try{
    label = `${game.i18n.localize("DG.Roll.Rolling")} <b>${game.i18n.localize("DG.Roll.Damage").toUpperCase()}</b> ${game.i18n.localize("DG.Roll.For")} <b>${label.toUpperCase()}</b>`;
  }
  catch{
    label = `Rolling <b>DAMAGE</b> for <b>${label.toUpperCase()}</b>`
  }
  
  roll.roll().toMessage({
  speaker: ChatMessage.getSpeaker({ actor: actor }),
  flavor: label,
  type: CHAT_MESSAGE_TYPES.ROLL,
  roll: roll,
  rollMode: game.settings.get("core", "rollMode")
  });
}

export async function showModifyPercentileTestDialogue(actor, label, originalTarget, isLethalityTest){
  
  let template = "systems/deltagreen/templates/dialog/modify-percentile-roll.html";
  let backingData = {
    data:{
      label: label,
      originalTarget: originalTarget,
      targetModifier: 20
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
            let targetModifier = html.find("[name='targetModifier']").val();  // this is text as a heads up
          
            let newTarget = parseInt(originalTarget); // this should be an int, but technically the incoming value is text, so parse it just to be safe
            if(targetModifier.trim() != "" && !isNaN(targetModifier)){
              newTarget += parseInt(targetModifier);
            }
            
            if(isLethalityTest){
              sendLethalityTestToChat(actor, label, newTarget);
            }
            else{
              sendPercentileTestToChat(actor, label, newTarget);
            }
          }
          catch(ex){
            console.log(ex);
          }
        }
      }
    }
    }
  ).render(true);
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
            
            sendDamageRollToChat(actor, label, newRoll);
          }
          catch(ex){
            console.log(ex);
          }
        }
      }
    }
    }
  ).render(true);
}
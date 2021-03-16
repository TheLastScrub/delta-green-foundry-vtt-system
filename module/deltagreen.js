// Import Modules
import { DeltaGreenActor } from "./actor/actor.js";
import { DeltaGreenActorSheet } from "./actor/actor-sheet.js";
import { DeltaGreenItem } from "./item/item.js";
import { DeltaGreenItemSheet } from "./item/item-sheet.js";
import { sendPercentileTestToChat, sendLethalityTestToChat, sendDamageRollToChat } from "./roll/roll.js";
import { registerSystemSettings } from "./settings.js"
import { preloadHandlebarsTemplates } from "./templates.js";

Hooks.once('init', async function() {

  game.deltagreen = {
    DeltaGreenActor,
    DeltaGreenItem,
    rollItemMacro,
    rollItemSkillCheckMacro,
    rollSkillMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "@statistics.dex.value",
    decimals: 0
  };

  // Register System Settings
  registerSystemSettings();

  // Define custom Entity classes
  CONFIG.Actor.entityClass = DeltaGreenActor;
  CONFIG.Item.entityClass = DeltaGreenItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("deltagreen", DeltaGreenActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("deltagreen", DeltaGreenItemSheet, { makeDefault: true });
  
  // Preload Handlebars Templates
  preloadHandlebarsTemplates();

  // Add Handlebars helpers
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    try {
      return str.toLowerCase();
    } catch (error) {
      return "";
    }
  });

  Handlebars.registerHelper('toUpperCase', function(str) {
    try {
      return str.toUpperCase();
    } catch (error) {
      return "";
    }
  });

  Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
  });

  Handlebars.registerHelper('if_gt', function(a, b, trueVal, falseVal) {
    if (a > b) {
        return trueVal;
    } else {
        return falseVal;
    }
  });

  Handlebars.registerHelper('cite_ahb', function(page) {
    return "See page " + str(page) + " of the Agent's Handbook.";
  });

  Handlebars.registerHelper('formatLethality', function(lethality) {
    if (lethality > 0) {
      return lethality.toString() + "%";
    }
    else {
      return "";
    }
  });

  Handlebars.registerHelper('getActorSkillProp', function(actorData, skillName, prop) {
    if(skillName != "" && prop != ""){
      let skills = actorData.skills;
      let skill = skills[skillName];
      let propVal = skill[prop];
      return propVal;
    }
    else{
      return "";
    }
  });

  // looks at system setting for what font to use and returns the class that is then used in the handlebars template that 
  // generates the character sheet.
  Handlebars.registerHelper('getFontFamilySystemSettingClass', function() {
    let setting = game.settings.get("deltagreen", "characterSheetFont");
    
    if(setting === "TypeWriterCondensed"){
      return "typewriter-condensed-font";
    }
    else if(setting === "Martel"){
      return "martel-font";
    }
    else if(setting === "Signika"){
      return "signika-font";
    }
    else if(setting === "atwriter"){
      return "atwriter-font";
    }
    else{
      return "martel-font";
    }
    
  });
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createDeltaGreenMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDeltaGreenMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.deltagreen.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "deltagreen.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  
  if(!actor) return ui.notifications.warn('Must have an Actor selected first.');

  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}

function rollItemSkillCheckMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  if(!actor) return ui.notifications.warn('Must have an Actor selected first.');

  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  let skillName = item.data.data.skill.toString();

  let skill = actor.data.data.skills[skillName];
  let translatedSkillLabel = "";

  try{
    translatedSkillLabel = game.i18n.localize("DG.Skills." + skillName)
  }
  catch{
    translatedSkillLabel = skillName;
  }

  sendPercentileTestToChat(actor, translatedSkillLabel, skill.proficiency);
}

function rollSkillMacro(skillName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  
  if(!actor) return ui.notifications.warn('Must have an Actor selected first.');

  let skill = actor.data.data.skills[skillName];

  if(!skill) return ui.notifications.warn('Bad skill name passed to macro.');

  let translatedSkillLabel = "";

  try{
    translatedSkillLabel = game.i18n.localize("DG.Skills." + skillName)
  }
  catch{
    translatedSkillLabel = skillName;
  }

  sendPercentileTestToChat(actor, translatedSkillLabel, skill.proficiency);
}
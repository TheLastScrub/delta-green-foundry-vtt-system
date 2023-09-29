/* globals $ Hooks game CONFIG Actors Items ActorSheet ItemSheet Handlebars Macro ChatMessage ui duplicate arguments */

// Import Modules
import DeltaGreenActor from "./actor/actor.js";
import DeltaGreenActorSheet from "./actor/actor-sheet.js";
import DeltaGreenItem from "./item/item.js";
import DeltaGreenItemSheet from "./item/item-sheet.js";
import * as DGRolls from "./roll/roll.js";
import registerSystemSettings from "./settings.js";
import preloadHandlebarsTemplates from "./templates.js";
import ParseDeltaGreenStatBlock from "./other/stat-parser-macro.js";
import DGUtils from "./other/utility-functions.js";

Hooks.once("init", async () => {
  game.deltagreen = {
    DeltaGreenActor,
    DeltaGreenItem,
    rollItemMacro,
    rollItemSkillCheckMacro,
    rollSkillMacro,
    ParseDeltaGreenStatBlock,
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "@statistics.dex.value",
    decimals: 0,
  };

  // Register custom dice rolls
  Object.values(DGRolls).forEach((cls) => CONFIG.Dice.rolls.push(cls));

  // Register System Settings
  registerSystemSettings();

  // Define custom Entity classes
  CONFIG.Actor.documentClass = DeltaGreenActor;
  CONFIG.Item.documentClass = DeltaGreenItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);
  Actors.registerSheet("deltagreen", DeltaGreenActorSheet, {
    makeDefault: true,
  });
  Items.registerSheet("deltagreen", DeltaGreenItemSheet, { makeDefault: true });

  // Preload Handlebars Templates
  preloadHandlebarsTemplates();

  // Add Handlebars helpers
  Handlebars.registerHelper(
    "localizeWithFallback",
    function (value, fallbackValue) {
      return DGUtils.localizeWithFallback(value, fallbackValue);
    },
  );

  Handlebars.registerHelper("concat", (...args) => {
    let outStr = "";
    for (const arg in args) {
      if (typeof args[arg] !== "object") {
        outStr += args[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper("toLowerCase", (str) => {
    try {
      return str.toLowerCase();
    } catch (error) {
      return "";
    }
  });

  Handlebars.registerHelper("toUpperCase", (str) => {
    try {
      return str.toUpperCase();
    } catch (error) {
      return "";
    }
  });

  Handlebars.registerHelper("if_eq", (a, b, opts) => {
    if (a === b) {
      return opts.fn(this);
    }
    return opts.inverse(this);
  });

  Handlebars.registerHelper("if_not_eq", (a, b, opts) => {
    if (a !== b) {
      return opts.fn(this);
    }
    return opts.inverse(this);
  });

  Handlebars.registerHelper("if_gt", (a, b, trueVal, falseVal) => {
    if (a > b) {
      return trueVal;
    }
    return falseVal;
  });

  Handlebars.registerHelper("cite_ahb", (page) => {
    return `See page ${page} of the Agent's Handbook.`;
  });

  Handlebars.registerHelper("formatLethality", (lethality) => {
    if (lethality > 0) {
      return `${lethality.toString()}%`;
    }
    return "";
  });

  // Is this used anywhere?
  Handlebars.registerHelper(
    "getActorSkillProp",
    (actorData, skillName, prop) => {
      try {
        if (skillName !== "" && prop !== "") {
          const { skills } = actorData.data;
          const skill = skills[skillName];
          const propVal = skill[prop];
          return propVal;
        }
        return "";
      } catch (ex) {
        console.log(ex);
        return "";
      }
    },
  );

  Handlebars.registerHelper("getAvailableRollModes", () => {
    try {
      return CONFIG.Dice.rollModes;
    } catch (error) {
      return console.log(error);
    }
  });

  Handlebars.registerHelper("getDefaultRollMode", () => {
    try {
      return game.settings.get("core", "rollMode");
    } catch (error) {
      return console.log(error);
    }
  });

  Handlebars.registerHelper(
    "calculateHandToHandCombatDamageFormulaBonus",
    (strength) => {
      try {
        let bonus = "";

        if (strength.value < 5) {
          bonus = " - 2";
        } else if (strength.value < 9) {
          bonus = " - 1";
        } else if (strength.value > 12 && strength < 17) {
          bonus = " + 1";
        } else if (strength.value > 16) {
          bonus = " + 2";
        }

        return bonus;
      } catch (error) {
        return console.log(error);
      }
    },
  );

  Handlebars.registerHelper("localizeWeaponSkill", (skill) => {
    let label = skill;

    try {
      if (skill === "dex") {
        label = game.i18n.localize("DG.Attributes.dex");
      }
      if (skill === "DG.Skills.custom") {
        label = game.i18n.localize("DG.ItemWindow.Custom");
      } else {
        label = game.i18n.localize(`DG.Skills.${skill}`);
      }
    } catch (error) {
      console.log(error);
    }

    return label;
  });

  Handlebars.registerHelper(
    "hideSkillBasedOnProficiencyAndUserChoice",
    (hideUntrainedSkills, proficiency) => {
      let showValue = true;

      try {
        if (hideUntrainedSkills === false) {
          showValue = true;
        } else if (proficiency > 0) {
          showValue = true;
        } else {
          showValue = false;
        }
      } catch (error) {
        console.log(error);
      }

      return showValue;
    },
  );

  // looks at system setting for what font to use and returns the class that is then used in the handlebars template that
  // generates the character sheet.
  Handlebars.registerHelper("getFontFamilySystemSettingClass", () => {
    const setting = game.settings.get("deltagreen", "characterSheetFont");

    const characterSheetStyle = game.settings.get(
      "deltagreen",
      "characterSheetStyle",
    );

    /*
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
    else if(setting === "SpecialElite"){
      return "special-elite-font";
    }
    else if(setting === "PublicSans"){
      return "public-sans-font";
    }
    else{
      return "martel-font";
    }
    */

    /*
    if(characterSheetStyle === "cowboy"){
      return "special-elite-font";
    }
    else{
      return "public-sans-font";
    }
    */
  });

  Handlebars.registerHelper("getCharacterSheetStyle", () => {
    const characterSheetStyle = game.settings.get(
      "deltagreen",
      "characterSheetStyle",
    );

    if (characterSheetStyle === "cowboy") {
      return "cowboy-style";
    }
    if (characterSheetStyle === "outlaw") {
      return "outlaw-style";
    }
    return "program-style";
  });

  Handlebars.registerHelper("keepSanityPrivate", () => {
    let setting = false;

    try {
      setting = game.settings.get("deltagreen", "keepSanityPrivate");

      if (game.user.isGM) {
        setting = false;
      }
    } catch (ex) {
      setting = false;
    }

    return setting;
  });
});

Handlebars.registerHelper("playerHasGamemasterPrivileges", () => {
  return game.user.isGM;
});

Handlebars.registerHelper("showImpossibleLandscapesContent", () => {
  let result = false;
  const setting = game.settings.get(
    "deltagreen",
    "showImpossibleLandscapesContent",
  );

  if (game.user.isGM === true && setting === true) {
    result = true;
  }

  return result;
});

Hooks.once("ready", async () => {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) =>
    createDeltaGreenMacro(data, slot),
  );
});

Hooks.on("ready", () => {
  // let backgroundImageSetting = game.settings.get("deltagreen", "characterSheetBackgroundImageSetting");
  // let characterSheetStyle = game.settings.get("deltagreen", "characterSheetStyle");
  // let customCss = "";
  // let customStyle = document.createElement("style");
  // customStyle.id = "dg-custom-css";
  /*
  if(backgroundImageSetting === "OldPaper1"){
    customCss += `div.deltagreen.sheet.actor section.window-content{
          background: url("systems/deltagreen/assets/img/old_paper.jpg") !important;
    }`;
  }
  else if(backgroundImageSetting === "IvoryPaper"){
    customCss += `div.deltagreen.sheet.actor section.window-content{
          background-size: 100% !important;
    }`;
  }
  */
  /*
  if(characterSheetStyle === "cowboy"){
    customCss += `div.deltagreen.sheet.actor section.window-content{
          background: url("systems/deltagreen/assets/img/old_paper.jpg") !important;
    }`;
  }
  else if(characterSheetStyle === "program"){
    customCss += `div.deltagreen.sheet.actor section.window-content{
        background: url("systems/deltagreen/assets/img/CrumpledPlainPaper10.webp") !important;
      }`;
  }

  customStyle.innerHTML = customCss;

  if(customCss != ""){
    //document.querySelector("head").appendChild(customStyle);
  }
  */
});

Hooks.on("preCreateItem", (item) => {
  console.log("preCreateItem");
  console.log(item.img);
  console.log(item.type);

  if (item.img === "icons/svg/item-bag.svg") {
    if (item.type === "bond") {
      item.updateSource({
        img: "systems/deltagreen/assets/icons/person-black-bg.svg",
      });
    } else {
      item.updateSource({
        img: "systems/deltagreen/assets/icons/swap-bag-black-bg.svg",
      });
    }
  }
});

Hooks.on("renderSidebarTab", async (app, html) => {
  if (app.options.id === "actors") {
    const button = $(
      "<button class='import-cd'><i class='fas fa-file-import'></i> Parse Stat Block</button>",
    );

    button.click(() => {
      ParseDeltaGreenStatBlock();
    });

    html.find(".directory-footer").append(button);
  }
});

// Note - this event is fired on ALL connected clients...
Hooks.on("createActor", async (actor, options, userId) => {
  try {
    // use this to trap on if this hook is firing for the same user that triggered the create
    // can put logic specific to a particular user session below
    if (userId !== game.user.id) return;

    if (actor !== null) {
      if (actor.type === "agent") {
        // update the default type skill of Art - Painting's labels to try to be localized
        // since I really backed myself into a corner on this with my implementation of it...
        console.log("createActor Hook");

        const artLabel = game.i18n.translations.DG?.TypeSkills?.Art ?? "Art";
        const paintingLabel =
          game.i18n.translations.DG?.TypeSkills?.Subskills?.Painting ??
          "Painting";

        const updatedData = duplicate(actor.system);
        updatedData.typedSkills.tskill_01.group = artLabel;
        updatedData.typedSkills.tskill_01.label = paintingLabel;

        actor.update({ data: updatedData });

        // throw on an unarmed strike item for convenience
        actor.AddUnarmedAttackItemIfMissing();
      } else if (actor.type === "unnatural") {
        // Do nothing.
      } else if (actor.type === "vehicle") {
        actor.AddBaseVehicleItemsIfMissing();
      }
    }
  } catch (ex) {
    console.log(ex);
  }
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
  // Definitely should not be doing assignments in conditionals but if we fix this, it breaks macro creation.
  // eslint-disable-next-line no-cond-assign
  if ((data.type = "Item" && data.itemData.type !== "weapon")) return;
  // if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.itemData;

  // Create the macro command
  let command = "// Uncomment line below to also roll skill check if desired.";
  command += `\n//game.deltagreen.rollItemSkillCheckMacro("${item._id}");`;
  command += `\ngame.deltagreen.rollItemMacro("${item._id}");`;

  // let macro = game.macros.entities.find(m => (m.name === data.name) && (m.command === command));
  // if (!macro) {
  const macro = await Macro.create({
    name: data.itemData.name,
    type: "script",
    img: data.itemData.img,
    command,
    flags: { "deltagreen.itemMacro": true },
  });
  // }

  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
async function rollItemMacro(itemId) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn("Must have an Actor selected first.");

  let item = actor ? actor.items.find((i) => i._id === itemId) : null;

  // for backwards compatibility with older macros, where I unwisely set it to use name instead of id
  if (!item) {
    item = actor ? actor.items.find((i) => i.name === itemId) : null;
  }

  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item named ${itemId}`,
    );

  // Trigger the item roll
  const r = await item.roll();

  return r;
}

function rollItemSkillCheckMacro(itemId) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn("Must have an Actor selected first.");

  let item = actor ? actor.items.find((i) => i._id === itemId) : null;

  // for backwards compatibility with older macros, where I unwisely set it to use name instead of id
  if (!item) {
    item = actor ? actor.items.find((i) => i.name === itemId) : null;
  }

  if (!item)
    return ui.notifications.warn(
      `Your controlled Actor does not have an item '${item.name}'`,
    );

  const skillName = item.system.skill.toString();

  const roll = new DGRolls.DGPercentileRoll(
    "1D100",
    {},
    { rollType: "weapon", key: skillName, actor, item },
  );
  return actor.sheet.processRoll({}, roll);
}

function rollSkillMacro(skillName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);

  if (!actor)
    return ui.notifications.warn("Must have an Actor selected first.");

  const skill = actor.system.skills[skillName];

  if (!skill) return ui.notifications.warn("Bad skill name passed to macro.");

  const roll = new DGRolls.DGPercentileRoll(
    "1D100",
    {},
    { rollType: "skill", key: skillName, actor },
  );
  return actor.sheet.processRoll({}, roll);
  // sendPercentileTestToChat(actor, translatedSkillLabel, skill.proficiency);
}

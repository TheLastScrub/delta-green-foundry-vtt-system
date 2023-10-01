/* globals $ Hooks game CONFIG Actors Items ActorSheet ItemSheet duplicate */

// Import Modules
import DeltaGreenActor from "./actor/actor.js";
import DeltaGreenActorSheet from "./actor/actor-sheet.js";
import DeltaGreenItem from "./item/item.js";
import DeltaGreenItemSheet from "./item/item-sheet.js";
import * as DGRolls from "./roll/roll.js";
import registerSystemSettings from "./settings.js";
import preloadHandlebarsTemplates from "./templates.js";
import registerHandlebarsHelpers from "./other/register-helpers.js";
import ParseDeltaGreenStatBlock from "./other/stat-parser-macro.js";
import {
  createDeltaGreenMacro,
  rollItemMacro,
  rollItemSkillCheckMacro,
  rollSkillMacro,
} from "./other/macro-functions.js";

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
  registerHandlebarsHelpers();
});

Hooks.once("ready", async () => {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) =>
    createDeltaGreenMacro(data, slot),
  );
});

Hooks.on("preCreateItem", (item) => {
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
